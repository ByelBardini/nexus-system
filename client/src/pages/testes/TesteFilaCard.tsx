import { cn } from '@/lib/utils'
import { formatarTempoMinutos } from '@/lib/format'
import type { OsTeste } from './testes-types'

interface TesteFilaCardProps {
  item: OsTeste
  isSelected: boolean
  onClick: () => void
}

export function TesteFilaCard({ item, isSelected, onClick }: TesteFilaCardProps) {
  const subclienteNome = item.subcliente?.nome ?? item.subclienteSnapshotNome ?? '—'
  const placa = item.veiculo?.placa ?? '—'
  const showTempoElevado = item.tempoEmTestesMin > 30

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full p-3 border-b border-slate-100 text-left transition-colors cursor-pointer',
        isSelected && 'border-l-4 border-erp-blue bg-erp-blue/5',
        !isSelected && 'hover:bg-slate-50'
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={cn(
            'text-sm font-bold',
            isSelected ? 'text-erp-blue' : 'text-slate-700'
          )}
        >
          OS #{item.numero}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'text-xs font-medium',
              showTempoElevado ? 'text-red-600' : 'text-slate-500'
            )}
          >
            {formatarTempoMinutos(item.tempoEmTestesMin)}
          </span>
          {showTempoElevado && (
            <span className="size-2 rounded-full bg-red-500" aria-hidden />
          )}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-800 truncate">{item.cliente.nome}</p>
      <p className="text-xs text-slate-500">
        {subclienteNome} • <span className="text-slate-900 font-medium">{placa}</span>
      </p>
      <div className="mt-2 flex justify-between items-end">
        <span className="text-xs text-slate-400 truncate mr-2">
          {item.tecnico?.nome ?? '—'}
        </span>
        <span className="text-xs font-medium text-slate-600 shrink-0">
          IMEI: {item.idAparelho ?? '--'}
        </span>
      </div>
    </button>
  )
}
