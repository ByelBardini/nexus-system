import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TesteFilaCard } from './TesteFilaCard'
import type { OsTeste } from './testes-types'

interface TesteFilaSidebarProps {
  items: OsTeste[]
  selectedId: number | null
  search: string
  onSearchChange: (v: string) => void
  onSelect: (id: number) => void
}

function filterItems(items: OsTeste[], search: string): OsTeste[] {
  if (!search.trim()) return items
  const term = search.toLowerCase().trim()
  return items.filter(
    (i) =>
      String(i.numero).includes(term) ||
      (i.veiculo?.placa ?? '').toLowerCase().includes(term) ||
      (i.cliente?.nome ?? '').toLowerCase().includes(term) ||
      (i.subcliente?.nome ?? '').toLowerCase().includes(term) ||
      (i.idAparelho?.toLowerCase().includes(term) ?? false)
  )
}

export function TesteFilaSidebar({
  items,
  selectedId,
  search,
  onSearchChange,
  onSelect,
}: TesteFilaSidebarProps) {
  const filtered = filterItems(items, search)

  return (
    <aside className="w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Fila de Testes
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-8 h-9 text-[11px]"
            placeholder="Buscar OS, placa..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-slate-500">
            {search.trim() ? (
              <>Nenhum resultado para a busca. Limpe o filtro para ver todos os itens em testes.</>
            ) : (
              <>Nenhum item na fila</>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <TesteFilaCard
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onClick={() => onSelect(item.id)}
            />
          ))
        )}
      </div>
    </aside>
  )
}
