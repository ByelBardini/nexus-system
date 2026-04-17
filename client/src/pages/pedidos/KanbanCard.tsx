import { MaterialIcon } from '@/components/MaterialIcon'
import { formatarDataCurta, formatarDuracao, formatarFromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PedidoRastreadorView } from './types'
import { URGENCIA_STYLE } from './types'

export function KanbanCard({
  pedido,
  onClick,
}: {
  pedido: PedidoRastreadorView
  onClick: () => void
}) {
  const tipoLabel = pedido.tipo === 'cliente' ? 'Cliente' : 'Técnico'
  const tipoIcon = pedido.tipo === 'cliente' ? 'business' : 'engineering'
  const isEntregue = pedido.status === 'entregue'
  const urgencia = pedido.urgencia ?? 'Média'
  const urgenciaStyle = URGENCIA_STYLE[urgencia] ?? URGENCIA_STYLE['Média']

  const solicitadoEm = pedido.solicitadoEm
  const entregueEm = pedido.entregueEm
  const duracao =
    isEntregue && solicitadoEm && entregueEm
      ? formatarDuracao(solicitadoEm, entregueEm)
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'relative bg-white border border-slate-200 p-4 mb-3 rounded shadow-sm transition-shadow cursor-pointer',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-erp-blue/30',
        'border-l-4',
        urgenciaStyle.bar,
        isEntregue && 'opacity-75'
      )}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
              isEntregue ? 'text-slate-400 bg-slate-100' : 'text-blue-600 bg-blue-50'
            )}
          >
            {pedido.codigo}
          </span>
          {(urgencia === 'Alta' || urgencia === 'Urgente') && (
            <span
              className={cn(
                'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0',
                urgenciaStyle.badge
              )}
            >
              {urgencia}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">
          {isEntregue
            ? entregueEm
              ? formatarDataCurta(entregueEm)
              : solicitadoEm
                ? formatarDataCurta(solicitadoEm)
                : '-'
            : solicitadoEm
              ? formatarFromNow(solicitadoEm)
              : '-'}
        </span>
      </div>
      <h3
        className={cn(
          'text-sm font-bold mb-1 leading-tight',
          isEntregue ? 'text-slate-500' : 'text-slate-800'
        )}
      >
        {pedido.destinatario}
      </h3>
      <div
        className={cn(
          'text-[11px] mb-2 flex items-center gap-1.5 flex-wrap',
          isEntregue ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        <span className="flex items-center gap-1">
          <MaterialIcon name={tipoIcon} className="text-sm" />
          {tipoLabel}
        </span>
        {pedido.tipo === 'misto' && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
            Misto
          </span>
        )}
      </div>
      {pedido.tipo === 'misto' && pedido.itensMisto && pedido.itensMisto.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {pedido.itensMisto.map((item, i) => (
            <span
              key={i}
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded border',
                item.label === 'Infinity'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              )}
            >
              {item.label} · {item.quantidade}
            </span>
          ))}
        </div>
      )}
      {pedido.endereco && (
        <p
          className={cn(
            'text-[10px] mb-3 flex items-start gap-1 text-slate-500',
            isEntregue && 'text-slate-400'
          )}
        >
          <MaterialIcon name="location_on" className="text-xs shrink-0 mt-0.5" />
          <span className="line-clamp-2">{pedido.endereco}</span>
        </p>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5">
          <MaterialIcon
            name="inventory_2"
            className={cn('text-sm', isEntregue ? 'text-slate-300' : 'text-slate-400')}
          />
          <span
            className={cn(
              'text-xs font-semibold',
              isEntregue ? 'text-slate-400' : 'text-slate-700'
            )}
          >
            {pedido.quantidade} un
          </span>
        </div>
        <div
          className={cn(
            'flex flex-col items-end gap-0.5 text-[10px] font-medium text-right',
            isEntregue ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {isEntregue ? (
            <>
              <span className="flex items-center gap-1">
                <MaterialIcon name="check_circle" className="text-sm" />
                Entregue
              </span>
              {duracao && (
                <span className="text-[9px] text-slate-400">
                  Levou {duracao}
                </span>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
