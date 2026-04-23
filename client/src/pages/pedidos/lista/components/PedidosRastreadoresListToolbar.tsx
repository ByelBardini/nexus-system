import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";

type PedidosRastreadoresListToolbarProps = {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  /** Ações à direita (ex.: "Novo Pedido"). */
  rightSlot?: ReactNode;
  /** `id` estável para testes. */
  searchTestId?: string;
};

/**
 * Barra de busca única da listagem (padrão ERP: ícone + input compacto).
 */
export function PedidosRastreadoresListToolbar({
  value,
  onValueChange,
  placeholder,
  rightSlot,
  searchTestId = "pedidos-rastreadores-busca",
}: PedidosRastreadoresListToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 shrink-0 pb-4">
      <div className="relative flex-1 max-w-xs">
        <MaterialIcon
          name="search"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
        />
        <Input
          data-testid={searchTestId}
          className="pl-8 text-[11px]"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>
      {rightSlot != null && (
        <div className="flex gap-2 shrink-0">{rightSlot}</div>
      )}
    </div>
  );
}
