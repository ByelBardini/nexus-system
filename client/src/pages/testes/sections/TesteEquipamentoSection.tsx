import { MaterialIcon } from '@/components/MaterialIcon'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SelectRastreadorTeste } from '../SelectRastreadorTeste'
import { STATUS_CONFIG_APARELHO } from '@/lib/aparelho-status'
import { formatarTempoMinutos } from '@/lib/format'
import type { RastreadorParaTeste } from '../testes-types'

function operadoraMarcaIccid(r: RastreadorParaTeste): string {
  const operadora =
    r.marcaSimcard?.operadora?.nome ??
    r.operadora ??
    r.simVinculado?.marcaSimcard?.operadora?.nome ??
    r.simVinculado?.operadora ??
    null
  const marcaSim = r.marcaSimcard?.nome ?? r.simVinculado?.marcaSimcard?.nome ?? null
  const iccid = (r.simVinculado?.identificador ?? '').trim()
  const plano = r.planoSimcard?.planoMb ?? r.simVinculado?.planoSimcard?.planoMb
  const planoStr = plano != null ? `${plano} MB` : null
  const partes = [operadora, marcaSim, iccid || null, planoStr].filter((x): x is string => !!x)
  return partes.length > 0 ? partes.join(' / ') : '—'
}

interface TesteEquipamentoSectionProps {
  rastreadores: RastreadorParaTeste[]
  value: string
  onChange: (v: string) => void
  aparelhoSelecionado: RastreadorParaTeste | null
  onTrocarAparelho: () => void
  tempoRastreadorEmTestesMin?: number
}

export function TesteEquipamentoSection({
  rastreadores,
  value,
  onChange,
  aparelhoSelecionado,
  onTrocarAparelho,
  tempoRastreadorEmTestesMin,
}: TesteEquipamentoSectionProps) {
  const statusConfig = aparelhoSelecionado
    ? STATUS_CONFIG_APARELHO[aparelhoSelecionado.status as keyof typeof STATUS_CONFIG_APARELHO]
    : null

  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialIcon name="devices" className="text-erp-blue text-lg" />
          <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
            02. Identificação do Equipamento
          </h2>
        </div>
        {tempoRastreadorEmTestesMin != null && aparelhoSelecionado && (
          <span className="text-[10px] font-medium text-slate-500">
            Rastreador em testes: <span className="font-bold text-slate-700">{formatarTempoMinutos(tempoRastreadorEmTestesMin)}</span>
          </span>
        )}
      </div>
      <div className="p-6">
        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
              Selecionar Equipamento (IMEI, ICCID, Serial)
            </Label>
            <SelectRastreadorTeste
              rastreadores={rastreadores}
              value={value}
              onChange={onChange}
              placeholder="Buscar IMEI, ICCID ou Serial..."
            />
          </div>
          <Button
            variant="outline"
            className="h-9 text-[11px] font-bold uppercase"
            onClick={onTrocarAparelho}
          >
            Trocar Aparelho
          </Button>
        </div>
        {aparelhoSelecionado && (
          <div className="grid grid-cols-3 gap-6 bg-erp-blue/5 p-4 rounded border border-erp-blue/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-erp-blue uppercase">Modelo</span>
              <span className="text-sm font-bold text-slate-700">
                {[aparelhoSelecionado.marca, aparelhoSelecionado.modelo].filter(Boolean).join(' ') || '—'}
              </span>
            </div>
            <div className="flex flex-col border-l border-erp-blue/20 pl-6">
              <span className="text-[10px] font-bold text-erp-blue uppercase">Operadora / Marca / ICCID</span>
              <span className="text-sm font-medium text-slate-700 truncate" title={operadoraMarcaIccid(aparelhoSelecionado)}>
                {operadoraMarcaIccid(aparelhoSelecionado)}
              </span>
            </div>
            <div className="flex flex-col border-l border-erp-blue/20 pl-6">
              <span className="text-[10px] font-bold text-erp-blue uppercase">Status</span>
              <span
                className={
                  statusConfig
                    ? `text-sm font-bold ${statusConfig.color}`
                    : 'text-sm font-medium text-slate-700'
                }
              >
                {statusConfig?.label ?? aparelhoSelecionado.status ?? '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
