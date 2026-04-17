import { cn } from '@/lib/utils'
import type { PedidoRastreadorView, StatusPedidoKey } from './types'
import { STATUS_CONFIG } from './types'
import { KanbanCardConfig } from './KanbanCardConfig'

export function KanbanColumnConfig({
  status,
  pedidos,
  progressPorPedido,
  activeId,
  onCardClick,
}: {
  status: StatusPedidoKey
  pedidos: PedidoRastreadorView[]
  progressPorPedido: Record<number, number>
  activeId: number | null
  onCardClick: (p: PedidoRastreadorView) => void
}) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="w-[300px] shrink-0 flex flex-col h-full bg-slate-200/50 rounded-sm p-3">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className={cn('w-2.5 h-2.5 rounded-full', config.dotColor)} />
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
            {status === 'configurado' ? 'Aguardando finalização' : 'Nenhum pedido'}
          </div>
        ) : (
          pedidos.map((p) => (
            <KanbanCardConfig
              key={p.id}
              pedido={p}
              progress={progressPorPedido[p.id] ?? 0}
              isActive={activeId === p.id}
              onClick={() => onCardClick(p)}
            />
          ))
        )}
      </div>
    </div>
  )
}
