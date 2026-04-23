import type { RefObject } from "react";
import { AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SelectClienteSearch } from "@/components/SelectClienteSearch";
import {
  PreviewCsvTable,
  type CsvPreviewResult,
} from "../preview/PreviewCsvTable";
import type { CsvLinhaInput } from "../domain/types";
import type { ClientePareamentoLista } from "../domain/types";
import type { ProprietarioTipo } from "../domain/types";

export type PareamentoCsvPanelProps = {
  csvFileInputRef: RefObject<HTMLInputElement | null>;
  csvFileName: string;
  csvLinhas: CsvLinhaInput[];
  csvParseErro: string;
  csvPreview: CsvPreviewResult | null;
  proprietarioCsv: ProprietarioTipo;
  setProprietarioCsv: (v: ProprietarioTipo) => void;
  clienteIdCsv: number | null;
  setClienteIdCsv: (v: number | null) => void;
  clientes: ClientePareamentoLista[];
  onBaixarTemplate: () => void;
  onFileSelected: (file: File) => void;
  onEscolherArquivoClick: () => void;
};

export function PareamentoCsvPanel(p: PareamentoCsvPanelProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 space-y-6">
        <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <MaterialIcon
                  name="upload_file"
                  className="text-slate-600 text-xl"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Importar arquivo CSV
                </h3>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                  Cada linha vira um rastreador. Separador{" "}
                  <span className="font-mono">;</span> ou{" "}
                  <span className="font-mono">,</span>
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={p.onBaixarTemplate}
              className="h-9 gap-2 px-4 text-[11px] font-bold uppercase"
            >
              <MaterialIcon name="download" className="text-base" />
              Baixar modelo
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Arquivo CSV
              </Label>
              <div className="rounded-sm border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <input
                  ref={p.csvFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) p.onFileSelected(file);
                  }}
                  className="hidden"
                  data-testid="csv-file-input"
                />
                <MaterialIcon
                  name="cloud_upload"
                  className="text-4xl text-slate-400"
                />
                <p className="mt-2 text-xs text-slate-600">
                  {p.csvFileName
                    ? p.csvFileName
                    : "Selecione o arquivo .csv a importar"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={p.onEscolherArquivoClick}
                  className="mt-3 h-9 px-4 text-[11px] font-bold uppercase"
                >
                  Escolher arquivo
                </Button>
                {p.csvLinhas.length > 0 && (
                  <p className="mt-3 text-[11px] text-emerald-600">
                    {p.csvLinhas.length} linha(s) carregada(s)
                  </p>
                )}
                {p.csvParseErro && (
                  <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {p.csvParseErro}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Colunas esperadas
              </p>
              <ul className="space-y-1 text-[11px] text-slate-600">
                <li>
                  <span className="font-mono">imei</span>,{" "}
                  <span className="font-mono">iccid</span> — obrigatórios
                </li>
                <li>
                  <span className="font-mono">marca_rastreador</span>,{" "}
                  <span className="font-mono">modelo</span> — se rastreador novo
                  sem lote
                </li>
                <li>
                  <span className="font-mono">operadora</span>,{" "}
                  <span className="font-mono">marca_simcard</span>,{" "}
                  <span className="font-mono">plano</span> — se SIM novo sem
                  lote (ex.: <span className="font-mono">10MB</span> ou apenas{" "}
                  <span className="font-mono">10</span>)
                </li>
                <li>
                  <span className="font-mono">lote_rastreador</span>,{" "}
                  <span className="font-mono">lote_simcard</span> — referência
                  ou ID (opcional)
                </li>
              </ul>
            </div>

            {p.csvPreview && <PreviewCsvTable preview={p.csvPreview} />}
          </div>
        </div>
      </div>

      <div className="col-span-4 space-y-6">
        <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-800">
            Proprietário
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tipo
              </Label>
              <Select
                value={p.proprietarioCsv}
                onValueChange={(v) => {
                  p.setProprietarioCsv(v as ProprietarioTipo);
                  if (v === "INFINITY") p.setClienteIdCsv(null);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFINITY">Infinity</SelectItem>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {p.proprietarioCsv === "CLIENTE" && (
              <div>
                <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cliente
                </Label>
                <SelectClienteSearch
                  clientes={p.clientes}
                  value={p.clienteIdCsv ?? undefined}
                  onChange={(id) => p.setClienteIdCsv(id ?? null)}
                />
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Estes valores serão aplicados a todas as linhas importadas.
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-blue-600" />
            <div className="text-[11px] leading-relaxed text-blue-800">
              <p className="mb-1 font-bold uppercase">Como funciona</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>
                  Se IMEI/ICCID já existem livres no sistema, serão
                  reaproveitados.
                </li>
                <li>
                  Se não existem e há um lote, o aparelho é puxado do lote.
                </li>
                <li>
                  Se não existem e não há lote, são criados com os dados
                  informados.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
