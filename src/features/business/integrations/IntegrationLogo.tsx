import { Bell, CalendarDays, CreditCard, Link2, Mail, MessageCircle, Puzzle } from "lucide-react";

type Props = { size?: "card" | "header"; icon: string | null; label: string };

const icons = { "message-circle": MessageCircle, "calendar-days": CalendarDays, "credit-card": CreditCard, link: Link2, mail: Mail, bell: Bell, puzzle: Puzzle };

export default function IntegrationLogo({ size = "card", icon, label }: Props) {
  const Icon = icons[icon as keyof typeof icons] ?? Puzzle;
  return <span role="img" aria-label={label} className={`flex shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ${size === "header" ? "size-10 sm:size-11" : "size-12"}`}><Icon size={size === "header" ? 21 : 24} strokeWidth={2} /></span>;
}
