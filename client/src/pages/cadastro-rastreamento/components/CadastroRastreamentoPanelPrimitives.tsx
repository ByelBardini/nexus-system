import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

export function PanelBlock({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1.5">
        <MaterialIcon name={icon} className="text-slate-400 text-sm" />
        {title}
      </h4>
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

export function PanelRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] text-slate-500 shrink-0">{label}</span>
      <span
        className={cn(
          "text-[10px] font-bold text-right",
          highlight ? "text-erp-blue" : "text-slate-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}
