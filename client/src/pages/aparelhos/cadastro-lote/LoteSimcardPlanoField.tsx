import { Controller, type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarcaSimcardRow } from "@/pages/aparelhos/shared/catalog.types";
import type { LoteFormValues } from "./schema";

type LoteSimcardPlanoFieldProps = {
  form: UseFormReturn<LoteFormValues>;
  marcasSimcardFiltradas: MarcaSimcardRow[];
  watchMarcaSimcard: string | undefined;
};

/**
 * Exibe o select de plano quando a marca de SIM selecionada possui planos ativos.
 */
export function LoteSimcardPlanoField({
  form,
  marcasSimcardFiltradas,
  watchMarcaSimcard,
}: LoteSimcardPlanoFieldProps) {
  if (!watchMarcaSimcard) return null;

  const marcaSel = marcasSimcardFiltradas.find(
    (m) => String(m.id) === watchMarcaSimcard,
  );
  const planos = (marcaSel?.planos ?? []).filter((p) => p.ativo);

  if (!marcaSel?.temPlanos || planos.length === 0) return null;

  return (
    <div>
      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
        Plano
      </Label>
      <Controller
        name="planoSimcard"
        control={form.control}
        render={({ field }) => (
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
        )}
      />
    </div>
  );
}
