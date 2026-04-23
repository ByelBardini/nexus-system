import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

interface TesteSectionShellProps {
  icon: string;
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function TesteSectionShell({
  icon,
  title,
  headerRight,
  children,
}: TesteSectionShellProps) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MaterialIcon name={icon} className="text-erp-blue text-lg shrink-0" />
          <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
            {title}
          </h2>
        </div>
        {headerRight != null ? (
          <div className="shrink-0">{headerRight}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
