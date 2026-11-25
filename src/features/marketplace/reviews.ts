export interface PublicReview {
  id: string;
  name: string;
  email?: string;
  rating: number;
  text: string;
  date: string;
  reply?: string;
  serviceName?: string;
  masterName?: string;
  status?: "published" | "hidden";
}
