import { Armchair, DoorOpen, Pencil, Trash2, Zap } from "lucide-react";
import BusinessStatusBadge from "../components/BusinessStatusBadge";
import { resourceUnits, type Resource, type ResourceStatus, statusLabels, typeLabels } from "./resources";
import LocalizedText from "@/features/locale/LocalizedText";
import { useCustomerText } from "@/features/locale/customerText";
const typeIcon = { chair: Armchair, room: DoorOpen, device: Zap };
const statusTone: Record<ResourceStatus, "success" | "warning" | "danger"> = { active: "success", busy: "warning", maintenance: "danger" };
type Props = { item: Resource; branchLabel: Map<string,string>; onEdit: (item: Resource) => void; onDelete: (item: Resource) => void; onChangeUnitStatus: (item: Resource, unitId: string, status: ResourceStatus) => void };
const nextStatus: Record<ResourceStatus, ResourceStatus> = { active: "busy", busy: "maintenance", maintenance: "active" };
export default function ResourceRow({ item, branchLabel, onEdit, onDelete, onChangeUnitStatus }: Props) {
  const translateUi = useCustomerText();
    const Icon = typeIcon[item.type];
    const units = resourceUnits(item);
    return <article className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-nowrap lg:items-center lg:py-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 lg:size-7"><Icon size={18} /></span>
      <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-2">
        <span className="hidden shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 lg:inline">{typeLabels[item.type]}</span>
        <strong className="block break-words text-sm">{item.name}</strong><span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{units.length} <LocalizedText value={"ədəd"} /></span>
        <p className="mt-1 break-words text-xs text-slate-500 lg:hidden">{typeLabels[item.type]} · {branchLabel.get(item.branchId) ?? (item.branchId ? "Əvvəlki filial" : "Filiala bağlı deyil")}</p>
        {item.notes && <p className="mt-1 break-words text-xs text-slate-500 lg:hidden">{item.notes}</p>}
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-start gap-1 sm:ml-auto sm:w-auto sm:justify-end"><div className="flex min-w-0 flex-1 flex-wrap gap-1 sm:flex-initial sm:justify-end">{units.map((unit, index) => <button key={unit.id} type="button" title={translateUi("Vəziyyəti dəyiş")} aria-label={`${item.name} #${index + 1}: ${statusLabels[unit.status]}. Dəyiş`} onClick={() => onChangeUnitStatus(item, unit.id, nextStatus[unit.status])} className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-slate-900"><BusinessStatusBadge tone={statusTone[unit.status]}>{units.length > 1 && `#${index + 1} `}{statusLabels[unit.status]}</BusinessStatusBadge></button>)}</div><button type="button" onClick={() => onEdit(item)} aria-label={`${item.name} redaktə et`} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-white"><Pencil size={16} /></button><button type="button" onClick={() => onDelete(item)} aria-label={`${item.name} sil`} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div>
    </article>;
  }
