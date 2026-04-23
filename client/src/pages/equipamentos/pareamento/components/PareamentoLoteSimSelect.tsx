import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LotePareamentoListItem } from "../domain/types";
import type { MarcaSimcardPareamentoCatalog } from "../domain/types";

type Props = {
  value: string;
  onValueChange: (v: string) => void;
  busca: string;
  onBuscaChange: (v: string) => void;
  lotesFiltrados: LotePareamentoListItem[];
  marcasSimcard: MarcaSimcardPareamentoCatalog[];
  loteLabelClassName?: string;
  showLoteLabel?: boolean;
};

export function PareamentoLoteSimSelect({
  value,
  onValueChange,
  busca,
  onBuscaChange,
  lotesFiltrados,
  marcasSimcard,
  loteLabelClassName = "mb-1.5 block text-[10px] font-bold uppercase text-slate-600",
  showLoteLabel = true,
}: Props) {
  const select = (
    <Select
      value={value}
      onValueChange={onValueChange}
      onOpenChange={(o) => {
        if (!o) onBuscaChange("");
      }}
    >
      <SelectTrigger className="h-9">
        <SelectValue placeholder="Selecione o lote..." />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 pb-1 pt-1">
          <Input
            placeholder="Buscar lote..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-7 text-xs"
          />
        </div>
        {lotesFiltrados.map((l) => {
          const marcaNome =
            marcasSimcard.find((m) => m.id === l.marcaSimcardId)?.nome ?? null;
          const info = [l.operadora, marcaNome].filter(Boolean).join(" / ");
          return (
            <SelectItem
              key={l.id}
              value={String(l.id)}
              textValue={l.referencia}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{l.referencia}</span>
                {info && (
                  <span className="text-[11px] text-slate-400">({info})</span>
                )}
              </span>
            </SelectItem>
          );
        })}
        {lotesFiltrados.length === 0 && (
          <SelectItem value="_" disabled>
            Nenhum lote encontrado
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );

  if (!showLoteLabel) {
    return select;
  }

  return (
    <div>
      <Label className={loteLabelClassName}>Lote</Label>
      {select}
    </div>
  );
}
