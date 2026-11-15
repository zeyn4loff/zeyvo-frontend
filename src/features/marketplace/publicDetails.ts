import type { Salon, SalonBranch } from "./data";

export function getPublicBranches(salon: Salon): SalonBranch[] {
  return salon.branches?.length ? salon.branches : [{ id: `salon-${salon.id}`, name: salon.name, address: salon.location, hours: salon.workHours }];
}

