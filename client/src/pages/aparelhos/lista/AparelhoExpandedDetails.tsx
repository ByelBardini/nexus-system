import { MaterialIcon } from "@/components/MaterialIcon";
import { formatarDataHora, formatarMoedaOpcional } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Aparelho } from "./aparelhos-page.shared";
import { PROPRIETARIO_CONFIG } from "./aparelhos-page.shared";
import {
  getIdentificadorVinculado,
  getNomeDestaqueVinculosTecnico,
  resolveKitNome,
} from "./aparelhos-list.helpers";

type Props = {
  aparelho: Aparelho;
  kitsPorId: Map<number, string>;
};

export function AparelhoExpandedDetails({ aparelho, kitsPorId }: Props) {
  const propConfig = PROPRIETARIO_CONFIG[aparelho.proprietario];
  const vinculado = getIdentificadorVinculado(aparelho);
  const kitNome = resolveKitNome(aparelho, kitsPorId);
  const nomeVinculoTecnico = getNomeDestaqueVinculosTecnico(aparelho);

  return (
    <div
      className="bg-slate-50 px-8 py-6"
      data-testid={`aparelho-expanded-${aparelho.id}`}
    >
      <div className="grid grid-cols-3 gap-8">
        <div data-testid="aparelho-expanded-equipamento">
          <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
            <MaterialIcon name="description" className="text-sm" />
            Dados do Equipamento
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">
                {aparelho.tipo === "RASTREADOR" ? "IMEI" : "ICCID"}
              </span>
              <span className="font-mono font-bold text-slate-700">
                {aparelho.identificador || `#${aparelho.id}`}
              </span>
            </div>
            {aparelho.tipo === "RASTREADOR" && (
              <>
                <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Marca</span>
                  <span className="font-bold text-slate-700">
                    {aparelho.marca || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Modelo</span>
                  <span className="font-bold text-slate-700">
                    {aparelho.modelo || "-"}
                  </span>
                </div>
              </>
            )}
            {aparelho.tipo === "SIM" && (
              <>
                <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Operadora</span>
                  <span className="font-bold text-slate-700">
                    {aparelho.operadora || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Marca do Simcard</span>
                  <span className="font-bold text-slate-700">
                    {aparelho.marcaSimcard?.nome || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Plano</span>
                  <span className="font-bold text-slate-700">
                    {aparelho.planoSimcard
                      ? `${aparelho.planoSimcard.planoMb} MB`
                      : "-"}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Proprietário</span>
              <span className="font-bold text-slate-700">
                {propConfig.label}
                {aparelho.cliente && ` - ${aparelho.cliente.nome}`}
              </span>
            </div>
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Valor Unitário</span>
              <span className="font-bold text-slate-700">
                {formatarMoedaOpcional(aparelho.valorUnitario)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Lote</span>
              <span className="font-bold text-slate-700">
                {aparelho.lote?.referencia || "-"}
              </span>
            </div>
          </div>
        </div>

        <div data-testid="aparelho-expanded-vinculos">
          <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
            <MaterialIcon name="link" className="text-sm" />
            Vínculos
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">
                {aparelho.tipo === "RASTREADOR"
                  ? "SIM Vinculado"
                  : "Rastreador Vinculado"}
              </span>
              <span
                className={cn(
                  "font-bold",
                  vinculado
                    ? "text-blue-600 font-mono"
                    : "text-slate-400 italic",
                )}
                data-testid="aparelho-expanded-vinculo-id"
              >
                {vinculado ??
                  (aparelho.tipo === "RASTREADOR"
                    ? "Não vinculado"
                    : "Disponível")}
              </span>
            </div>
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Kit</span>
              <span
                className={cn(
                  "font-bold",
                  kitNome ? "text-violet-600" : "text-slate-400",
                )}
                data-testid="aparelho-expanded-kit"
              >
                {kitNome ?? "-"}
              </span>
            </div>
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Técnico</span>
              <span
                className={cn(
                  "font-bold",
                  nomeVinculoTecnico ? "text-slate-700" : "text-slate-400",
                )}
                data-testid="aparelho-expanded-tecnico-nome"
              >
                {nomeVinculoTecnico ?? "-"}
              </span>
            </div>
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Ordem de Serviço</span>
              {aparelho.ordemServicoVinculada ? (
                <span className="font-bold text-blue-600">
                  OS #{aparelho.ordemServicoVinculada.numero}
                </span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
            <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Subcliente</span>
              <span
                className={cn(
                  "font-bold",
                  aparelho.ordemServicoVinculada?.subclienteNome
                    ? "text-slate-700"
                    : "text-slate-400",
                )}
              >
                {aparelho.ordemServicoVinculada?.subclienteNome ?? "-"}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Placa</span>
              <span
                className={cn(
                  "font-bold",
                  aparelho.ordemServicoVinculada?.veiculoPlaca
                    ? "text-slate-700"
                    : "text-slate-400",
                )}
              >
                {aparelho.ordemServicoVinculada?.veiculoPlaca ?? "-"}
              </span>
            </div>
          </div>
        </div>

        <div data-testid="aparelho-expanded-historico">
          <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
            <MaterialIcon name="history" className="text-sm" />
            Histórico
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {aparelho.historico && aparelho.historico.length > 0 ? (
              aparelho.historico.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 border-l-2 border-slate-200 pl-3 py-1"
                  data-testid={`aparelho-historico-item-${idx}`}
                >
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-700">
                      {item.acao}
                    </p>
                    {item.descricao && (
                      <p className="text-[10px] text-slate-500">
                        {item.descricao}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {formatarDataHora(item.data)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p
                className="text-[11px] text-slate-400 italic"
                data-testid="aparelho-historico-vazio"
              >
                Sem histórico registrado
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
