import {
  Link2,
  Router,
  Smartphone,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import {
  TRACKER_STATUS_LABELS,
  type PreviewResult,
} from "../preview/PreviewPareamentoTable";
import type { ClientePareamentoLista } from "../domain/types";
import type { MarcaPareamentoCatalog } from "../domain/types";
import type { ModeloPareamentoCatalog } from "../domain/types";
import type { MarcaSimcardPareamentoCatalog } from "../domain/types";
import type { OperadoraPareamentoCatalog } from "../domain/types";
import type { LotePareamentoListItem } from "../domain/types";
import type { ProprietarioTipo } from "../domain/types";
import { PareamentoCriarRastreadorBlock } from "../components/PareamentoCriarRastreadorBlock";
import { PareamentoCriarSimBlock } from "../components/PareamentoCriarSimBlock";
import { PareamentoProprietarioInfinityClienteCard } from "../components/PareamentoProprietarioInfinityClienteCard";

export type PareamentoIndividualPanelProps = {
  imeiIndividual: string;
  setImeiIndividual: (v: string) => void;
  iccidIndividual: string;
  setIccidIndividual: (v: string) => void;
  criarNovoRastreador: boolean;
  setCriarNovoRastreador: (v: boolean) => void;
  pertenceLoteRastreador: boolean;
  setPertenceLoteRastreador: (v: boolean) => void;
  loteRastreadorId: string;
  setLoteRastreadorId: (v: string) => void;
  loteBuscaRastreador: string;
  setLoteBuscaRastreador: (v: string) => void;
  marcaRastreador: string;
  setMarcaRastreador: (v: string) => void;
  modeloRastreador: string;
  setModeloRastreador: (v: string) => void;
  criarNovoSim: boolean;
  setCriarNovoSim: (v: boolean) => void;
  pertenceLoteSim: boolean;
  setPertenceLoteSim: (v: boolean) => void;
  loteSimId: string;
  setLoteSimId: (v: string) => void;
  loteBuscaSim: string;
  setLoteBuscaSim: (v: string) => void;
  operadoraSim: string;
  setOperadoraSim: (v: string) => void;
  marcaSimcardIdSim: string;
  setMarcaSimcardIdSim: (v: string) => void;
  planoSimcardIdSim: string;
  setPlanoSimcardIdSim: (v: string) => void;
  proprietarioIndividual: ProprietarioTipo;
  setProprietarioIndividual: (v: ProprietarioTipo) => void;
  clienteIdIndividual: number | null;
  setClienteIdIndividual: (v: number | null) => void;
  preview: PreviewResult | null;
  quantidadeCriada: number;
  podeConfirmarIndividual: boolean;
  podeConfirmarPareamentoIndividual: boolean;
  progressoVinculoIndividual: number;
  minImeiIndividual: number;
  minIccidIndividual: number;
  lotesRastreadoresFiltrados: LotePareamentoListItem[];
  lotesSimsFiltrados: LotePareamentoListItem[];
  marcasAtivas: MarcaPareamentoCatalog[];
  modelosPorMarca: ModeloPareamentoCatalog[];
  operadorasAtivas: OperadoraPareamentoCatalog[];
  marcasSimcardPorOperadora: MarcaSimcardPareamentoCatalog[];
  marcasSimcard: MarcaSimcardPareamentoCatalog[];
  clientes: ClientePareamentoLista[];
};

export function PareamentoIndividualPanel(p: PareamentoIndividualPanelProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <MaterialIcon
                  name="sensors"
                  className="text-blue-600 text-xl"
                />
                <h3 className="text-xs font-bold text-slate-700 uppercase">
                  Rastreador
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                PASSO 01
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  IMEI do Equipamento
                </Label>
                <div className="relative">
                  <Input
                    value={p.imeiIndividual}
                    onChange={(e) => p.setImeiIndividual(e.target.value)}
                    placeholder="Ex: 358942109982341"
                    className="h-9 pr-10 font-mono text-sm"
                  />
                  <MaterialIcon
                    name="barcode_scanner"
                    className="absolute right-2.5 top-2 text-slate-300"
                  />
                </div>
              </div>
              <PareamentoCriarRastreadorBlock
                variant="individual"
                criarNovo={p.criarNovoRastreador}
                onCriarNovoChange={p.setCriarNovoRastreador}
                onCriarNovoUnchecked={() => {
                  p.setPertenceLoteRastreador(false);
                  p.setMarcaRastreador("");
                  p.setModeloRastreador("");
                  p.setLoteRastreadorId("");
                }}
                pertenceLote={p.pertenceLoteRastreador}
                onPertenceLoteChange={p.setPertenceLoteRastreador}
                loteRastreadorId={p.loteRastreadorId}
                onLoteRastreadorIdChange={p.setLoteRastreadorId}
                loteBusca={p.loteBuscaRastreador}
                onLoteBuscaChange={p.setLoteBuscaRastreador}
                lotesFiltrados={p.lotesRastreadoresFiltrados}
                marca={p.marcaRastreador}
                modelo={p.modeloRastreador}
                onMarcaChange={p.setMarcaRastreador}
                onModeloChange={p.setModeloRastreador}
                marcasAtivas={p.marcasAtivas}
                modelosPorMarca={p.modelosPorMarca}
              />
              {p.preview?.linhas[0]?.tracker_status === "FOUND_AVAILABLE" && (
                <div className="grid grid-cols-2 gap-3 rounded-sm bg-slate-50 p-2">
                  <div>
                    <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      Marca
                    </Label>
                    <span className="text-xs font-medium">
                      {p.preview.linhas[0].marca ?? "--"}
                    </span>
                  </div>
                  <div>
                    <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      Modelo
                    </Label>
                    <span className="text-xs font-medium">
                      {p.preview.linhas[0].modelo ?? "--"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <MaterialIcon
                  name="sim_card"
                  className="text-blue-600 text-xl"
                />
                <h3 className="text-xs font-bold text-slate-700 uppercase">
                  SIM Card
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                PASSO 02
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  ICCID / Linha
                </Label>
                <div className="relative">
                  <Input
                    value={p.iccidIndividual}
                    onChange={(e) => p.setIccidIndividual(e.target.value)}
                    placeholder="Ex: 895501100000001"
                    className="h-9 pr-10 font-mono text-sm"
                  />
                  <MaterialIcon
                    name="search"
                    className="absolute right-2.5 top-2 text-slate-300"
                  />
                </div>
              </div>
              <PareamentoCriarSimBlock
                variant="individual"
                criarNovo={p.criarNovoSim}
                onCriarNovoChange={p.setCriarNovoSim}
                onCriarNovoUnchecked={() => {
                  p.setPertenceLoteSim(false);
                  p.setOperadoraSim("");
                  p.setMarcaSimcardIdSim("");
                  p.setPlanoSimcardIdSim("");
                  p.setLoteSimId("");
                }}
                pertenceLote={p.pertenceLoteSim}
                onPertenceLoteChange={p.setPertenceLoteSim}
                loteSimId={p.loteSimId}
                onLoteSimIdChange={p.setLoteSimId}
                loteBusca={p.loteBuscaSim}
                onLoteBuscaChange={p.setLoteBuscaSim}
                lotesFiltrados={p.lotesSimsFiltrados}
                marcasSimcard={p.marcasSimcard}
                operadoraSim={p.operadoraSim}
                marcaSimcardId={p.marcaSimcardIdSim}
                planoSimcardId={p.planoSimcardIdSim}
                onOperadoraChange={p.setOperadoraSim}
                onMarcaSimcardChange={p.setMarcaSimcardIdSim}
                onPlanoSimcardChange={p.setPlanoSimcardIdSim}
                operadorasAtivas={p.operadorasAtivas}
                marcasSimcardPorOperadora={p.marcasSimcardPorOperadora}
              />
              {p.preview?.linhas[0]?.sim_status === "FOUND_AVAILABLE" && (
                <div className="rounded-sm bg-slate-50 p-2">
                  <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                    Operadora
                  </Label>
                  <span className="text-xs font-medium">
                    {p.preview.linhas[0].operadora ?? "--"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-dashed border-blue-200 bg-blue-50/30 p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-blue-100 pb-3">
            <MaterialIcon name="lan" className="text-blue-600 text-lg" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-800">
              Visualização da Unidade Lógica
            </h3>
          </div>
          <div className="flex items-center justify-center gap-8 text-slate-400">
            <div className="flex flex-col items-center gap-1">
              <Router className="h-8 w-8" />
              <span className="text-[10px] font-bold uppercase">
                {p.imeiIndividual.trim() || "Aguardando IMEI"}
              </span>
            </div>
            <Link2 className="h-6 w-6 text-slate-300" />
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="h-8 w-8" />
              <span className="text-[10px] font-bold uppercase">
                {p.iccidIndividual.trim() || "Aguardando ICCID"}
              </span>
            </div>
          </div>
        </div>

        <PareamentoProprietarioInfinityClienteCard
          proprietario={p.proprietarioIndividual}
          onInfinity={() => {
            p.setProprietarioIndividual("INFINITY");
            p.setClienteIdIndividual(null);
          }}
          onCliente={() => p.setProprietarioIndividual("CLIENTE")}
          clientes={p.clientes}
          clienteId={p.clienteIdIndividual}
          onClienteIdChange={p.setClienteIdIndividual}
        />
      </div>

      <div className="col-span-4">
        <div className="sticky top-24 space-y-4">
          <div className="overflow-hidden rounded-sm border border-slate-700 bg-slate-900 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Resumo da Configuração
              </h3>
              {p.podeConfirmarPareamentoIndividual ? (
                <span className="rounded-sm bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  PRONTO
                </span>
              ) : p.preview ? (
                p.preview.contadores.exigemLote > 0 ? (
                  <span className="rounded-sm bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    CONFIGURE
                  </span>
                ) : (
                  <span className="rounded-sm bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    ERRO
                  </span>
                )
              ) : (
                <span className="rounded-sm bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  RASCUNHO
                </span>
              )}
            </div>
            <div className="space-y-6 p-6">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Rastreador
                </label>
                <div className="flex items-center gap-3 rounded-sm border border-slate-800 bg-slate-800/50 p-3">
                  <MaterialIcon name="sensors" className="text-slate-500" />
                  <span className="font-mono text-xs text-slate-300">
                    {p.imeiIndividual.trim() || "-- PENDENTE --"}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  SIM Card
                </label>
                <div className="flex items-center gap-3 rounded-sm border border-slate-800 bg-slate-800/50 p-3">
                  <MaterialIcon name="sim_card" className="text-slate-500" />
                  <span className="font-mono text-xs text-slate-300">
                    {p.iccidIndividual.trim() || "-- PENDENTE --"}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-600">
                    Status do Vínculo
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      p.podeConfirmarPareamentoIndividual
                        ? "text-emerald-400"
                        : "text-amber-400",
                    )}
                  >
                    {p.podeConfirmarPareamentoIndividual
                      ? "Completo"
                      : "Incompleto"}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-erp-blue transition-all duration-300"
                    style={{
                      width: p.podeConfirmarPareamentoIndividual
                        ? "100%"
                        : `${p.progressoVinculoIndividual}%`,
                    }}
                  />
                </div>
                {!p.podeConfirmarPareamentoIndividual &&
                  !p.podeConfirmarIndividual &&
                  (p.imeiIndividual.replace(/\D/g, "").length > 0 ||
                    p.iccidIndividual.replace(/\D/g, "").length > 0) && (
                    <p className="mt-2 text-[10px] text-amber-400">
                      {p.minImeiIndividual > 0
                        ? `IMEI deve ter ao menos ${p.minImeiIndividual} dígito(s).`
                        : "Informe o IMEI."}{" "}
                      {p.minIccidIndividual > 0
                        ? `ICCID deve ter ao menos ${p.minIccidIndividual} dígito(s).`
                        : "Informe o ICCID."}
                    </p>
                  )}
                {!p.podeConfirmarPareamentoIndividual &&
                  p.podeConfirmarIndividual && (
                    <div className="mt-2 space-y-1.5">
                      {!p.preview ? (
                        <p className="text-[10px] text-amber-400">
                          Verificando...
                        </p>
                      ) : p.preview.contadores.exigemLote > 0 ? (
                        <p className="text-[10px] text-amber-400">
                          Selecione os lotes ou informe marca/modelo e operadora
                          para itens novos.
                        </p>
                      ) : p.preview.contadores.erros > 0 ? (
                        <>
                          <p className="text-[10px] text-amber-400">
                            Corrija os erros abaixo:
                          </p>
                          {p.preview.linhas[0] && (
                            <div className="flex flex-wrap gap-2">
                              {p.preview.linhas[0].tracker_status ===
                                "INVALID_FORMAT" && (
                                <span
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[10px] font-bold",
                                    TRACKER_STATUS_LABELS.INVALID_FORMAT
                                      .className,
                                  )}
                                >
                                  Rastreador: Formato inválido (IMEI deve ter
                                  14-16 dígitos)
                                </span>
                              )}
                              {p.preview.linhas[0].tracker_status ===
                                "FOUND_ALREADY_LINKED" && (
                                <span
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[10px] font-bold",
                                    TRACKER_STATUS_LABELS.FOUND_ALREADY_LINKED
                                      .className,
                                  )}
                                >
                                  Rastreador: Em uso (já vinculado)
                                </span>
                              )}
                              {p.preview.linhas[0].sim_status ===
                                "INVALID_FORMAT" && (
                                <span
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[10px] font-bold",
                                    TRACKER_STATUS_LABELS.INVALID_FORMAT
                                      .className,
                                  )}
                                >
                                  SIM: Formato inválido (ICCID deve ter 18-21
                                  dígitos)
                                </span>
                              )}
                              {p.preview.linhas[0].sim_status ===
                                "FOUND_ALREADY_LINKED" && (
                                <span
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[10px] font-bold",
                                    TRACKER_STATUS_LABELS.FOUND_ALREADY_LINKED
                                      .className,
                                  )}
                                >
                                  SIM: Em uso (já vinculado)
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-amber-400">
                          Clique em Verificar para validar os dados.
                        </p>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
          {p.quantidadeCriada > 0 && (
            <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">
                {p.quantidadeCriada} equipamento(s) criado(s) nesta sessão
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
