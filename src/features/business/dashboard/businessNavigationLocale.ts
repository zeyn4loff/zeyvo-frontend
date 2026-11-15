import type { Language } from "@/features/locale/language";
import type { BusinessSection } from "./BusinessSidebarNav";

const labels: Record<BusinessSection, Record<Language, string>> = {
  calendar: { az: "Qəbullar & Təqvim", ru: "Записи и календарь", tr: "Randevular ve takvim", en: "Bookings & calendar" },
  business: { az: "Biznes", ru: "Бизнес", tr: "İşletme", en: "Business" },
  resources: { az: "Resurslar", ru: "Ресурсы", tr: "Kaynaklar", en: "Resources" },
  products: { az: "Məhsullar", ru: "Товары", tr: "Ürünler", en: "Products" },
  staff: { az: "Ustalar və Heyət", ru: "Мастера и команда", tr: "Uzmanlar ve ekip", en: "Specialists & team" },
  services: { az: "Xidmətlər", ru: "Услуги", tr: "Hizmetler", en: "Services" },
  clients: { az: "Müştərilər", ru: "Клиенты", tr: "Müşteriler", en: "Clients" },
  loyalty: { az: "Loyallıq", ru: "Лояльность", tr: "Sadakat", en: "Loyalty" },
  marketing: { az: "Marketinq", ru: "Маркетинг", tr: "Pazarlama", en: "Marketing" },
  integrations: { az: "İnteqrasiyalar", ru: "Интеграции", tr: "Entegrasyonlar", en: "Integrations" },
  finance: { az: "Maliyyə & Kassa", ru: "Финансы и касса", tr: "Finans ve kasa", en: "Finance & cash" },
  profile: { az: "Profil", ru: "Профиль", tr: "Profil", en: "Profile" },
};

export function businessNavigationLabel(section: BusinessSection, language: Language) { return labels[section][language]; }

const shellLabels = {
  openMenu: { az: "Menyunu aç", ru: "Открыть меню", tr: "Menüyü aç", en: "Open menu" },
  closeMenu: { az: "Menyunu bağla", ru: "Закрыть меню", tr: "Menüyü kapat", en: "Close menu" },
  close: { az: "Bağla", ru: "Закрыть", tr: "Kapat", en: "Close" },
  partnerMenu: { az: "Partnyor menyusu", ru: "Меню партнёра", tr: "İşletme menüsü", en: "Partner menu" },
  noAccess: { az: "Bu bölməyə giriş icazəniz yoxdur", ru: "У вас нет доступа к этому разделу", tr: "Bu bölüme erişim izniniz yok", en: "You do not have access to this section" },
  ownerManages: { az: "İcazələri biznes sahibi idarə edir.", ru: "Права доступа настраивает владелец бизнеса.", tr: "İzinleri işletme sahibi yönetir.", en: "The business owner manages access permissions." },
  goCalendar: { az: "Təqvimə keç", ru: "Перейти к календарю", tr: "Takvime git", en: "Go to calendar" },
  chooseBusiness: { az: "Biznes seçin", ru: "Выберите бизнес", tr: "İşletme seçin", en: "Choose a business" },
  noBranch: { az: "Filial yoxdur", ru: "Нет филиала", tr: "Şube yok", en: "No branch" },
  changeContext: { az: "Aktiv biznes və filialı dəyiş", ru: "Сменить бизнес и филиал", tr: "İşletme ve şubeyi değiştir", en: "Change business and branch" },
  logout: { az: "Hesabdan çıx", ru: "Выйти", tr: "Çıkış yap", en: "Log out" },
} as const;

export function businessShellLabel(key: keyof typeof shellLabels, language: Language): string { return shellLabels[key][language]; }
