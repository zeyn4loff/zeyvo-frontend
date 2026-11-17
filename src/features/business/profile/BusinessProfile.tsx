import { showToast as setSuccess } from "../../../components/common/toast";
import { businessControlClass } from "../components/BusinessField";
import AzPhoneInput from "../components/AzPhoneInput";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { NavLink } from "react-router";
import { useBusinessSession } from "../auth/useBusinessSession";
import type { BusinessSession } from "../auth/businessSession";
import BusinessHeaderPortal from "../components/BusinessHeaderPortal";
import { BusinessTabNav } from "../components/BusinessTabs";
import { businessTabClass } from "../components/businessTabStyles";
import ConnectedAppsPanel from "./ConnectedAppsPanel";
import SecurityPanel from "./SecurityPanel";
import PersonalProfileForm from "./PersonalProfileForm";
import ProfileIdentityBanner from "./ProfileIdentityBanner";
import { formatPhone } from "@/lib/formatPhone";
import { defaultProfile, formattedPhone, normalizeHandle, phoneDigits, type BusinessProfile, type ProfileTab } from "./profile";
import { readPartnerProfile, updatePartnerProfile, uploadPartnerAvatar, removePartnerAvatar } from "./profileApi";
import { useLanguage } from "@/features/locale/language";
import { profileCopy } from "./profileLocale";
import { useCustomerText } from "@/features/locale/customerText";
import LocalizedText from "@/features/locale/LocalizedText";


const tabs: { id: ProfileTab; title: string }[] = [
  { id: "personal", title: "Şəxsi məlumatlar" }, { id: "startpage", title: "Başlanğıc səhifə" },
  { id: "messengers", title: "Mesencerlər" }, { id: "social", title: "Sosial şəbəkələr" },
  { id: "apps", title: "Qoşulmuş tətbiqlər" }, { id: "security", title: "Təhlükəsizlik" },
];
const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6";
const field = businessControlClass;
function Field({ title, children }: { title: string; children: ReactNode }) { return <label className="block min-w-0 text-xs font-bold text-slate-600"><LocalizedText value={title} />{children}</label>; }
function SaveButton({ title = "Yadda saxla" }: { title?: string }) { return <button type="submit" className="min-h-11 w-full cursor-pointer rounded-xl bg-brand-primary px-5 text-sm font-bold sm:w-auto"><LocalizedText value={title} /></button>; }
function Notice({ error }: { error: string }) { return error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"><LocalizedText value={error} /></p> : null; }

export default function BusinessProfile({ session, tab }: { session: BusinessSession; tab: ProfileTab }) {
  const translateUi = useCustomerText();
  const { updateSession } = useBusinessSession();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(() => defaultProfile(session));
  const [name, setName] = useState(session.ownerName);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const { language } = useLanguage();
  const text = profileCopy(language);
  const phone = formatPhone(phoneDigits(profile.phone || session.phone || ""));
  useEffect(() => {
    let active = true;
    readPartnerProfile().then((value) => {
      if (!active) return;
      setProfile(value); setDraft(value); setName(value.ownerName);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Profil yüklənmədi."); });
    return () => { active = false; };
  }, [session.id]);
  const change = useCallback(<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
    setDraft((current) => ({ ...current, [key]: value })); setError("");
  }, []);
  function accepted(next: BusinessProfile, message: string) {
    if (session.avatar !== next.avatar || session.startView !== next.startView) updateSession({ ...session, avatar: next.avatar, startView: next.startView });
    setProfile(next); setDraft(next); setError(""); setSuccess(message);
  }
  async function save(next: BusinessProfile, message = "Məlumatlar yadda saxlanıldı.", fields?: Record<string, unknown>) {
    try { accepted(await updatePartnerProfile(fields ?? { ...next }), message); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Məlumatları saxlamaq mümkün olmadı."); }
  }
  async function savePersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) { setError("Ad və soyadı yoxlayın."); return; }
    try {
      const next = await updatePartnerProfile({ name: name.trim(), gender: draft.gender || null, language_code: language, city_id: draft.cityId ?? null, bio: draft.bio });
      accepted(next, "Şəxsi məlumatlar yadda saxlanıldı.");
      updateSession({ ...session, ownerName: next.ownerName, avatar: next.avatar });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Məlumatları saxlamaq mümkün olmadı."); }
  }
  function saveContacts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phoneDigits(draft.whatsapp);
    if (draft.whatsapp.trim() && digits.length !== 9) { setError("WhatsApp nömrəsi 9 rəqəmdən ibarət olmalıdır."); return; }
    const next = { ...draft, whatsapp: digits ? formattedPhone(digits) : "", telegram: normalizeHandle(draft.telegram, "telegram") };
    void save(next, undefined, { whatsapp: digits ? `+994${digits}` : null, telegram: next.telegram || null });
  }
  function saveSocial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { ...draft, instagram: normalizeHandle(draft.instagram, "instagram"), facebook: normalizeHandle(draft.facebook, "facebook"), tiktok: normalizeHandle(draft.tiktok, "tiktok"), linkedin: normalizeHandle(draft.linkedin, "linkedin") };
    void save(next, undefined, { instagram: next.instagram || null, facebook: next.facebook || null, tiktok: next.tiktok || null, linkedin: next.linkedin || null });
  }
  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1024 * 1024) { setError("PNG, JPG və ya WebP formatında, 1 MB-dan kiçik şəkil seçin."); return; }
    void uploadPartnerAvatar(file).then((next) => accepted(next, "Profil şəkli yadda saxlanıldı.")).catch((cause) => setError(cause instanceof Error ? cause.message : "Şəkli yükləmək mümkün olmadı."));
  }
  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
    <BusinessHeaderPortal slot="title"><LocalizedText value={text.title} /></BusinessHeaderPortal>
    <ProfileIdentityBanner session={session} profile={profile} fileInput={fileInput} onRemoveAvatar={() => { void removePartnerAvatar().then((next) => accepted(next, "Profil şəkli silindi.")).catch((cause) => setError(cause instanceof Error ? cause.message : "Şəkli silmək mümkün olmadı.")); }} onUploadAvatar={uploadAvatar} />
    <BusinessTabNav label={translateUi("Profil bölmələri")}>{tabs.map((item) => <NavLink key={item.id} to={`/partner/profile/${item.id}`} onClick={() => { setError(""); setSuccess(""); setDraft(profile); }} className={({ isActive }) => businessTabClass(isActive)}>{language === "az" ? item.title : ({ personal: { ru: "Личные данные", tr: "Kişisel bilgiler", en: "Personal details" }, startpage: { ru: "Стартовая страница", tr: "Başlangıç sayfası", en: "Start page" }, messengers: { ru: "Мессенджеры", tr: "Mesajlaşma", en: "Messengers" }, social: { ru: "Соцсети", tr: "Sosyal ağlar", en: "Social networks" }, apps: { ru: "Приложения", tr: "Bağlı uygulamalar", en: "Connected apps" }, security: { ru: "Безопасность", tr: "Güvenlik", en: "Security" } } as const)[item.id][language]}</NavLink>)}</BusinessTabNav>
    <Notice error={error} />
    {tab === "personal" && <PersonalProfileForm name={name} phone={phone} draft={draft} onNameChange={setName} onChange={change} onSubmit={(event) => { void savePersonal(event); }} />}
    {tab === "startpage" && <form onSubmit={(event) => { event.preventDefault(); void save(draft, "Başlanğıc səhifə yadda saxlanıldı.", { start_view: draft.startView }); }} className={`${card} space-y-4`}><div><h3 className="font-bold">{text.startTitle}</h3><p className="mt-1 text-xs text-slate-500">{text.startDetail}</p></div><div className="grid gap-2 sm:grid-cols-2">{([{ id: "business", title: "Biznes modulu", detail: "Bizneslər və filiallar" }, { id: "profile", title: "Sadəcə profil", detail: "Şəxsi məlumatlar və tənzimləmələr" }] as const).map((item) => <label key={item.id} className={`flex min-h-20 cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 ${draft.startView === item.id ? "border-[#101114] bg-amber-50" : "border-slate-200 bg-slate-50"}`}><span><strong className="block text-sm">{(item.id === "business" ? text.business : text.profile)}</strong><span className="text-xs text-slate-500">{item.id === "business" ? text.businessDetail : text.profileDetail}</span></span><input type="radio" name="startView" checked={draft.startView === item.id} onChange={() => change("startView", item.id)} className="size-4 accent-[#101114]" /></label>)}</div><div className="flex justify-end"><SaveButton title={text.save} /></div></form>}
    {tab === "messengers" && <form onSubmit={saveContacts} className={`${card} space-y-4`}><div><h3 className="font-bold">{text.messengers}</h3><p className="mt-1 text-xs text-slate-500">{text.messengerDetail}</p></div><div className="grid gap-4 sm:grid-cols-2"><Field title={text.whatsapp}><AzPhoneInput value={draft.whatsapp} onValueChange={(next) => change("whatsapp", next)} /></Field><Field title={text.telegram}><input value={draft.telegram} onChange={(event) => change("telegram", event.target.value)} className={field} placeholder={translateUi("istifadəçi_adı")} /></Field></div><div className="flex justify-end"><SaveButton title={text.save} /></div></form>}
    {tab === "social" && <form onSubmit={saveSocial} className={`${card} space-y-4`}><div><h3 className="font-bold">{text.social}</h3><p className="mt-1 text-xs text-slate-500">{text.socialDetail}</p></div><div className="grid gap-4 sm:grid-cols-2">{([{ key: "instagram", title: "Instagram" }, { key: "facebook", title: "Facebook" }, { key: "tiktok", title: "TikTok" }, { key: "linkedin", title: "LinkedIn" }] as const).map((item) => <Field key={item.key} title={item.title}><input value={draft[item.key]} onChange={(event) => change(item.key, event.target.value)} className={field} placeholder={translateUi("istifadəçi_adı")} /></Field>)}</div><div className="flex justify-end"><SaveButton title={text.save} /></div></form>}
    {tab === "apps" && <ConnectedAppsPanel />}
    {tab === "security" && <SecurityPanel session={session} />}
  </main>;
}
