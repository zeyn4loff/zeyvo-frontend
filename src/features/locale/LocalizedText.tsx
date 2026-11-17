import { useCustomerText } from "./customerText";

export default function LocalizedText({ value }: { value: string | null | undefined }) {
  const t = useCustomerText();
  return <>{value == null ? null : t(value)}</>;
}
