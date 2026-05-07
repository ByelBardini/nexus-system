import { cn } from "@/lib/utils";

export type MistoItemChip = {
  label: string;
  quantidade: number;
  cor?: string | null;
};

type PedidoMistoChipsProps = {
  itens: MistoItemChip[];
  className?: string;
};

/**
 * Badges de distribuição mista reutilizados nos cards do Kanban.
 */
export function PedidoMistoChips({ itens, className }: PedidoMistoChipsProps) {
  if (!itens.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {itens.map((item, i) => (
        <span
          key={i}
          className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded border",
            item.label === "Infinity"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : !item.cor && "bg-slate-50 text-slate-600 border-slate-200",
          )}
          style={
            item.label !== "Infinity" && item.cor
              ? {
                  backgroundColor: `${item.cor}22`,
                  color: item.cor,
                  borderColor: `${item.cor}55`,
                }
              : undefined
          }
        >
          {item.label} · {item.quantidade}
        </span>
      ))}
    </div>
  );
}
