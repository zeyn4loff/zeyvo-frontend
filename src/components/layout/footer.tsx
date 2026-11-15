import { Link } from "react-router";
import { useTranslations } from "@/features/locale/language";
import { useCityPicker } from "@/features/location/city-picker-context";
import { useSiteContact } from "@/features/customer/useSiteContact";
import { useSiteBranding } from "@/features/branding/siteBrandingContext";

const currentYear = new Date().getFullYear();

export default function Footer() {
    const { t } = useTranslations();
    const openCityPicker = useCityPicker();
    const contact = useSiteContact();
    const branding = useSiteBranding("customer");
    return (
        <footer className="border-t border-gray-200 bg-white pb-16 md:pb-0">
            <div className="mx-auto max-w-7xl px-5">
                {/* Main footer */}
                <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-[2fr_0.85fr_1fr] sm:gap-10">
                    {/* Brand */}
                    <div className="space-y-3">
                        {branding?.logo_url && <Link
                            to="/"
                            className="inline-flex items-center"
                        >
                            <img src={branding.logo_url} alt="zeyvo" className="h-9 w-auto max-w-36 object-contain" />
                        </Link>}

                        {branding?.description && <p className="max-w-md text-xs leading-5 text-gray-500">{branding.description}</p>}

                    </div>

                    {/* Users */}
                    <div>
                        <h3 className="mb-3 text-xs font-semibold text-gray-900">
                            {t("forUsers")}
                        </h3>

                        <ul className="space-y-2 text-xs text-gray-600">
                            <li><Link to="/catalog" className="hover:text-black">{t("catalog")}</Link></li>
                            <li><button type="button" onClick={openCityPicker} className="hover:text-black">{t("citySelection")}</button></li>
                            <li><Link to="/partner/auth?mode=register" className="hover:text-black">{t("partnersFor")}</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="mb-3 text-xs font-semibold text-gray-900">
                            {t("contact")}
                        </h3>

                        {contact && <ul className="space-y-2 text-xs text-gray-600">
                            {contact.phone && <li>
                                <a
                                    href={`tel:${contact.phone_href}`}
                                    className="font-semibold text-gray-900 hover:text-black"
                                >
                                    {contact.phone}
                                </a>
                            </li>}
                            {contact.email && <li>
                                <a
                                    href={`mailto:${contact.email}`}
                                    className="hover:text-black"
                                >
                                    {contact.email}
                                </a>
                            </li>}
                        </ul>}
                    </div>
                </div>

                {/* Bottom footer */}
                <div className="flex flex-col gap-4 border-t border-gray-200 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        © {currentYear} Zeyvo Technologies LLC. {t("rights")}
                    </p>

                    <div className="flex items-center gap-6">
                        <Link to="/terms" className="hover:text-black">
                            {t("terms")}
                        </Link>

                        <Link to="/privacy" className="hover:text-black">
                            {t("privacy")}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
