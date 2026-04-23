import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  formatarDataHora,
  formatarTelefone,
  formatarTempoMinutos,
  TIPO_OS_LABELS,
} from "@/lib/format";
import { getOsDadosTesteParaExibicao } from "@/lib/os-revisao-display";
import { cn } from "@/lib/utils";
import {
  formatDadosVeiculo,
  formatEnderecoSubcliente,
  getDadosRetirada,
  getDadosTeste,
  getSubclienteParaExibicao,
} from "../../shared/ordens-servico.display";
import type { OrdemServicoDetalhe } from "../../shared/ordens-servico.types";

export type OrdensServicoDetalhePanelProps = {
  osDetalhe: OrdemServicoDetalhe | undefined;
  loadingDetalhe: boolean;
  rowOsId: number;
  expandedOsId: number | null;
  canEditOs: boolean;
  updateStatusPending: boolean;
  onOpenConfirmIniciar: () => void;
  onOpenRetiradaModal: () => void;
  onEnviarParaCadastro: () => void;
};

export function OrdensServicoDetalhePanel({
  osDetalhe,
  loadingDetalhe,
  rowOsId,
  expandedOsId,
  canEditOs,
  updateStatusPending,
  onOpenConfirmIniciar,
  onOpenRetiradaModal,
  onEnviarParaCadastro,
}: OrdensServicoDetalhePanelProps) {
  const staleDetail =
    !!osDetalhe && expandedOsId === rowOsId && osDetalhe.id !== rowOsId;

  if (loadingDetalhe || staleDetail) {
    return (
      <div
        className="flex justify-center py-8"
        data-testid="ordens-servico-detalhe-loading"
      >
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!osDetalhe || expandedOsId !== rowOsId) {
    return null;
  }

  const sub = getSubclienteParaExibicao(osDetalhe);

  return (
    <div
      className="p-3 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3"
      data-testid="ordens-servico-detalhe-panel"
    >
      <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
          <MaterialIcon
            name="description"
            className="text-slate-400 text-base"
          />
          <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
            Dados de Emissão
          </h2>
        </div>
        <div className="p-3">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
            <div>
              <dt className="text-[10px] text-slate-500 uppercase font-medium">
                Emitido por
              </dt>
              <dd className="font-semibold text-slate-800">
                {osDetalhe.criadoPor?.nome ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500 uppercase font-medium">
                Data
              </dt>
              <dd className="font-semibold text-slate-800">
                {formatarDataHora(osDetalhe.criadoEm)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500 uppercase font-medium">
                Tipo
              </dt>
              <dd className="font-semibold text-slate-800">
                {TIPO_OS_LABELS[osDetalhe.tipo] ?? osDetalhe.tipo}
              </dd>
            </div>
            {["REVISAO", "RETIRADA"].includes(osDetalhe.tipo) &&
              (osDetalhe.idAparelho || osDetalhe.localInstalacao) && (
                <>
                  <div>
                    <dt className="text-[10px] text-slate-500 uppercase font-medium">
                      {osDetalhe.tipo === "RETIRADA"
                        ? "ID saída"
                        : "ID substituir"}
                    </dt>
                    <dd className="font-semibold text-slate-800">
                      {osDetalhe.idAparelho || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-slate-500 uppercase font-medium">
                      Local inst.
                    </dt>
                    <dd className="font-semibold text-slate-800">
                      {osDetalhe.localInstalacao || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-slate-500 uppercase font-medium">
                      Pós-chave
                    </dt>
                    <dd className="font-semibold text-slate-800">
                      {osDetalhe.posChave === "SIM"
                        ? "Sim"
                        : osDetalhe.posChave === "NAO"
                          ? "Não"
                          : "-"}
                    </dd>
                  </div>
                </>
              )}
            <div className="col-span-2 md:col-span-3">
              <dt className="text-[10px] text-slate-500 uppercase font-medium">
                Endereço subcliente
              </dt>
              <dd className="font-semibold text-slate-800 leading-tight">
                {formatEnderecoSubcliente(sub)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500 uppercase font-medium">
                Telefone
              </dt>
              <dd className="font-semibold text-slate-800">
                {sub?.telefone ? formatarTelefone(sub.telefone) : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500 uppercase font-medium">
                E-mail
              </dt>
              <dd className="font-semibold text-slate-800 truncate">
                {sub?.email || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500 uppercase font-medium">
                Veículo
              </dt>
              <dd className="font-semibold text-slate-800 leading-tight">
                {formatDadosVeiculo(osDetalhe.veiculo)}
              </dd>
            </div>
            {osDetalhe.observacoes && (
              <div className="col-span-2 md:col-span-3">
                <dt className="text-[10px] text-slate-500 uppercase font-medium">
                  Observações
                </dt>
                <dd className="font-medium text-slate-700 whitespace-pre-wrap leading-tight text-[10px]">
                  {osDetalhe.observacoes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
          <MaterialIcon
            name={
              osDetalhe.tipo === "RETIRADA" &&
              (osDetalhe.status === "AGENDADO" ||
                osDetalhe.status === "AGUARDANDO_CADASTRO")
                ? "remove_circle"
                : "science"
            }
            className="text-slate-400 text-base"
          />
          <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
            {osDetalhe.tipo === "RETIRADA" &&
            (osDetalhe.status === "AGENDADO" ||
              osDetalhe.status === "AGUARDANDO_CADASTRO")
              ? "Dados da Retirada"
              : "Dados de teste"}
          </h2>
        </div>
        <div className="p-3">
          {osDetalhe.tipo === "RETIRADA" && osDetalhe.status === "AGENDADO" ? (
            <div
              className="flex flex-col items-center justify-center gap-3 min-h-[120px]"
              data-testid="ordens-servico-detalhe-retirada-agendada"
            >
              <div className="w-full text-left space-y-1.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-medium">
                    ID a retirar
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {osDetalhe.idAparelho || "—"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase h-9"
                onClick={onOpenRetiradaModal}
                disabled={updateStatusPending || !canEditOs}
                data-testid="ordens-servico-btn-retirada-realizada"
              >
                {updateStatusPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MaterialIcon name="check_circle" className="text-lg mr-2" />
                )}
                Retirada Realizada
              </Button>
            </div>
          ) : osDetalhe.tipo === "RETIRADA" &&
            osDetalhe.status === "AGUARDANDO_CADASTRO" ? (
            (() => {
              const { dataRetirada, aparelhoEncontrado } =
                getDadosRetirada(osDetalhe);
              return (
                <dl
                  className="space-y-3 text-[11px]"
                  data-testid="ordens-servico-detalhe-retirada-concluida"
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Data da retirada
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {dataRetirada ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Aparelho encontrado
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {aparelhoEncontrado === null
                          ? "—"
                          : aparelhoEncontrado
                            ? "Sim"
                            : "Não"}
                      </dd>
                    </div>
                  </div>
                </dl>
              );
            })()
          ) : osDetalhe.status === "AGENDADO" ? (
            <div
              className="flex flex-col items-center justify-center gap-2 min-h-[120px]"
              data-testid="ordens-servico-detalhe-agendado-iniciar"
            >
              <p className="text-slate-500 text-xs">
                Inicie os testes para esta ordem de serviço.
              </p>
              <Button
                size="sm"
                className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase h-9"
                onClick={onOpenConfirmIniciar}
                disabled={updateStatusPending || !canEditOs}
                data-testid="ordens-servico-btn-iniciar-testes"
              >
                {updateStatusPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MaterialIcon name="play_arrow" className="text-lg mr-2" />
                )}
                Iniciar Testes
              </Button>
            </div>
          ) : [
              "EM_TESTES",
              "TESTES_REALIZADOS",
              "AGUARDANDO_CADASTRO",
              "FINALIZADO",
            ].includes(osDetalhe.status) &&
            !(
              osDetalhe.tipo === "RETIRADA" &&
              osDetalhe.status === "AGUARDANDO_CADASTRO"
            ) ? (
            (() => {
              const { entradaEmTestes, saidaEmTestes, tempoMin } =
                getDadosTeste(osDetalhe);
              const {
                imeiEntrada: idEntradaTeste,
                localInstalacao: localTeste,
                posChave: posChaveTeste,
              } = getOsDadosTesteParaExibicao(osDetalhe);
              return (
                <dl
                  className="space-y-3 text-[11px]"
                  data-testid="ordens-servico-detalhe-testes-dados"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        ID de Entrada
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {idEntradaTeste || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Local Instalação
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {localTeste || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Pós-chave
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {posChaveTeste === "SIM"
                          ? "Sim"
                          : posChaveTeste === "NAO"
                            ? "Não"
                            : "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Início testes
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {entradaEmTestes
                          ? formatarDataHora(entradaEmTestes)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Fim testes
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {saidaEmTestes
                          ? formatarDataHora(saidaEmTestes)
                          : "Em andamento"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Tempo em testes
                      </dt>
                      <dd className="font-semibold text-slate-800">
                        {formatarTempoMinutos(tempoMin)}
                      </dd>
                    </div>
                  </div>
                  {osDetalhe.observacoes && (
                    <div>
                      <dt className="text-[10px] text-slate-500 uppercase font-medium">
                        Observações
                      </dt>
                      <dd className="font-medium text-slate-700 whitespace-pre-wrap leading-tight text-[10px] mt-0.5">
                        {osDetalhe.observacoes}
                      </dd>
                    </div>
                  )}
                </dl>
              );
            })()
          ) : (
            <span
              className="text-slate-500 text-xs italic"
              data-testid="ordens-servico-detalhe-testes-nao-iniciados"
            >
              Testes não iniciados
            </span>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
          <MaterialIcon
            name="person_add"
            className="text-slate-400 text-base"
          />
          <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
            Dados de Cadastro
          </h2>
        </div>
        <div className="p-3">
          {osDetalhe.status === "TESTES_REALIZADOS" ? (
            <div
              className="flex flex-col items-center justify-center gap-2 min-h-[120px]"
              data-testid="ordens-servico-detalhe-enviar-cadastro"
            >
              <p className="text-slate-500 text-xs">
                Envie esta ordem de serviço para cadastro.
              </p>
              <Button
                size="sm"
                className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase h-9"
                onClick={onEnviarParaCadastro}
                disabled={updateStatusPending}
                data-testid="ordens-servico-btn-enviar-cadastro"
              >
                {updateStatusPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MaterialIcon name="send" className="text-lg mr-2" />
                )}
                Enviar para Cadastro
              </Button>
            </div>
          ) : ["AGUARDANDO_CADASTRO", "FINALIZADO"].includes(
              osDetalhe.status,
            ) ? (
            <div
              className="grid grid-cols-2 gap-x-6 gap-y-3"
              data-testid="ordens-servico-detalhe-cadastro-info"
            >
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Data de Envio
                </p>
                <p className="text-sm text-slate-800">
                  {(() => {
                    const entry = osDetalhe.historico?.find(
                      (h) => h.statusNovo === "AGUARDANDO_CADASTRO",
                    );
                    return entry
                      ? new Date(entry.criadoEm).toLocaleDateString("pt-BR")
                      : "—";
                  })()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Plataforma
                </p>
                <p className="text-sm text-slate-800">
                  {osDetalhe.plataforma ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Login Enviado
                </p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-100 text-slate-600 border-slate-300">
                  Não
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Status do Cadastro
                </p>
                {osDetalhe.statusCadastro ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      osDetalhe.statusCadastro === "CONCLUIDO"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : osDetalhe.statusCadastro === "EM_CADASTRO"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-amber-50 text-amber-800 border-amber-200",
                    )}
                  >
                    {osDetalhe.statusCadastro === "CONCLUIDO"
                      ? "Concluído"
                      : osDetalhe.statusCadastro === "EM_CADASTRO"
                        ? "Em Cadastro"
                        : "Aguardando"}
                  </span>
                ) : (
                  "—"
                )}
              </div>
            </div>
          ) : (
            <span
              className="text-slate-500 text-xs italic"
              data-testid="ordens-servico-detalhe-cadastro-nao-disponivel"
            >
              Não disponível
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
