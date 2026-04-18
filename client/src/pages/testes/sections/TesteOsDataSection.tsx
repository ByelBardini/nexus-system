import { MaterialIcon } from "@/components/MaterialIcon";
import { Label } from "@/components/ui/label";
import { formatarTempoMinutos, TIPO_OS_LABELS } from "@/lib/format";
import type { OsTeste } from "../testes-types";

interface TesteOsDataSectionProps {
  os: OsTeste | null;
}

export function TesteOsDataSection({ os }: TesteOsDataSectionProps) {
  if (!os) {
    return (
      <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
          <MaterialIcon name="description" className="text-erp-blue text-lg" />
          <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
            01. Dados da Ordem de Serviço
          </h2>
        </div>
        <div className="p-6 text-center text-sm text-slate-500">
          Selecione uma OS na fila à direita
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialIcon name="description" className="text-erp-blue text-lg" />
          <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
            01. Dados da Ordem de Serviço
          </h2>
        </div>
        <span className="text-[10px] font-medium text-slate-500">
          Tempo em testes:{" "}
          <span className="font-bold text-slate-700">
            {formatarTempoMinutos(os.tempoEmTestesMin)}
          </span>
        </span>
      </div>
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
            {os.subcliente?.nome ?? os.subclienteSnapshotNome ?? "—"}
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
    </section>
  );
}
