export interface PublicReview {
  id: string;
  name: string;
  email?: string;
  rating: number;
  text: string;
  date: string;
  reply?: string;
  status?: "published" | "hidden";
}
