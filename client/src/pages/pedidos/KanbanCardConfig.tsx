import { cn } from '@/lib/utils'
import type { PedidoRastreadorView } from './types'

export function KanbanCardConfig({
  pedido,
  progress,
  isActive,
  onClick,
}: {
  pedido: PedidoRastreadorView
  progress: number
  isActive: boolean
  onClick: () => void
}) {
  const total = pedido.quantidade

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'bg-white border p-4 mb-3 rounded shadow-sm transition-all cursor-pointer',
        'hover:ring-2 hover:ring-erp-blue/30',
        isActive ? 'ring-2 ring-erp-blue border-blue-200 bg-blue-50/30' : 'border-slate-200'
      )}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <span className="text-[10px] font-bold text-erp-blue bg-blue-50 px-1.5 py-0.5 rounded">
          {pedido.codigo}
        </span>
        {pedido.urgencia && (
          <span
            className={cn(
              'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0',
              pedido.urgencia === 'Urgente'
                ? 'bg-red-100 text-red-700'
                : pedido.urgencia === 'Alta'
                  ? 'bg-amber-100 text-amber-700'
                  : pedido.urgencia === 'Média'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-slate-50 text-slate-500'
            )}
          >
            {pedido.urgencia}
          </span>
        )}
      </div>
      <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight">
        {pedido.destinatario}
      </h3>
      <div className="text-[11px] text-slate-500 mb-3 space-y-0.5">
        <span>{pedido.tipo === 'tecnico' ? 'Técnico' : pedido.tipo === 'misto' ? 'Misto' : 'Cliente'}</span>
        {pedido.cidadeEstado && (
          <span className="block text-slate-400">{pedido.cidadeEstado}</span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-slate-600">
          <span>Progresso de Montagem</span>
          <span className={progress > 0 ? 'text-erp-blue' : ''}>
            {String(progress).padStart(2,'0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-erp-blue rounded-full transition-all"
            style={{ width: total ? `${(progress / total) * 100}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  )
}
