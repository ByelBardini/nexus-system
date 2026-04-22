import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LotePareamentoListItem } from "../domain/types";
import type { MarcaPareamentoCatalog } from "../domain/types";
import type { ModeloPareamentoCatalog } from "../domain/types";
import { PareamentoLoteRastreadorSelect } from "./PareamentoLoteRastreadorSelect";

type Variant = "individual" | "massa";

type Props = {
  variant: Variant;
  criarNovo: boolean;
  onCriarNovoChange: (checked: boolean) => void;
  onCriarNovoUnchecked: () => void;
  pertenceLote: boolean;
  onPertenceLoteChange: (checked: boolean) => void;
  loteRastreadorId: string;
  onLoteRastreadorIdChange: (v: string) => void;
  loteBusca: string;
  onLoteBuscaChange: (v: string) => void;
  lotesFiltrados: LotePareamentoListItem[];
  marca: string;
  modelo: string;
  onMarcaChange: (v: string) => void;
  onModeloChange: (v: string) => void;
  marcasAtivas: MarcaPareamentoCatalog[];
  modelosPorMarca: ModeloPareamentoCatalog[];
};

export function PareamentoCriarRastreadorBlock({
  variant,
  criarNovo,
  onCriarNovoChange,
  onCriarNovoUnchecked,
  pertenceLote,
  onPertenceLoteChange,
  loteRastreadorId,
  onLoteRastreadorIdChange,
  loteBusca,
  onLoteBuscaChange,
  lotesFiltrados,
  marca,
  modelo,
  onMarcaChange,
  onModeloChange,
  marcasAtivas,
  modelosPorMarca,
}: Props) {
  const marcaLabel =
    variant === "individual"
      ? "Marca (se criar novo)"
      : "Marca";
  const modeloLabel =
    variant === "individual"
      ? "Modelo (se criar novo)"
      : "Modelo";
  const marcaFieldClass =
    variant === "individual"
      ? "mb-1.5 block text-[10px] font-bold uppercase text-slate-600"
      : "mb-1 block text-[10px] font-bold uppercase text-slate-500";

  return (
    <>
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={criarNovo}
          onCheckedChange={(v) => {
            const checked = !!v;
            onCriarNovoChange(checked);
            if (!checked) onCriarNovoUnchecked();
          }}
          className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
        />
        <span className="text-[11px] font-bold uppercase text-slate-600">
          Criar Novo
        </span>
      </label>
      {criarNovo && (
        <div className="space-y-3 pl-1">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={pertenceLote}
              onCheckedChange={(v) => onPertenceLoteChange(!!v)}
              className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
            />
            <span className="text-[11px] font-bold uppercase text-slate-600">
              Pertence a um lote
            </span>
          </label>
          {pertenceLote ? (
            <PareamentoLoteRastreadorSelect
              value={loteRastreadorId}
              onValueChange={onLoteRastreadorIdChange}
              busca={loteBusca}
              onBuscaChange={onLoteBuscaChange}
              lotesFiltrados={lotesFiltrados}
              showLoteLabel={variant === "individual"}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={marcaFieldClass}>{marcaLabel}</Label>
                <Select
                  value={marca}
                  onValueChange={(v) => {
                    onMarcaChange(v);
                    onModeloChange("");
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {marcasAtivas.map((m) => (
                      <SelectItem key={m.id} value={m.nome}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={marcaFieldClass}>{modeloLabel}</Label>
                <Select
                  value={modelo}
                  onValueChange={onModeloChange}
                  disabled={!marca}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        marca ? "Selecione..." : "Marca primeiro"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {modelosPorMarca.map((m) => (
                      <SelectItem key={m.id} value={m.nome}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
