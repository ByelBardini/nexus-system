import { MaterialIcon } from "@/components/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuxilioCopiaItem } from "@/lib/cadastro-rastreamento-copy";
import {
  CADASTRO_RAST_STATUS_CONFIG,
  PLATAFORMA_RAST_LABEL,
} from "@/lib/cadastro-rastreamento-ui";
import { cadastroRastreamentoAcaoLabels } from "@/lib/cadastro-rastreamento-tipo-mappers";
import type { OrdemCadastro, Plataforma } from "@/types/cadastro-rastreamento";
import { cn } from "@/lib/utils";
import { PanelBlock, PanelRow } from "./CadastroRastreamentoPanelPrimitives";

export function CadastroRastreamentoWorkPanel({
  selectedOrdem,
  plataforma,
  setPlataforma,
  isMutating,
  handleAvancarStatus,
  copiar,
  copiarTodos,
  auxilioCopiaItens,
}: {
  selectedOrdem: OrdemCadastro | null;
  plataforma: Plataforma;
  setPlataforma: (p: Plataforma) => void;
  isMutating: boolean;
  handleAvancarStatus: () => void;
  copiar: (valor: string, label: string) => void;
  copiarTodos: (ordem: OrdemCadastro) => void;
  auxilioCopiaItens: AuxilioCopiaItem[];
}) {
  return (
    <aside className="w-[340px] shrink-0 bg-white border border-slate-300 shadow-sm sticky top-4 self-start">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialIcon name="work" className="text-erp-blue text-lg" />
          <h3 className="text-xs font-bold text-slate-700 font-condensed uppercase tracking-tight">
            Mesa de Trabalho
          </h3>
        </div>
        {selectedOrdem && (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded font-bold border",
              CADASTRO_RAST_STATUS_CONFIG[selectedOrdem.status].className,
            )}
          >
            OS #{selectedOrdem.id}
          </span>
        )}
      </div>

      {!selectedOrdem ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 px-8 text-center">
          <MaterialIcon
            name="touch_app"
            className="text-slate-200 text-[3.5rem]"
          />
          <p className="text-xs font-bold text-slate-400 font-condensed uppercase">
            Selecione uma OS
          </p>
          <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
            Clique em uma ordem da tabela para ver os detalhes e iniciar o
            cadastro
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-5">
          <PanelBlock icon="info" title="Dados da Ordem">
            <PanelRow label="Cliente" value={selectedOrdem.cliente} highlight />
            <PanelRow
              label="Subcliente"
              value={selectedOrdem.subcliente ?? "—"}
            />
            <PanelRow
              label="Tipo de Serviço"
              value={selectedOrdem.tipoServico}
            />
            <PanelRow label="Técnico" value={selectedOrdem.tecnico} />
          </PanelBlock>

          <PanelBlock icon="directions_car" title="Dados do Veículo">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <p className="text-[9px] uppercase text-slate-400">Placa</p>
                <p className="text-sm font-black text-erp-blue">
                  {selectedOrdem.placa}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">Cor</p>
                <p className="text-[11px] font-medium text-slate-700">
                  {selectedOrdem.cor}
                </p>
              </div>
              <div className="col-span-2 pt-1.5 border-t border-slate-200">
                <p className="text-[9px] uppercase text-slate-400">Modelo</p>
                <p className="text-[11px] font-medium text-slate-700">
                  {selectedOrdem.modelo}
                </p>
              </div>
            </div>
          </PanelBlock>

          {(selectedOrdem.tipoRegistro === "CADASTRO" ||
            selectedOrdem.tipoRegistro === "REVISAO" ||
            selectedOrdem.tipoRegistro === "OUTRO") && (
            <PanelBlock icon="router" title="Aparelho de Entrada">
              <div>
                <p className="text-[9px] uppercase text-slate-400">Modelo</p>
                <p className="text-[11px] font-medium text-slate-700">
                  {selectedOrdem.modeloAparelhoEntrada ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">IMEI</p>
                <p className="text-xs font-mono font-bold text-slate-800">
                  {selectedOrdem.imei}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">
                  ICCID (Chip)
                </p>
                <p className="text-xs font-mono font-bold text-slate-800">
                  {selectedOrdem.iccid}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200">
                <div>
                  <p className="text-[9px] uppercase text-slate-400">Local</p>
                  <p className="text-[10px] text-slate-700">
                    {selectedOrdem.local}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-400">
                    Pós-Chave
                  </p>
                  <p className="text-[10px] font-medium text-emerald-700">
                    {selectedOrdem.posChave}
                  </p>
                </div>
              </div>
            </PanelBlock>
          )}

          {(selectedOrdem.tipoRegistro === "REVISAO" ||
            selectedOrdem.tipoRegistro === "RETIRADA") && (
            <PanelBlock icon="output" title="Aparelho de Saída">
              <div>
                <p className="text-[9px] uppercase text-slate-400">Modelo</p>
                <p className="text-[11px] font-medium text-slate-700">
                  {selectedOrdem.modeloSaida ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">IMEI</p>
                <p className="text-xs font-mono font-bold text-slate-800">
                  {selectedOrdem.imeiSaida}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">
                  ICCID (Chip)
                </p>
                <p className="text-xs font-mono font-bold text-slate-800">
                  {selectedOrdem.iccidSaida}
                </p>
              </div>
            </PanelBlock>
          )}

          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <MaterialIcon
                name="content_copy"
                className="text-slate-400 text-sm"
              />
              Auxílio de Cadastro
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {auxilioCopiaItens.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => copiar(value, label)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 rounded-sm text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <MaterialIcon
                    name="content_copy"
                    className="text-sm text-slate-400"
                  />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => copiarTodos(selectedOrdem)}
                className="col-span-2 flex items-center justify-center gap-2 py-2 bg-erp-blue/10 border border-erp-blue/20 rounded-sm text-[10px] font-bold text-erp-blue hover:bg-erp-blue/15 transition-colors"
              >
                <MaterialIcon name="copy_all" className="text-base" />
                Copiar Todos os Dados Principais
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            {selectedOrdem.status === "EM_CADASTRO" && (
              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                  <MaterialIcon
                    name="language"
                    className="text-slate-400 text-sm"
                  />
                  Plataforma
                </Label>
                <Select
                  value={plataforma}
                  onValueChange={(v) => setPlataforma(v as Plataforma)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GETRAK">Getrak</SelectItem>
                    <SelectItem value="GEOMAPS">Geomaps</SelectItem>
                    <SelectItem value="SELSYN">Selsyn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedOrdem.status === "CONCLUIDO" &&
              selectedOrdem.plataforma && (
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                    <MaterialIcon
                      name="language"
                      className="text-slate-400 text-sm"
                    />
                    Plataforma
                  </Label>
                  <div className="h-9 rounded-sm border border-slate-200 bg-slate-50 px-3 flex items-center gap-2">
                    <MaterialIcon
                      name="check_circle"
                      className="text-emerald-500 text-sm"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {PLATAFORMA_RAST_LABEL[selectedOrdem.plataforma]}
                    </span>
                  </div>
                </div>
              )}

            <div>
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                <MaterialIcon
                  name="pending_actions"
                  className="text-slate-400 text-sm"
                />
                Status do Registro
              </Label>
              <div
                className={cn(
                  "h-9 rounded-sm px-3 flex items-center text-xs font-bold border",
                  CADASTRO_RAST_STATUS_CONFIG[selectedOrdem.status].className,
                )}
              >
                {CADASTRO_RAST_STATUS_CONFIG[selectedOrdem.status].label}
              </div>
            </div>

            {selectedOrdem.status === "CONCLUIDO" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                    Responsável
                  </Label>
                  <Input
                    className="h-9 text-xs bg-slate-50"
                    readOnly
                    value={selectedOrdem.concluidoPor ?? "—"}
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                    Concluído em
                  </Label>
                  <Input
                    className="h-9 text-xs bg-slate-50"
                    readOnly
                    value={selectedOrdem.concluidoEm ?? "—"}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-1 pb-2">
            {selectedOrdem.status === "AGUARDANDO" && (
              <Button
                type="button"
                onClick={handleAvancarStatus}
                disabled={isMutating}
                className="w-full h-10 bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase gap-2"
              >
                <MaterialIcon name="play_arrow" className="text-base" />
                {
                  cadastroRastreamentoAcaoLabels[selectedOrdem.tipoRegistro]
                    .iniciar
                }
              </Button>
            )}
            {selectedOrdem.status === "EM_CADASTRO" && (
              <Button
                type="button"
                onClick={handleAvancarStatus}
                disabled={isMutating}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase gap-2"
              >
                <MaterialIcon name="check_circle" className="text-base" />
                {
                  cadastroRastreamentoAcaoLabels[selectedOrdem.tipoRegistro]
                    .concluir
                }
              </Button>
            )}
            {selectedOrdem.status === "CONCLUIDO" && (
              <Button
                type="button"
                variant="outline"
                disabled
                className="w-full h-10 text-xs font-bold uppercase gap-2"
              >
                <MaterialIcon name="verified" className="text-base" />
                {
                  cadastroRastreamentoAcaoLabels[selectedOrdem.tipoRegistro]
                    .concluido
                }
              </Button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
