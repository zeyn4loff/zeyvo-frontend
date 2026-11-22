import { useState } from "react";
import { useSearchParams } from "react-router";
import CategoryTabMenu from "@/features/marketplace/components/CategoryTabMenu";
import BeautyCategories from "./components/BeautyCategories";
import BeautyLocation from "./components/BeautyLocation";
import { categories } from "@/features/marketplace/data";
import { getPublicSalons, useMarketplaceRevision } from "@/features/marketplace/publicCatalog";
import { useCustomer } from "@/features/customer/useCustomer";
import { useLocationCity } from "@/features/location/useLocationCity";

type SortOrder = "default" | "rating" | "price";

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("beauty");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const { favoriteSalonIds, favoriteMasterIds, toggleSalonFavorite, toggleMasterFavorite } = useCustomer();
  const { city } = useLocationCity();
  useMarketplaceRevision();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLocaleLowerCase("az");
  const category = categories.find((item) => item.id === selectedCategoryId) || categories[0];

  const visibleSalons = (() => {
    const filtered = getPublicSalons().filter((salon) =>
      (salon.city || "Bakı") === city && salon.topCategory === selectedCategoryId &&
      (!selectedSubcategoryId || salon.category === selectedSubcategoryId) &&
      (!query || [salon.name, salon.tag, salon.location, ...salon.services.map((service) => service.name)]
        .some((value) => value.toLocaleLowerCase("az").includes(query)))
    );
    return [...filtered].sort((a, b) => sortOrder === "rating"
      ? b.rating - a.rating
      : sortOrder === "price"
        ? (a.services[0]?.price || 0) - (b.services[0]?.price || 0)
        : b.reviewsCount - a.reviewsCount);
  })();

  return (
    <div className="container mx-auto my-5 px-4 sm:my-12">
      <CategoryTabMenu activeId={selectedCategoryId} onSelect={(id) => {
        setSelectedCategoryId(id);
        setSelectedSubcategoryId(null);
      }} />
      <BeautyCategories category={category} selectedId={selectedSubcategoryId} onSelect={(id) => { setSelectedSubcategoryId(!id || id === selectedSubcategoryId ? null : id); document.getElementById("salons")?.scrollIntoView({ behavior: "smooth" }); }} />
      <BeautyLocation category={category} items={visibleSalons} sortOrder={sortOrder} onSortChange={setSortOrder} favoriteIds={favoriteSalonIds} favoriteMasterIds={favoriteMasterIds} onToggleFavorite={toggleSalonFavorite} onToggleMasterFavorite={toggleMasterFavorite} query={query} onClearFilters={() => { setSelectedSubcategoryId(null); setSearchParams({}); }} />
    </div>
  );
}
