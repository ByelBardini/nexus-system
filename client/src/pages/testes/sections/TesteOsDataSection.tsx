import { Label } from "@/components/ui/label";
import { formatarTempoMinutos, TIPO_OS_LABELS } from "@/lib/format";
import { TesteSectionShell } from "../components/TesteSectionShell";
import { subclienteLabel } from "../lib/testes-utils";
import type { OsTeste } from "../lib/testes-types";

interface TesteOsDataSectionProps {
  os: OsTeste | null;
}

export function TesteOsDataSection({ os }: TesteOsDataSectionProps) {
  if (!os) {
    return (
      <TesteSectionShell icon="description" title="01. Dados da Ordem de Serviço">
        <div className="p-6 text-center text-sm text-slate-500">
          Selecione uma OS na fila à direita
        </div>
      </TesteSectionShell>
    );
  }

  return (
    <TesteSectionShell
      icon="description"
      title="01. Dados da Ordem de Serviço"
      headerRight={
        <span className="text-[10px] font-medium text-slate-500">
          Tempo em testes:{" "}
          <span className="font-bold text-slate-700">
            {formatarTempoMinutos(os.tempoEmTestesMin)}
          </span>
        </span>
      }
    >
      <div className="p-4 grid grid-cols-5 gap-6">
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
            Número OS
          </Label>
          <p className="text-sm font-bold text-slate-800">#{os.numero}</p>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
            Cliente / Associação
          </Label>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {os.cliente.nome}
          </p>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
            Subcliente / Base
          </Label>
          <p className="text-sm font-medium text-slate-700">
            {subclienteLabel(os)}
          </p>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
            Veículo (Placa/Modelo)
          </Label>
          <p className="text-sm font-bold text-slate-800">
            {os.veiculo?.placa ?? "—"}
            {os.veiculo && (
              <span className="text-xs font-normal text-slate-500 ml-1">
                {[os.veiculo.marca, os.veiculo.modelo]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            )}
          </p>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
            Tipo de Serviço
          </Label>
          <p className="text-sm font-bold text-indigo-600">
            {TIPO_OS_LABELS[os.tipo] ?? os.tipo ?? "—"}
          </p>
        </div>
      </div>
    </TesteSectionShell>
  );
}
