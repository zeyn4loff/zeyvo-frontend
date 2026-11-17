
import { useCustomerText } from "@/features/locale/customerText";
export default function BusinessPageLoading() {
  const translateUi = useCustomerText();
  return <div className="flex min-h-[min(55dvh,24rem)] items-center justify-center" role="status" aria-label={translateUi("Səhifə yüklənir")}>
    <span aria-hidden="true" className="size-11 animate-spin rounded-full border-[4px] border-brand-primary border-t-transparent motion-reduce:animate-none" />
  </div>;
}
