import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectRastreadorTeste } from "../components/SelectRastreadorTeste";
import { TesteSectionShell } from "../components/TesteSectionShell";
import { STATUS_CONFIG_APARELHO } from "@/lib/aparelho-status";
import { formatarTempoMinutos } from "@/lib/format";
import { formatRastreadorOperadoraMarcaIccidPlano } from "../lib/rastreador-format";
import type { RastreadorParaTeste } from "../lib/testes-types";

interface TesteEquipamentoSectionProps {
  rastreadores: RastreadorParaTeste[];
  value: string;
  onChange: (v: string) => void;
  aparelhoSelecionado: RastreadorParaTeste | null;
  onTrocarAparelho: () => void;
  osClienteId?: number | null;
  tempoRastreadorEmTestesMin?: number;
}

export function TesteEquipamentoSection({
  rastreadores,
  value,
  onChange,
  aparelhoSelecionado,
  onTrocarAparelho,
  osClienteId = null,
  tempoRastreadorEmTestesMin,
}: TesteEquipamentoSectionProps) {
  const statusConfig = aparelhoSelecionado
    ? STATUS_CONFIG_APARELHO[
        aparelhoSelecionado.status as keyof typeof STATUS_CONFIG_APARELHO
      ]
    : null;

  const resumoLinha = aparelhoSelecionado
    ? formatRastreadorOperadoraMarcaIccidPlano(aparelhoSelecionado)
    : "";

  return (
    <TesteSectionShell
      icon="devices"
      title="02. Identificação do Equipamento"
      headerRight={
        tempoRastreadorEmTestesMin != null && aparelhoSelecionado ? (
          <span className="text-[10px] font-medium text-slate-500">
            Rastreador em testes:{" "}
            <span className="font-bold text-slate-700">
              {formatarTempoMinutos(tempoRastreadorEmTestesMin)}
            </span>
          </span>
        ) : undefined
      }
    >
      <div className="p-6">
        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Selecionar Equipamento (IMEI, ICCID, Serial)
            </Label>
            <SelectRastreadorTeste
              rastreadores={rastreadores}
              value={value}
              onChange={onChange}
              osClienteId={osClienteId}
              placeholder="Buscar IMEI, ICCID ou Serial..."
            />
          </div>
          <Button
            variant="outline"
            className="h-9 text-[11px] font-bold uppercase"
            onClick={onTrocarAparelho}
          >
            Trocar Aparelho
          </Button>
        </div>
        {aparelhoSelecionado && (
          <div className="grid grid-cols-3 gap-6 bg-erp-blue/5 p-4 rounded border border-erp-blue/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-erp-blue uppercase">
                Modelo
              </span>
              <span className="text-sm font-bold text-slate-700">
                {[aparelhoSelecionado.marca, aparelhoSelecionado.modelo]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </span>
            </div>
            <div className="flex flex-col border-l border-erp-blue/20 pl-6">
              <span className="text-[10px] font-bold text-erp-blue uppercase">
                Operadora / Marca / ICCID
              </span>
              <span
                className="text-sm font-medium text-slate-700 truncate"
                title={resumoLinha}
              >
                {resumoLinha}
              </span>
            </div>
            <div className="flex flex-col border-l border-erp-blue/20 pl-6">
              <span className="text-[10px] font-bold text-erp-blue uppercase">
                Status
              </span>
              <span
                className={
                  statusConfig
                    ? `text-sm font-bold ${statusConfig.color}`
                    : "text-sm font-medium text-slate-700"
                }
              >
                {statusConfig?.label ?? aparelhoSelecionado.status ?? "—"}
              </span>
            </div>
          </div>
        )}
      </div>
    </TesteSectionShell>
  );
}
