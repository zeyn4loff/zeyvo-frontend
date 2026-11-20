import { partnerPath } from "@/features/business/partnerPath";
import { Link } from "react-router";
import { ArrowLeftRight, Building2, LogOut } from "lucide-react";
import type { BusinessSession } from "../auth/businessSession";
import { useLanguage } from "@/features/locale/language";
import { businessShellLabel } from "./businessNavigationLocale";
import type { ActiveBusinessContext } from "../directory/activeContext";

interface Props {
  session: BusinessSession;
  activeContext: ActiveBusinessContext | null;
  profileActive: boolean;
  onSwitch: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

export default function BusinessSidebarFooter({ session, activeContext, profileActive, onSwitch, onProfile, onLogout }: Props) {
  const { language } = useLanguage();
  const initials = session.ownerName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("az") || "?";

  return <div className="mt-auto shrink-0 space-y-2 border-t border-white/10 pt-3">
    <button type="button" onClick={onSwitch} className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-2 text-left hover:border-brand-primary/40 hover:bg-white/10 sm:p-2.5" aria-label={businessShellLabel("changeContext", language)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-brand-primary/30 bg-brand-primary/15 text-brand-primary"><Building2 size={16} /></span>
      <span className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{activeContext?.businessName ?? businessShellLabel("chooseBusiness", language)}</strong><span className="mt-0.5 block truncate text-[10px] text-zinc-400">{activeContext?.branchName ?? businessShellLabel("noBranch", language)}</span></span>
      <ArrowLeftRight size={16} className="shrink-0 text-zinc-400" />
    </button>
    <div className={`flex min-w-0 items-center rounded-2xl transition-colors hover:bg-white/10 ${profileActive ? "bg-white/10" : ""}`}>
      <Link to={partnerPath("/profile/personal")} onClick={onProfile} aria-current={profileActive ? "page" : undefined} className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-l-2xl px-2 text-left hover:text-brand-primary">
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary text-[11px] font-black text-[#101114]">{session.avatar ? <img src={session.avatar} alt="" className="size-full object-cover" /> : initials}</span>
        <span className="min-w-0"><strong className="block truncate text-xs">{session.ownerName}</strong><span className="block truncate text-[10px] text-zinc-400">{session.phone || session.email}</span></span>
      </Link>
      <button type="button" onClick={onLogout} aria-label={businessShellLabel("logout", language)} title={businessShellLabel("logout", language)} className="mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400"><LogOut size={16} /></button>
    </div>
  </div>;
}
