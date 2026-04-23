import type { PedidoRastreadorApi, AparelhosDestinatariosResponse } from "../../shared/pedidos-rastreador.types";
import type { AparelhoNoKit, KitComAparelhos } from "../../shared/pedidos-config-types";
import { getDestinatarioExibicaoAparelhoNoKit } from "../../shared/aparelho-destinatario";

export interface ModalSelecaoEKitTabelaRastreadoresNoKitProps {
  isMisto: boolean;
  aparelhosNoKit: AparelhoNoKit[];
  kitComAparelhos: KitComAparelhos | undefined;
  destinatariosData: AparelhosDestinatariosResponse | undefined;
  pedidoApi: PedidoRastreadorApi | null;
  progressQtd: number;
  qtdEsperada: number;
  onRemover: (aparelhoId: number) => void;
}

export function ModalSelecaoEKitTabelaRastreadoresNoKit({
  isMisto,
  aparelhosNoKit,
  kitComAparelhos,
  destinatariosData,
  pedidoApi,
  progressQtd,
  qtdEsperada,
  onRemover,
}: ModalSelecaoEKitTabelaRastreadoresNoKitProps) {
  return (
    <section>
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-2">
          Rastreadores no Kit
        </h3>
        <div className="text-right w-48">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 uppercase">
            <span>Progresso</span>
            <span>
              {progressQtd} / {qtdEsperada} Equipamentos
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{
                width: `${Math.min(100, (progressQtd / qtdEsperada) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
      <div className="border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">
                IMEI
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">
                ICCID
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">
                Marca / Modelo
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">
                Kit
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">
                Cliente
              </th>
              {isMisto && (
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">
                  Destino
                </th>
              )}
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-right">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {aparelhosNoKit.length === 0 ? (
              <tr>
                <td
                  colSpan={isMisto ? 7 : 6}
                  className="px-3 py-6 text-center text-slate-500 text-[11px]"
                >
                  Nenhum rastreador no kit.
                </td>
              </tr>
            ) : (
              aparelhosNoKit.map((a) => {
                const asg = destinatariosData?.assignments.find(
                  (x) => x.aparelhoId === a.id,
                );
                const destinatarioLabel = asg
                  ? asg.destinatarioProprietario === "INFINITY"
                    ? "Infinity"
                    : (pedidoApi?.itens?.find(
                      (i) => i.clienteId === asg.destinatarioClienteId,
                    )?.cliente?.nome ?? `#${asg.destinatarioClienteId}`)
                  : null;
                return (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-bold">
                      {a.identificador ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      {a.simVinculado?.identificador ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      {[a.marca, a.modelo].filter(Boolean).join(" / ") || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] font-bold text-violet-600">
                        {a.kit?.nome ?? kitComAparelhos?.nome ?? "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {getDestinatarioExibicaoAparelhoNoKit(a)}
                    </td>
                    {isMisto && (
                      <td className="px-3 py-2">
                        {destinatarioLabel ? (
                          <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                            {destinatarioLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onRemover(a.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
