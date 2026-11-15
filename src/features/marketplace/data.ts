export interface Category {
  id: string;
  title: string;
  azName: string;
  subcategories: { id: string; name: string; azName: string; image: string }[];
}

export interface Salon {
  id: number;
  isIndividual?: boolean;
  partner?: { ownerId: string; businessId: string };
  specialists?: Specialist[];
  city?: string;
  topCategory: string;
  category: string;
  name: string;
  tag: string;
  rating: number;
  reviewsCount: number;
  location: string;
  distance?: string;
  workHours?: string;
  description?: string;
  image: string;
  services: Service[];
  slots: string[];
  gallery?: { src: string; label: string; type?: "interior" | "works" }[];
  branches?: SalonBranch[];
  contact?: { phone?: string; website?: string; instagram?: string };
}

export interface SalonBranch { id: string; name: string; address: string; city?: string; hours?: string; phone?: string; amenities?: string[]; description?: string; logo?: string; photos?: string[]; scheduleDays?: Record<string, { isOff: boolean; open: string; close: string }>; whatsapp?: string; instagram?: string; facebook?: string; mapUrl?: string }

export interface Service { id: number; partnerServiceId?: string; name: string; category?: string; price: number; duration: string }

export function groupServices(services: Service[]): { name: string; services: Service[] }[] {
  if (!services.some((service) => service.category)) return [{ name: "", services }];
  const groups = new Map<string, Service[]>();
  services.forEach((service) => {
    const name = service.category || "Digər xidmətlər";
    groups.set(name, [...(groups.get(name) || []), service]);
  });
  return [...groups].map(([name, items]) => ({ name, services: items }));
}

export interface Specialist {
  id: number;
  partnerStaffId?: string;
  partnerBranchId?: string;
  topCategory: string;
  name: string;
  title: string;
  salonName: string;
  salonId?: number;
  experience?: string;
  rating: number;
  photo: string;
  bio?: string;
  portfolio?: { src: string; label: string; type?: "works" }[];
  services?: Service[];
}

// The catalog loader fills this shared collection before public routes render.
export const categories: Category[] = [];

export function findSalonForSpecialist(master: Specialist, salons: Salon[]): Salon | undefined {
  if (master.salonId !== undefined) return salons.find((salon) => salon.id === master.salonId);
  return undefined;
}

export function getSpecialistsForSalon(salon: Salon): Specialist[] {
  return salon.specialists ?? [];
}
