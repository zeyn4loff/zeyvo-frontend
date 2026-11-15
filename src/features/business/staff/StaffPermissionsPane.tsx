import { useEffect, useState } from "react";
import { Check, Info, ShieldCheck } from "lucide-react";
import { showToast } from "@/components/common/toast";
import { useBusinessSession } from "../auth/useBusinessSession";
import { resolveActiveContext } from "../directory/activeContext";
import { fetchStaffInvitation, sendStaffInvitation, type ServerStaffInvitation } from "./staffInvitationApi";

import { permissionGroups, roles } from "./staffPermissions";

export default function StaffPermissionsPane({ role, permissions, phone, staffId, onRoleChange, onPermissionChange }: {
  role: string; permissions: Record<string, boolean>; name: string; email: string; phone: string; staffId?: string;
  onRoleChange: (role: string) => void; onPermissionChange: (id: string, checked: boolean) => void;
}) {
  const selected = roles.find((item) => item.id === role) ?? roles[0];
  const { session } = useBusinessSession();
  const businessId = session ? resolveActiveContext(session)?.businessId : undefined;
  const [invitePhone, setInvitePhone] = useState(phone);
  const [serverInvitation, setServerInvitation] = useState<ServerStaffInvitation | null>(null);
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState("");
  useEffect(() => {
    if (session?.kind !== "server" || !businessId || !staffId) return;
    let active = true;
    const refresh = () => { void fetchStaffInvitation(businessId, staffId).then((item) => { if (active) setServerInvitation(item); }).catch(() => {}); };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [session?.kind, businessId, staffId]);
  async function sendServerInvite() {
    if (!businessId || !staffId) { setInviteError("Əvvəlcə usta profilini yadda saxlayın."); return; }
    setSending(true);
    setInviteError("");
    try {
      setServerInvitation(await sendStaffInvitation(businessId, staffId, invitePhone));
      showToast("Dəvət göndərildi. Alıcı bildirişdən cavab verə bilər.");
    } catch (error) { setInviteError(error instanceof Error ? error.message : "Dəvət göndərilmədi."); }
    finally { setSending(false); }
  }
  return <div className="space-y-3.5 text-xs">
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold text-slate-900"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-slate-900"><ShieldCheck size={17} /></span>Sistemdə rolu və hüquqlar</h3><span className="shrink-0 rounded-full bg-lime-100 px-2.5 py-1 text-[10px] font-bold text-slate-800">{selected.badge}</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Sistemdə rol">{roles.map((item) => <button key={item.id} type="button" aria-pressed={role === item.id} onClick={() => onRoleChange(item.id)} className={`min-h-10 cursor-pointer rounded-xl border px-2.5 py-2 text-left font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${role === item.id ? "border-lime-400 bg-lime-100 text-slate-900" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"}`}>{item.label}</button>)}</div>
      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-slate-500"><Info size={14} className="mt-0.5 shrink-0" />{selected.description}</p>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="mb-3 border-b border-slate-100 pb-3"><h3 className="font-bold text-slate-900">Dəqiq icazələr</h3><p className="mt-0.5 text-[11px] text-slate-500">Hər hüququ ayrıca dəyişə bilərsiniz.</p></div>
      <div className="space-y-4">{permissionGroups.map((group) => <div key={group.title}><h4 className="mb-2 text-[11px] font-bold text-slate-500">{group.title}</h4><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{group.items.map(([id, text]) => <label key={id} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 font-medium transition ${permissions[id] ? "border-lime-300 bg-lime-50 text-slate-900" : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300"}`}><input type="checkbox" checked={Boolean(permissions[id])} onChange={(event) => onPermissionChange(id, event.target.checked)} className="peer sr-only" /><span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-md border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-900 ${permissions[id] ? "border-lime-400 bg-brand-primary" : "border-slate-300 bg-white"}`}>{permissions[id] && <Check size={14} strokeWidth={3} />}</span><span>{text}</span></label>)}</div></div>)}</div>
    </section>
    {session?.kind === "server" && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div><h3 className="font-bold text-slate-900">Telefonla komandaya dəvət</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">Qeydiyyatdan keçmiş partnyor nömrəsini daxil edin. Dəvət alıcı hesabındakı bildirişlərdə görünəcək.</p></div>
      {serverInvitation?.status === "accepted" ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 font-semibold text-emerald-800">✓ Qəbul edildi · {serverInvitation.recipientPhone}</div> : <>
        <div className="flex flex-col gap-2 sm:flex-row"><label className="min-w-0 flex-1"><span className="sr-only">Alıcının mobil nömrəsi</span><input type="tel" inputMode="tel" autoComplete="tel" value={invitePhone} onChange={(event) => { setInvitePhone(event.target.value); setInviteError(""); }} placeholder="+994 50 000-00-00" className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-lime-400" /></label><button type="button" disabled={sending || !staffId || serverInvitation?.status === "pending"} onClick={sendServerInvite} className="min-h-10 rounded-xl bg-brand-primary px-4 font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">{sending ? "Göndərilir…" : "Dəvət göndər"}</button></div>
        {!staffId && <p className="text-[11px] text-slate-500">Dəvət üçün əvvəlcə usta profilini yadda saxlayın.</p>}
        {serverInvitation && <p className="text-slate-600">Son dəvət: {serverInvitation.recipientPhone} · {serverInvitation.status === "pending" ? "Cavab gözlənilir" : "Rədd edildi"}</p>}
      </>}
      {inviteError && <p role="alert" className="text-rose-600">{inviteError}</p>}
    </section>}

  </div>;
}
