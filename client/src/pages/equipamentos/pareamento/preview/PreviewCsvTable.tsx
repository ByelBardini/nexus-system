import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CsvAcao =
  | "VINCULAR_EXISTENTE"
  | "CRIAR_VIA_LOTE"
  | "CRIAR_MANUAL"
  | "ERRO";

export interface CsvPreviewLinha {
  imei: string;
  iccid: string;
  tracker_status:
    | "FOUND_AVAILABLE"
    | "FOUND_ALREADY_LINKED"
    | "NEEDS_CREATE"
    | "INVALID_FORMAT";
  sim_status:
    | "FOUND_AVAILABLE"
    | "FOUND_ALREADY_LINKED"
    | "NEEDS_CREATE"
    | "INVALID_FORMAT";
  tracker_acao: CsvAcao;
  sim_acao: CsvAcao;
  erros: string[];
  trackerId?: number;
  simId?: number;
  marcaRastreador?: string;
  modeloRastreador?: string;
  operadora?: string;
  marcaSimcardId?: number;
  planoSimcardId?: number;
  loteRastreadorId?: number;
  loteSimId?: number;
  loteRastreadorReferencia?: string;
  loteSimReferencia?: string;
}

export interface CsvPreviewResult {
  linhas: CsvPreviewLinha[];
  contadores: { validos: number; comAviso: number; erros: number };
}

const ACAO_LABELS: Record<CsvAcao, { label: string; className: string }> = {
  VINCULAR_EXISTENTE: {
    label: "Vincular existente",
    className: "bg-emerald-100 text-emerald-700",
  },
  CRIAR_VIA_LOTE: {
    label: "Criar via lote",
    className: "bg-blue-100 text-blue-700",
  },
  CRIAR_MANUAL: {
    label: "Criar novo",
    className: "bg-indigo-100 text-indigo-700",
  },
  ERRO: {
    label: "Erro",
    className: "bg-red-100 text-red-700",
  },
};

const ERROS_LABELS: Record<string, string> = {
  IMEI_INVALIDO: "IMEI inválido ou vazio",
  ICCID_INVALIDO: "ICCID inválido ou vazio",
  IMEI_JA_VINCULADO: "IMEI já está vinculado a outro SIM",
  ICCID_JA_VINCULADO: "ICCID já está vinculado a outro rastreador",
  FALTA_DADOS_RASTREADOR: "Rastreador não existe: informe lote OU marca+modelo",
  FALTA_DADOS_SIM: "SIM não existe: informe lote OU operadora/marca simcard",
  LOTE_RASTREADOR_NAO_ENCONTRADO: "Lote de rastreador não encontrado",
  LOTE_SIMCARD_NAO_ENCONTRADO: "Lote de simcard não encontrado",
  MARCA_SIMCARD_NAO_ENCONTRADA: "Marca de simcard não encontrada",
  PLANO_SIMCARD_NAO_ENCONTRADO: "Plano de simcard não encontrado",
};

function renderRastreadorDetalhe(l: CsvPreviewLinha): string {
  if (l.tracker_acao === "VINCULAR_EXISTENTE") {
    const partes = [l.marcaRastreador, l.modeloRastreador].filter(Boolean);
    return partes.length > 0 ? partes.join(" / ") : "Existente";
  }
  if (l.tracker_acao === "CRIAR_VIA_LOTE") {
    return `Lote ${l.loteRastreadorReferencia ?? l.loteRastreadorId ?? ""}`;
  }
  if (l.tracker_acao === "CRIAR_MANUAL") {
    return [l.marcaRastreador, l.modeloRastreador].filter(Boolean).join(" / ");
  }
  return "—";
}

function renderSimDetalhe(l: CsvPreviewLinha): string {
  if (l.sim_acao === "VINCULAR_EXISTENTE") {
    return l.operadora ?? "Existente";
  }
  if (l.sim_acao === "CRIAR_VIA_LOTE") {
    return `Lote ${l.loteSimReferencia ?? l.loteSimId ?? ""}`;
  }
  if (l.sim_acao === "CRIAR_MANUAL") {
    return l.operadora ?? "Novo";
  }
  return "—";
}

interface Props {
  preview: CsvPreviewResult;
}

export function PreviewCsvTable({ preview }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex-1 rounded-sm border-l-4 border-emerald-500 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">
            Válidos
          </Label>
          <p className="text-2xl font-bold text-slate-800">
            {preview.contadores.validos}
          </p>
        </div>
        <div className="flex-1 rounded-sm border-l-4 border-amber-500 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">
            Com aviso
          </Label>
          <p className="text-2xl font-bold text-slate-800">
            {preview.contadores.comAviso}
          </p>
        </div>
        <div className="flex-1 rounded-sm border-l-4 border-slate-400 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">
            Total de linhas
          </Label>
          <p className="text-2xl font-bold text-slate-800">
            {preview.linhas.length}
          </p>
        </div>
        <div className="flex-1 rounded-sm border-l-4 border-red-500 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">
            Erros
          </Label>
          <p className="text-2xl font-bold text-slate-800">
            {preview.contadores.erros}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[10px] font-bold uppercase text-slate-600">
            Preview do CSV
          </span>
          <span className="rounded bg-slate-200 px-2 py-0.5 text-[9px] text-slate-600">
            {preview.linhas.length} itens processados
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                <TableHead className="px-3 py-3 text-[10px] font-bold uppercase text-slate-600">
                  #
                </TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold uppercase text-slate-600">
                  IMEI
                </TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold uppercase text-slate-600">
                  ICCID
                </TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold uppercase text-slate-600">
                  Rastreador
                </TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold uppercase text-slate-600">
                  SIM
                </TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold uppercase text-slate-600">
                  Erros
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.linhas.map((linha, idx) => {
                const hasErro = linha.erros.length > 0;
                return (
                  <TableRow
                    key={idx}
                    className={cn(
                      "border-slate-100",
                      hasErro && "bg-red-50/50",
                    )}
                  >
                    <TableCell className="px-3 py-3 text-xs text-slate-500">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-3 py-3 font-mono text-xs">
                      {linha.imei || (
                        <span className="italic text-slate-400">vazio</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3 font-mono text-xs">
                      {linha.iccid || (
                        <span className="italic text-slate-400">vazio</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold",
                            ACAO_LABELS[linha.tracker_acao].className,
                          )}
                        >
                          {ACAO_LABELS[linha.tracker_acao].label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {renderRastreadorDetalhe(linha)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold",
                            ACAO_LABELS[linha.sim_acao].className,
                          )}
                        >
                          {ACAO_LABELS[linha.sim_acao].label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {renderSimDetalhe(linha)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-[11px] text-red-600">
                      {linha.erros.length === 0 ? (
                        <span className="text-emerald-600">—</span>
                      ) : (
                        <ul className="list-disc space-y-0.5 pl-4">
                          {linha.erros.map((e) => (
                            <li key={e}>{ERROS_LABELS[e] ?? e}</li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
