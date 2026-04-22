import { AlertTriangle } from "lucide-react";
import { formatarDataDeHoje } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./constants";
import type { ClienteLista } from "@/pages/aparelhos/shared/catalog.types";

type StatusRevisao = "DUPLICADO" | "ID_INVALIDO" | "INCOMPLETO" | "OK";

type CadastroResumoEntradaPanelProps = {
  statusRevisao: StatusRevisao;
  watchTipo: "RASTREADOR" | "SIM";
  watchMarca: string;
  watchModelo: string;
  watchOperadora: string;
  watchIdentificador: string;
  idJaExiste: { lote?: { referencia: string } | null } | null;
  watchOrigem: string;
  notaFiscal: string;
  watchProprietario: "INFINITY" | "CLIENTE";
  watchClienteId: number | null;
  clientes: ClienteLista[];
  watchStatus: keyof typeof STATUS_CONFIG;
};

export function CadastroResumoEntradaPanel({
  statusRevisao,
  watchTipo,
  watchMarca,
  watchModelo,
  watchOperadora,
  watchIdentificador,
  idJaExiste,
  watchOrigem,
  notaFiscal,
  watchProprietario,
  watchClienteId,
  clientes,
  watchStatus,
}: CadastroResumoEntradaPanelProps) {
  return (
    <div className="w-80 shrink-0">
      <div className="sticky top-24">
        <div className="bg-slate-800 text-white rounded-sm shadow-xl overflow-hidden border border-slate-700">
          <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest">
              Resumo da Entrada
            </h3>
            {statusRevisao === "DUPLICADO" && (
              <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                DUPLICADO
              </span>
            )}
            {statusRevisao === "ID_INVALIDO" && (
              <span className="bg-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                ID INVÁLIDO
              </span>
            )}
            {statusRevisao === "INCOMPLETO" && (
              <span className="bg-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                INCOMPLETO
              </span>
            )}
            {statusRevisao === "OK" && (
              <span className="bg-emerald-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                PRONTO
              </span>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Equipamento
              </label>
              <p className="text-sm font-medium mt-1">
                {watchTipo === "RASTREADOR" ? "📡" : "📶"}{" "}
                {watchTipo === "RASTREADOR" ? "Rastreador" : "Simcard"}{" "}
                {watchTipo === "RASTREADOR" &&
                  watchMarca &&
                  watchModelo &&
                  `${watchMarca} ${watchModelo}`}
                {watchTipo === "SIM" && watchOperadora}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Identificador
                </label>
                <p
                  className={cn(
                    "text-sm font-mono",
                    idJaExiste
                      ? "text-red-400"
                      : watchIdentificador.trim()
                        ? "text-white"
                        : "text-slate-500",
                  )}
                >
                  {watchIdentificador.trim() || "--- não definido ---"}
                </p>
              </div>
              {watchOrigem === "COMPRA_AVULSA" && notaFiscal?.trim() && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Nota Fiscal
                  </label>
                  <p className="text-sm font-medium">{notaFiscal}</p>
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Vinculação
                </label>
                <p className="text-sm font-medium">
                  {watchProprietario === "CLIENTE"
                    ? (() => {
                        const c = clientes.find(
                          (cl) => cl.id === watchClienteId,
                        );
                        if (!c) return "--- cliente não selecionado ---";
                        const loc =
                          c.cidade && c.estado
                            ? `${c.cidade} - ${c.estado}`
                            : (c.cidade ?? c.estado ?? "");
                        return loc ? `${c.nome} (${loc})` : c.nome;
                      })()
                    : "Infinity"}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Status Definido
                </label>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-tighter",
                    watchStatus === "NOVO_OK" &&
                      "bg-emerald-600/20 text-emerald-400 border border-emerald-600/50",
                    watchStatus === "EM_MANUTENCAO" &&
                      "bg-erp-blue/20 text-blue-400 border border-erp-blue/50",
                    watchStatus === "CANCELADO_DEFEITO" &&
                      "bg-red-600/20 text-red-400 border border-red-600/50",
                  )}
                >
                  {STATUS_CONFIG[watchStatus].label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Data Entrada
                </label>
                <span className="text-sm font-bold">
                  {formatarDataDeHoje(new Date())}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-700/30 border-t border-slate-700" />
        </div>

        {idJaExiste && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-sm">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-800 font-medium">
                O {watchTipo === "RASTREADOR" ? "IMEI" : "ICCID"} informado já
                possui um registro ativo. Registrar novamente criará um histórico
                de duplicidade.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
