import { businessLabelClass } from "../components/BusinessField";
import { businessControlClass } from "../components/BusinessField";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useProfileLocations } from "./useProfileLocations";
import type { BusinessProfile } from "./profile";
import { useLanguage } from "@/features/locale/language";

const field = businessControlClass;
const label = businessLabelClass;

interface Props {
  name: string;
  phone: string;
  draft: BusinessProfile;
  onNameChange: (name: string) => void;
  onChange: <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const labels = {
  az: { title: "Şəxsi məlumatlar", detail: "Əlaqə və profil məlumatlarınız", gender: "Cins", female: "Qadın", male: "Kişi", name: "Ad və soyad", phone: "Mobil nömrə", language: "İnterfeys dili", country: "Ölkə", region: "Ştat / region", city: "Şəhər", about: "Haqqında", save: "Dəyişiklikləri yadda saxla" },
  ru: { title: "Личные данные", detail: "Ваши контактные данные и профиль", gender: "Пол", female: "Женщина", male: "Мужчина", name: "Имя и фамилия", phone: "Номер телефона", language: "Язык интерфейса", country: "Страна", region: "Штат / регион", city: "Город", about: "О себе", save: "Сохранить изменения" },
  tr: { title: "Kişisel bilgiler", detail: "İletişim ve profil bilgileriniz", gender: "Cinsiyet", female: "Kadın", male: "Erkek", name: "Ad ve soyad", phone: "Telefon numarası", language: "Arayüz dili", country: "Ülke", region: "Eyalet / bölge", city: "Şehir", about: "Hakkında", save: "Değişiklikleri kaydet" },
  en: { title: "Personal details", detail: "Your contact and profile details", gender: "Gender", female: "Woman", male: "Man", name: "Full name", phone: "Mobile number", language: "Interface language", country: "Country", region: "State / region", city: "City", about: "About", save: "Save changes" },
};

export default function PersonalProfileForm({ name, phone, draft, onNameChange, onChange, onSubmit }: Props) {
  const { language, setLanguage } = useLanguage();
  const text = labels[language];
  const { status, countries } = useProfileLocations();
  const selectedCountry = countries.find((country) => country.code === draft.country);
  const [regionId, setRegionId] = useState<number | null>(null);
  const regions = selectedCountry?.regions ?? [];
  const currentCity = selectedCountry?.cities.find((city) => city.id === draft.cityId || city.canonicalName === draft.city);
  const selectedRegionId = regionId ?? currentCity?.regionId ?? regions[0]?.id ?? null;
  const availableCities = useMemo(() => regions.length ? selectedCountry?.cities.filter((city) => city.regionId === selectedRegionId) ?? [] : selectedCountry?.cities ?? [], [selectedCountry, selectedRegionId, regions.length]);
  useEffect(() => {
    if (status !== "ready") return;
    const country = countries.find((item) => item.code === draft.country) ?? countries[0];
    if (country?.code !== draft.country) onChange("country", country?.code ?? "");
    if (!availableCities.some((city) => city.canonicalName === draft.city)) {
      onChange("city", availableCities[0]?.canonicalName ?? "");
      onChange("cityId", availableCities[0]?.id ?? null);
    } else if (draft.cityId !== availableCities.find((city) => city.canonicalName === draft.city)?.id) {
      onChange("cityId", availableCities.find((city) => city.canonicalName === draft.city)?.id ?? null);
    }
  }, [status, countries, draft.country, draft.city, draft.cityId, availableCities, onChange]);
  const unavailable = status === "error" ? { az: "Ölkə və şəhərləri yükləmək mümkün olmadı.", ru: "Не удалось загрузить страны и города.", tr: "Ülkeler ve şehirler yüklenemedi.", en: "Could not load countries and cities." }[language] : "";
  return <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="border-b border-slate-100 pb-4">
      <h3 className="text-sm font-bold text-slate-900">{text.title}</h3>
      <p className="mt-1 text-xs font-medium text-slate-400">{text.detail}</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <span className={label}>{text.gender}</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:max-w-xs">
          {([{ id: "female", title: text.female }, { id: "male", title: text.male }] as const).map((item) => {
            const selected = draft.gender === item.id;
            const selectedStyle = item.id === "female" ? "border-2 border-pink-500 bg-pink-50 text-pink-700" : "border-2 border-blue-600 bg-blue-50 text-blue-700";
            return <button key={item.id} type="button" aria-pressed={selected} onClick={() => onChange("gender", item.id)} className={`min-h-11 cursor-pointer rounded-xl text-xs font-bold transition ${selected ? selectedStyle : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{item.title}</button>;
          })}
        </div>
      </div>
      <label className={label}>{text.name} *<input value={name} onChange={(event) => onNameChange(event.target.value)} className={field} required minLength={2} autoComplete="name" /></label>
      <div className={label}>{text.phone}
        <div className={`${field} flex items-center bg-slate-100 text-slate-700`} aria-label={`${text.phone}: +994 ${phone}`}>
          <span aria-hidden="true">🇦🇿</span><span className="ml-2">+994 {phone}</span>
        </div>
      </div>
      <label className={label}>{text.language}<select value={language} onChange={(event) => { const next = event.target.value as BusinessProfile["language"]; onChange("language", next); setLanguage(next); }} className={field}><option value="az">Azərbaycan dili (AZ)</option><option value="ru">Русский (RU)</option><option value="tr">Türkçe (TR)</option><option value="en">English (EN)</option></select></label>
      <label className={label}>{text.country}<select value={selectedCountry?.code ?? ""} onChange={(event) => { const country = countries.find((item) => item.code === event.target.value); const firstRegion = country?.regions?.[0]; const firstCity = country?.cities.find((city) => !firstRegion || city.regionId === firstRegion.id); setRegionId(firstRegion?.id ?? null); onChange("country", country?.code ?? ""); onChange("city", firstCity?.canonicalName ?? ""); onChange("cityId", firstCity?.id ?? null); }} className={field} disabled={status !== "ready"} required><option value="">{status === "loading" ? "…" : "—"}</option>{countries.map((country) => <option key={country.code} value={country.code}>{country.flag ? `${country.flag} ` : ""}{country.name}</option>)}</select></label>
      {regions.length > 0 && <label className={label}>{text.region}<select value={selectedRegionId ?? ""} onChange={(event) => { const nextId = Number(event.target.value); setRegionId(nextId); const firstCity = selectedCountry?.cities.find((city) => city.regionId === nextId); onChange("city", firstCity?.canonicalName ?? ""); onChange("cityId", firstCity?.id ?? null); }} className={field} required>{regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>}
      <label className={label}>{text.city}<select value={availableCities.some((city) => city.canonicalName === draft.city) ? draft.city : ""} onChange={(event) => { onChange("city", event.target.value); onChange("cityId", availableCities.find((city) => city.canonicalName === event.target.value)?.id ?? null); }} className={field} disabled={status !== "ready" || !selectedCountry} required><option value="">—</option>{availableCities.map((city) => <option key={city.id} value={city.canonicalName}>{city.name}</option>)}</select></label>
      <label className={`${label} sm:col-span-2`}>{text.about}<textarea rows={3} value={draft.bio} onChange={(event) => onChange("bio", event.target.value)} className={`${field} h-auto min-h-24 resize-y py-3`} /></label>
    </div>
    {unavailable && <p role="alert" className="text-sm text-red-700">{unavailable}</p>}
    <div className="flex justify-end pt-1"><button type="submit" disabled={status !== "ready" || !selectedCountry || !draft.city} className="min-h-11 w-full cursor-pointer rounded-xl bg-brand-primary px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{text.save}</button></div>
  </form>;
}
