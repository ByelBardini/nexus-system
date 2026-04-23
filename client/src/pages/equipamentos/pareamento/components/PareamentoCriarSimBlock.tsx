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
import type { MarcaSimcardPareamentoCatalog } from "../domain/types";
import type { OperadoraPareamentoCatalog } from "../domain/types";
import { PareamentoLoteSimSelect } from "./PareamentoLoteSimSelect";

type Variant = "individual" | "massa";

type Props = {
  variant: Variant;
  criarNovo: boolean;
  onCriarNovoChange: (checked: boolean) => void;
  onCriarNovoUnchecked: () => void;
  pertenceLote: boolean;
  onPertenceLoteChange: (checked: boolean) => void;
  loteSimId: string;
  onLoteSimIdChange: (v: string) => void;
  loteBusca: string;
  onLoteBuscaChange: (v: string) => void;
  lotesFiltrados: LotePareamentoListItem[];
  marcasSimcard: MarcaSimcardPareamentoCatalog[];
  operadoraSim: string;
  marcaSimcardId: string;
  planoSimcardId: string;
  onOperadoraChange: (v: string) => void;
  onMarcaSimcardChange: (v: string) => void;
  onPlanoSimcardChange: (v: string) => void;
  operadorasAtivas: OperadoraPareamentoCatalog[];
  marcasSimcardPorOperadora: MarcaSimcardPareamentoCatalog[];
};

export function PareamentoCriarSimBlock({
  variant,
  criarNovo,
  onCriarNovoChange,
  onCriarNovoUnchecked,
  pertenceLote,
  onPertenceLoteChange,
  loteSimId,
  onLoteSimIdChange,
  loteBusca,
  onLoteBuscaChange,
  lotesFiltrados,
  marcasSimcard,
  operadoraSim,
  marcaSimcardId,
  planoSimcardId,
  onOperadoraChange,
  onMarcaSimcardChange,
  onPlanoSimcardChange,
  operadorasAtivas,
  marcasSimcardPorOperadora,
}: Props) {
  const opLabelClass =
    variant === "individual"
      ? "mb-1 block text-[10px] font-bold uppercase text-slate-600"
      : "mb-1 block text-[10px] font-bold uppercase text-slate-500";

  const marcaSel = marcasSimcardPorOperadora.find(
    (m) => String(m.id) === marcaSimcardId,
  );
  const planos = (marcaSel?.planos ?? []).filter((p) => p.ativo);
  const showPlano =
    !!marcaSimcardId && marcaSel?.temPlanos && planos.length > 0;

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
            <PareamentoLoteSimSelect
              value={loteSimId}
              onValueChange={onLoteSimIdChange}
              busca={loteBusca}
              onBuscaChange={onLoteBuscaChange}
              lotesFiltrados={lotesFiltrados}
              marcasSimcard={marcasSimcard}
              showLoteLabel={variant === "individual"}
            />
          ) : (
            <div className="space-y-3">
              <div>
                <Label className={opLabelClass}>Operadora</Label>
                <Select
                  value={operadoraSim}
                  onValueChange={(v) => {
                    onOperadoraChange(v);
                    onMarcaSimcardChange("");
                    onPlanoSimcardChange("");
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {operadorasAtivas.map((o) => (
                      <SelectItem key={o.id} value={o.nome}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={opLabelClass}>Marca do Simcard</Label>
                <Select
                  value={marcaSimcardId}
                  onValueChange={(v) => {
                    onMarcaSimcardChange(v);
                    onPlanoSimcardChange("");
                  }}
                  disabled={!operadoraSim}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        operadoraSim
                          ? "Ex: Getrak, 1nce..."
                          : "Selecione operadora"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {marcasSimcardPorOperadora.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showPlano && (
                <div>
                  <Label className={opLabelClass}>Plano</Label>
                  <Select
                    value={planoSimcardId}
                    onValueChange={onPlanoSimcardChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione o plano..." />
                    </SelectTrigger>
                    <SelectContent>
                      {planos.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.planoMb} MB
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
