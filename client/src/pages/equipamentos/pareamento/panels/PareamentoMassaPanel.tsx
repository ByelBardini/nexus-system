import { AlertCircle, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  PreviewPareamentoTable,
  type PreviewResult,
} from "../preview/PreviewPareamentoTable";
import type { ClientePareamentoLista } from "../domain/types";
import type { LotePareamentoListItem } from "../domain/types";
import type { MarcaPareamentoCatalog } from "../domain/types";
import type { ModeloPareamentoCatalog } from "../domain/types";
import type { MarcaSimcardPareamentoCatalog } from "../domain/types";
import type { OperadoraPareamentoCatalog } from "../domain/types";
import type { ProprietarioTipo } from "../domain/types";
import type { ParImeiIccid } from "../domain/types";
import { PareamentoCriarRastreadorBlock } from "../components/PareamentoCriarRastreadorBlock";
import { PareamentoCriarSimBlock } from "../components/PareamentoCriarSimBlock";
import { PareamentoProprietarioInfinityClienteCard } from "../components/PareamentoProprietarioInfinityClienteCard";

export type PareamentoMassaPanelProps = {
  textImeis: string;
  setTextImeis: (v: string) => void;
  textIccids: string;
  setTextIccids: (v: string) => void;
  minImeiMassa: number;
  minIccidMassa: number;
  imeisLen: number;
  iccidsLen: number;
  quantidadeBate: boolean;
  paresMassa: ParImeiIccid[];
  preview: PreviewResult | null;
  criarNovoRastreadorMassa: boolean;
  setCriarNovoRastreadorMassa: (v: boolean) => void;
  pertenceLoteRastreadorMassa: boolean;
  setPertenceLoteRastreadorMassa: (v: boolean) => void;
  criarNovoSimMassa: boolean;
  setCriarNovoSimMassa: (v: boolean) => void;
  pertenceLoteSimMassa: boolean;
  setPertenceLoteSimMassa: (v: boolean) => void;
  loteRastreadorId: string;
  setLoteRastreadorId: (v: string) => void;
  loteSimId: string;
  setLoteSimId: (v: string) => void;
  loteBuscaRastreador: string;
  setLoteBuscaRastreador: (v: string) => void;
  loteBuscaSim: string;
  setLoteBuscaSim: (v: string) => void;
  marcaRastreadorMassa: string;
  setMarcaRastreadorMassa: (v: string) => void;
  modeloRastreadorMassa: string;
  setModeloRastreadorMassa: (v: string) => void;
  operadoraSimMassa: string;
  setOperadoraSimMassa: (v: string) => void;
  marcaSimcardIdSimMassa: string;
  setMarcaSimcardIdSimMassa: (v: string) => void;
  planoSimcardIdSimMassa: string;
  setPlanoSimcardIdSimMassa: (v: string) => void;
  proprietarioMassa: ProprietarioTipo;
  setProprietarioMassa: (v: ProprietarioTipo) => void;
  clienteIdMassa: number | null;
  setClienteIdMassa: (v: number | null) => void;
  lotesRastreadoresFiltrados: LotePareamentoListItem[];
  lotesSimsFiltrados: LotePareamentoListItem[];
  marcasAtivas: MarcaPareamentoCatalog[];
  modelosPorMarcaMassa: ModeloPareamentoCatalog[];
  operadorasAtivas: OperadoraPareamentoCatalog[];
  marcasSimcardPorOperadoraMassa: MarcaSimcardPareamentoCatalog[];
  marcasSimcard: MarcaSimcardPareamentoCatalog[];
  clientes: ClientePareamentoLista[];
};

export function PareamentoMassaPanel(p: PareamentoMassaPanelProps) {
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-8 space-y-6">
        <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <MaterialIcon
                  name="edit_note"
                  className="text-slate-600 text-xl"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Entrada de Dados
                </h3>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Cole uma lista de identificadores por linha (vírgula,
                  ponto-vírgula ou quebra de linha)
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                  <MaterialIcon
                    name="sensors"
                    className="text-blue-600 text-base"
                  />
                </div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Lista de IMEIs (Rastreadores)
                </Label>
              </div>
              <textarea
                value={p.textImeis}
                onChange={(e) => p.setTextImeis(e.target.value)}
                placeholder={`358942109982341\n358942109982342\n358942109982343...`}
                className="h-48 w-full resize-none rounded-sm border border-slate-300 p-3 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {p.minImeiMassa > 0 && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Mínimo {p.minImeiMassa} dígito(s) por IMEI
                </p>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                  <MaterialIcon
                    name="sim_card"
                    className="text-blue-600 text-base"
                  />
                </div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Lista de ICCIDs (SIM Cards)
                </Label>
              </div>
              <textarea
                value={p.textIccids}
                onChange={(e) => p.setTextIccids(e.target.value)}
                placeholder={`895501100000001\n895501100000002\n895501100000003...`}
                className="h-48 w-full resize-none rounded-sm border border-slate-300 p-3 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {p.minIccidMassa > 0 && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Mínimo {p.minIccidMassa} dígito(s) por ICCID
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <MaterialIcon name="inventory_2" className="text-slate-600" />
              </div>
              <div>
                <Label className="block text-[10px] font-bold uppercase text-slate-600">
                  Para novos IDs: Lote ou criação manual
                </Label>
                <p className="text-[10px] font-medium text-slate-500">
                  Rastreadores e SIMs não encontrados serão criados conforme a
                  configuração abaixo
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200">
                    <MaterialIcon
                      name="sensors"
                      className="text-blue-600 text-lg"
                    />
                  </div>
                  <Label className="text-[10px] font-bold uppercase text-slate-600">
                    Rastreadores
                  </Label>
                </div>
                <PareamentoCriarRastreadorBlock
                  variant="massa"
                  criarNovo={p.criarNovoRastreadorMassa}
                  onCriarNovoChange={p.setCriarNovoRastreadorMassa}
                  onCriarNovoUnchecked={() => {
                    p.setPertenceLoteRastreadorMassa(true);
                    p.setMarcaRastreadorMassa("");
                    p.setModeloRastreadorMassa("");
                    p.setLoteRastreadorId("");
                  }}
                  pertenceLote={p.pertenceLoteRastreadorMassa}
                  onPertenceLoteChange={p.setPertenceLoteRastreadorMassa}
                  loteRastreadorId={p.loteRastreadorId}
                  onLoteRastreadorIdChange={p.setLoteRastreadorId}
                  loteBusca={p.loteBuscaRastreador}
                  onLoteBuscaChange={p.setLoteBuscaRastreador}
                  lotesFiltrados={p.lotesRastreadoresFiltrados}
                  marca={p.marcaRastreadorMassa}
                  modelo={p.modeloRastreadorMassa}
                  onMarcaChange={p.setMarcaRastreadorMassa}
                  onModeloChange={p.setModeloRastreadorMassa}
                  marcasAtivas={p.marcasAtivas}
                  modelosPorMarca={p.modelosPorMarcaMassa}
                />
              </div>
              <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200">
                    <MaterialIcon
                      name="sim_card"
                      className="text-blue-600 text-lg"
                    />
                  </div>
                  <Label className="text-[10px] font-bold uppercase text-slate-600">
                    SIM Cards
                  </Label>
                </div>
                <PareamentoCriarSimBlock
                  variant="massa"
                  criarNovo={p.criarNovoSimMassa}
                  onCriarNovoChange={p.setCriarNovoSimMassa}
                  onCriarNovoUnchecked={() => {
                    p.setPertenceLoteSimMassa(true);
                    p.setOperadoraSimMassa("");
                    p.setMarcaSimcardIdSimMassa("");
                    p.setPlanoSimcardIdSimMassa("");
                    p.setLoteSimId("");
                  }}
                  pertenceLote={p.pertenceLoteSimMassa}
                  onPertenceLoteChange={p.setPertenceLoteSimMassa}
                  loteSimId={p.loteSimId}
                  onLoteSimIdChange={p.setLoteSimId}
                  loteBusca={p.loteBuscaSim}
                  onLoteBuscaChange={p.setLoteBuscaSim}
                  lotesFiltrados={p.lotesSimsFiltrados}
                  marcasSimcard={p.marcasSimcard}
                  operadoraSim={p.operadoraSimMassa}
                  marcaSimcardId={p.marcaSimcardIdSimMassa}
                  planoSimcardId={p.planoSimcardIdSimMassa}
                  onOperadoraChange={p.setOperadoraSimMassa}
                  onMarcaSimcardChange={p.setMarcaSimcardIdSimMassa}
                  onPlanoSimcardChange={p.setPlanoSimcardIdSimMassa}
                  operadorasAtivas={p.operadorasAtivas}
                  marcasSimcardPorOperadora={p.marcasSimcardPorOperadoraMassa}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <PareamentoProprietarioInfinityClienteCard
              proprietario={p.proprietarioMassa}
              onInfinity={() => {
                p.setProprietarioMassa("INFINITY");
                p.setClienteIdMassa(null);
              }}
              onCliente={() => p.setProprietarioMassa("CLIENTE")}
              clientes={p.clientes}
              clienteId={p.clienteIdMassa}
              onClienteIdChange={p.setClienteIdMassa}
            />
          </div>

          {!p.quantidadeBate && (p.imeisLen > 0 || p.iccidsLen > 0) && (
            <div className="mt-4 flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-bold text-amber-800">
                Quantidade não confere: {p.imeisLen} IMEIs x {p.iccidsLen}{" "}
                ICCIDs.
                {p.imeisLen > p.iccidsLen
                  ? ` Faltam ${p.imeisLen - p.iccidsLen} ICCID(s).`
                  : ` Faltam ${p.iccidsLen - p.imeisLen} IMEI(s).`}
              </p>
            </div>
          )}
        </div>

        {p.preview && <PreviewPareamentoTable preview={p.preview} />}
      </div>

      <div className="col-span-4">
        <div className="sticky top-8">
          <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                Resumo da Montagem
              </h3>
              <MaterialIcon name="inventory_2" className="text-slate-400" />
            </div>
            <div className="space-y-6 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Total de Itens
                  </label>
                  <p className="mt-0.5 text-2xl font-bold text-slate-800">
                    {p.paresMassa.length}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      Pares
                    </span>
                  </p>
                </div>
                {p.preview && (
                  <div className="text-right">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      A Criar
                    </label>
                    <p className="mt-0.5 text-lg font-bold text-blue-600">
                      +
                      {p.preview.contadores.validos +
                        p.preview.contadores.exigemLote}
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Parâmetros de Destino
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase text-slate-500">
                      Status Pós-Montagem:
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Configurado
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/50 p-4">
              <Info className="h-5 w-5 shrink-0 text-blue-500" />
              <p className="text-[10px] font-medium uppercase leading-relaxed text-blue-700">
                Equipamentos serão vinculados logicamente no sistema e marcados
                como prontos para instalação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
