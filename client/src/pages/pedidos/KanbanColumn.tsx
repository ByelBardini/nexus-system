import { cn } from '@/lib/utils'
import type { PedidoRastreadorView, StatusPedidoKey } from './types'
import { STATUS_CONFIG } from './types'
import { KanbanCard } from './KanbanCard'

export function KanbanColumn({
  status,
  pedidos,
  onCardClick,
}: {
  status: StatusPedidoKey
  pedidos: PedidoRastreadorView[]
  onCardClick: (p: PedidoRastreadorView) => void
}) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex-1 min-w-[280px] flex flex-col h-full bg-slate-200/80 rounded border border-slate-200 p-3">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div
          className={cn('w-2.5 h-2.5 rounded-full', config.dotColor)}
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {config.label}
        </span>
        <span className="ml-auto text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
          {pedidos.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {pedidos.length === 0 ? (
          <div className="flex-1 border-2 border-dashed border-slate-300 rounded m-2 flex flex-col items-center justify-center text-slate-400 italic text-[11px] py-8">
            Nenhum pedido nesta etapa
          </div>
        ) : (
          pedidos.map((p) => (
            <KanbanCard key={p.id} pedido={p} onClick={() => onCardClick(p)} />
          ))
        )}
      </div>
    </div>
  )
}
