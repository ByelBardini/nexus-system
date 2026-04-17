import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type TrackerStatus = 'FOUND_AVAILABLE' | 'FOUND_ALREADY_LINKED' | 'NEEDS_CREATE' | 'INVALID_FORMAT'
type ActionNeeded = 'OK' | 'SELECT_TRACKER_LOT' | 'SELECT_SIM_LOT' | 'FIX_ERROR'

export interface PreviewLinha {
  imei: string
  iccid: string
  tracker_status: TrackerStatus
  sim_status: TrackerStatus
  action_needed: ActionNeeded
  trackerId?: number
  simId?: number
  marca?: string
  modelo?: string
  operadora?: string
}

export interface PreviewResult {
  linhas: PreviewLinha[]
  contadores: { validos: number; exigemLote: number; erros: number }
}

export const TRACKER_STATUS_LABELS: Record<TrackerStatus, { label: string; className: string }> = {
  FOUND_AVAILABLE: { label: 'Disponível', className: 'bg-emerald-100 text-emerald-700' },
  FOUND_ALREADY_LINKED: { label: 'Em Uso', className: 'bg-red-100 text-red-700' },
  NEEDS_CREATE: { label: 'Não Encontrado', className: 'bg-blue-100 text-blue-700' },
  INVALID_FORMAT: { label: 'Formato Inválido', className: 'bg-amber-100 text-amber-700' },
}

export const ACTION_LABELS: Record<ActionNeeded, { label: string; className: string }> = {
  OK: { label: '✔ Pronto para vincular', className: 'font-bold text-emerald-600' },
  SELECT_TRACKER_LOT: { label: '➕ Será criado (lote rastreador)', className: 'font-bold text-blue-600' },
  SELECT_SIM_LOT: { label: '➕ Será criado (lote SIM)', className: 'font-bold text-blue-600' },
  FIX_ERROR: { label: '✖ Erro', className: 'font-bold text-red-600' },
}

interface PreviewPareamentoTableProps {
  preview: PreviewResult
}

export function PreviewPareamentoTable({ preview }: PreviewPareamentoTableProps) {
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <div className="flex-1 rounded-sm border-l-4 border-emerald-500 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">Válidos</Label>
          <p className="text-2xl font-bold text-slate-800">{preview.contadores.validos}</p>
        </div>
        <div className="flex-1 rounded-sm border-l-4 border-blue-500 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">Exigem Lote</Label>
          <p className="text-2xl font-bold text-slate-800">{preview.contadores.exigemLote}</p>
        </div>
        <div className="flex-1 rounded-sm border-l-4 border-amber-500 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">Duplicados</Label>
          <p className="text-2xl font-bold text-slate-800">0</p>
        </div>
        <div className="flex-1 rounded-sm border-l-4 border-red-500 bg-white p-4 shadow-sm">
          <Label className="block text-[10px] font-bold uppercase text-slate-400">Erros</Label>
          <p className="text-2xl font-bold text-slate-800">{preview.contadores.erros}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
          <span className="text-[10px] font-bold uppercase text-slate-600">
            Preview de Associação
          </span>
          <span className="rounded bg-slate-200 px-2 py-0.5 text-[9px] text-slate-600">
            {preview.linhas.length} itens processados
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600">
                IMEI
              </TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600">
                ICCID
              </TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600">
                Status Rastreador
              </TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600">
                Status SIM
              </TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600">
                Resultado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.linhas.map((linha, idx) => (
              <TableRow key={idx} className="border-slate-100">
                <TableCell className="px-4 py-3 font-mono text-xs">{linha.imei}</TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs">{linha.iccid}</TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      TRACKER_STATUS_LABELS[linha.tracker_status].className
                    )}
                  >
                    {TRACKER_STATUS_LABELS[linha.tracker_status].label}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      TRACKER_STATUS_LABELS[linha.sim_status].className
                    )}
                  >
                    {TRACKER_STATUS_LABELS[linha.sim_status].label}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-[11px]">
                  <span className={ACTION_LABELS[linha.action_needed].className}>
                    {ACTION_LABELS[linha.action_needed].label}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
