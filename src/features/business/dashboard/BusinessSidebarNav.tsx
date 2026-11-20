import { partnerPath } from "@/features/business/partnerPath";
import { Link } from "react-router";
import { Building2, CalendarDays, Gift, Link2, Megaphone, Package, Scissors, Settings2, Users, UserRound, Wallet } from "lucide-react";
import type { BusinessSession } from "../auth/businessSession";
import { useProducts } from "../products/useProducts";
import { useStaff } from "../staff/useStaff";
import { useServices } from "../services/useServices";
import { useLanguage } from "@/features/locale/language";
import { businessNavigationLabel } from "./businessNavigationLocale";
import type { Business } from "../directory/businesses";
import { canSeeBusinessSection } from "./businessSectionAccess";
import { useCustomerText } from "@/features/locale/customerText";

const entries = [
  { id: "calendar", label: "Qəbullar & Təqvim", icon: CalendarDays },
  { id: "business", label: "Biznes", icon: Building2 },
  { id: "resources", label: "Resurslar", icon: Settings2 },
  { id: "products", label: "Məhsullar", icon: Package },
  { id: "staff", label: "Ustalar", icon: Users },
  { id: "services", label: "Xidmətlər", icon: Scissors },
  { id: "clients", label: "Müştərilər", icon: UserRound },
  { id: "loyalty", label: "Loyallıq", icon: Gift },
  { id: "marketing", label: "Marketinq", icon: Megaphone },
  { id: "integrations", label: "İnteqrasiyalar", icon: Link2 },
  { id: "finance", label: "Maliyyə & Kassa", icon: Wallet },
] as const;

export type BusinessSection = (typeof entries)[number]["id"] | "profile";

function badgeCounts(productCount: number, serviceCount: number, staffCount: number): Partial<Record<BusinessSection, number | string>> {
  return { products: productCount, staff: staffCount, services: serviceCount };
}

export default function BusinessSidebarNav({ section, session, onNavigate, access, hasBusinessContext }: { section: BusinessSection; session: BusinessSession; onNavigate: () => void; access?: Business["access"]; hasBusinessContext: boolean }) {
  const translateUi = useCustomerText();
  const { language } = useLanguage();
  const { data: productData } = useProducts(session);
  const { data: serviceData } = useServices(session);
  const { data: staffData } = useStaff(session);
  const counts = badgeCounts(productData.products.length, serviceData.services.length, staffData.members.length);
  return <div>
    <p className="mb-2 px-2 text-xs font-bold text-zinc-500">{{ az: "Əsas menyu", ru: "Главное меню", tr: "Ana menü", en: "Main menu" }[language]}</p>
    <nav className="space-y-1.5 text-xs" aria-label={translateUi("Əsas menyu")}>
      {entries.filter(({ id }) => canSeeBusinessSection(id, access, hasBusinessContext)).map(({ id, label, icon: Icon }) => {
        const active = section === id;
        return <Link key={id} to={id === "business" ? partnerPath() : partnerPath(`/${id}`)} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${active ? "bg-brand-primary font-bold text-[#101114] shadow-sm" : "font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white"}`}>
          <span className="flex min-w-0 items-center gap-2.5"><Icon size={16} className="shrink-0" /><span>{language === "az" ? label : businessNavigationLabel(id, language)}</span></span>
          {counts[id] !== undefined && <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${active ? "bg-black/10 font-black text-[#101114]" : id === "integrations" ? "bg-emerald-500/20 font-bold text-emerald-400" : "bg-white/10 font-medium text-zinc-400"}`}>{counts[id]}</span>}
        </Link>;
      })}
    </nav>
  </div>;
}

