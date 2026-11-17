import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import AzPhoneInput from "../components/AzPhoneInput";
import { formatPhone } from "@/lib/formatPhone";
import type { BusinessSession } from "./businessSession";
import { normalizeBusinessPhone, rememberedBusinessPhone } from "./businessCredentials";
import { BusinessAuthField } from "./BusinessAuthFields";
import CodeInput from "@/components/common/CodeInput";
import { PartnerApiError, requestPartnerCode, verifyPartnerCode } from "./partnerAuthApi";
import { useTranslations } from "@/features/locale/language";
import { readPartnerProfile } from "../profile/profileApi";
import { useCustomerText } from "@/features/locale/customerText";

interface AuthProps {
  onStart: (session: BusinessSession, remember: boolean) => void;
  onError: (message: string) => void;
}

type Pending = { phone: string; register: boolean; resendAt: number; channel: string };

function PhoneAuthForm({ onStart, onError, register }: AuthProps & { register: boolean }) {
  const translateUi = useCustomerText();
  const { t } = useTranslations();
  const [phone, setPhone] = useState(() => register ? "" : formatPhone(rememberedBusinessPhone()));
  const [name, setName] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pending]);

  const resendSeconds = pending ? Math.max(0, Math.ceil((pending.resendAt - now) / 1000)) : 0;
  const resendTime = `${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, "0")}`;

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError("");
    const digits = normalizeBusinessPhone(phone);
    if (digits.length !== 9) return onError(t("phoneRequired"));
    if (register && name.trim().length < 2) return onError(t("nameRequired"));
    setBusy(true);
    try {
      const result = await requestPartnerCode(digits, register ? "register" : "login", register ? name.trim() : undefined);
      setPending({ phone: digits, register, resendAt: Date.now() + result.retry_after * 1000, channel: result.channel });
      setNow(Date.now());
      setCode("");
    } catch (error) {
      if (error instanceof PartnerApiError && error.code === "resend_cooldown") {
        setPending({ phone: digits, register, resendAt: Date.now() + error.retryAfter * 1000, channel: error.channel || "whatsapp" });
        setNow(Date.now());
      }
      onError(error instanceof Error ? error.message : t("saveFailed"));
    }
    finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return;
    setBusy(true);
    try {
      const session = await verifyPartnerCode(pending.phone, pending.register ? "register" : "login", code);
      let avatar = "";
      let startView: "business" | "profile" = "business";
      try { const profile = await readPartnerProfile(); avatar = profile.avatar; startView = profile.startView; } catch { /* Profile loads again when opened. */ }
      onError("");
      onStart({ ...session, avatar, startView }, true);
    } catch (error) { onError(error instanceof Error ? error.message : t("wrongCode")); }
    finally { setBusy(false); }
  }

  if (pending) return <form onSubmit={verifyCode} className="space-y-4">
    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-bold">+994 {formatPhone(pending.phone)}</p>
      <p className="mt-1">{pending.channel === "test" ? "Lokal test kodu: 000000" : t(pending.channel === "sms" ? "codeViaSms" : "codeViaWhatsapp")}</p>
    </div>
    <div className="space-y-1.5"><p className="text-sm font-semibold text-slate-700">{t("code")}</p><CodeInput value={code} onChange={setCode} label={t("code")} autoFocus /></div>
    <button type="submit" disabled={busy || code.length !== 6} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">{t("verify")} <ArrowRight size={17} /></button>
    <button type="button" disabled={busy || resendSeconds > 0} onClick={async () => {
      setBusy(true);
      try {
        const result = await requestPartnerCode(pending.phone, pending.register ? "register" : "login", pending.register ? name.trim() : undefined);
        setPending({ ...pending, resendAt: Date.now() + result.retry_after * 1000, channel: result.channel });
        setNow(Date.now());
        setCode("");
        onError("");
      } catch (error) {
        if (error instanceof PartnerApiError && error.retryAfter > 0) {
          setPending({ ...pending, resendAt: Date.now() + error.retryAfter * 1000 });
          setNow(Date.now());
        }
        onError(error instanceof Error ? error.message : t("saveFailed"));
      } finally { setBusy(false); }
    }} className="min-h-11 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{resendSeconds > 0 ? `${t("resendIn")} ${resendTime}` : t("resendCode")}</button>
    <button type="button" onClick={() => { setPending(null); onError(""); }} className="min-h-11 w-full text-sm font-semibold text-slate-600">{t("changeNumber")}</button>
  </form>;

  return <form onSubmit={requestCode} className="space-y-4">
    {register && <BusinessAuthField label={t("fullName")} icon={UserRound} name="ownerName" type="text" autoComplete="name" required minLength={2} placeholder={translateUi("Məs: Əli Əliyev")} value={name} onChange={(event) => setName(event.target.value)} />}
    <label className="block space-y-1.5 text-sm font-semibold text-slate-700"><span>{t("phone")}</span><AzPhoneInput name="phone" required value={phone} onValueChange={(next) => setPhone(formatPhone(next))} /></label>
    <p className="text-xs leading-5 text-slate-500">{t("phoneCodeNote")}</p>
    <button type="submit" disabled={busy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-bold disabled:opacity-50">{busy ? t("sendingCode") : register ? t("partnerGetCodeRegister") : t("partnerGetCodeLogin")} <ArrowRight size={17} /></button>
  </form>;
}

export function BusinessLoginForm(props: AuthProps) { return <PhoneAuthForm {...props} register={false} />; }
export function BusinessRegisterForm(props: AuthProps) { return <PhoneAuthForm {...props} register />; }
