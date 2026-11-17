import { X } from "lucide-react";
import { useCustomerText } from "@/features/locale/customerText";

/** Close control shared by dialogs with custom headers. */
export default function ModalCloseButton({ onClick }: { onClick: () => void }) {
  const translateUi = useCustomerText();
  return <button type="button" onClick={onClick} aria-label={translateUi("Bağla")} title={translateUi("Bağla")} className="z-ui-close"><X size={16} strokeWidth={2} aria-hidden="true" /></button>;
}
