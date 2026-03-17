import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import {
  mapPedidoToView,
  STATUS_ORDER,
  type PedidoRastreadorView,
  type PedidoRastreadorApi,
  type StatusPedidoKey,
} from './types'
import type { KitVinculado, KitDetalhe, TipoDespacho } from './pedidos-config-types'
import { SidePanel } from './SidePanel'
import { KanbanColumnConfig } from './KanbanColumnConfig'

const STORAGE_KEY = 'nexus-pedidos-config-workspace'

interface WorkspacePersisted {
  kitsPorPedido: Record<string, KitVinculado[]>
  tipoDespachoPorPedido: Record<string, TipoDespacho>
  transportadoraPorPedido: Record<string, string>
  numeroNfPorPedido: Record<string, string>
}

function loadWorkspaceFromStorage(): WorkspacePersisted {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { kitsPorPedido: {}, tipoDespachoPorPedido: {}, transportadoraPorPedido: {}, numeroNfPorPedido: {} }
    const parsed = JSON.parse(raw) as WorkspacePersisted
    return {
      kitsPorPedido: parsed.kitsPorPedido ?? {},
      tipoDespachoPorPedido: parsed.tipoDespachoPorPedido ?? {},
      transportadoraPorPedido: parsed.transportadoraPorPedido ?? {},
      numeroNfPorPedido: parsed.numeroNfPorPedido ?? {},
    }
  } catch {
    return { kitsPorPedido: {}, tipoDespachoPorPedido: {}, transportadoraPorPedido: {}, numeroNfPorPedido: {} }
  }
}

function parseKitsFromStorage(raw: Record<string, KitVinculado[]>): Record<number, KitVinculado[]> {
  const out: Record<number, KitVinculado[]> = {}
  Object.entries(raw).forEach(([k, v]) => {
    if (Array.isArray(v) && v.every((x) => x && typeof x.id === 'number' && typeof x.nome === 'string' && typeof x.quantidade === 'number')) {
      out[Number(k)] = v
    }
  })
  return out
}

export function PedidosConfigPage() {
  const [busca, setBusca] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoRastreadorView | null>(null)
  const [pedidoApiSelecionado, setPedidoApiSelecionado] = useState<PedidoRastreadorApi | null>(null)
  const [kitsPorPedido, setKitsPorPedido] = useState<Record<number, KitVinculado[]>>(() => {
    const s = loadWorkspaceFromStorage()
    return parseKitsFromStorage(s.kitsPorPedido)
  })
  const [tipoDespachoPorPedido, setTipoDespachoPorPedido] = useState<Record<number, TipoDespacho>>(() => {
    const s = loadWorkspaceFromStorage()
    const out: Record<number, TipoDespacho> = {}
    Object.entries(s.tipoDespachoPorPedido ?? {}).forEach(([k, v]) => {
      if (v === 'TRANSPORTADORA' || v === 'CORREIOS' || v === 'EM_MAOS') out[Number(k)] = v
    })
    return out
  })
  const [transportadoraPorPedido, setTransportadoraPorPedido] = useState<Record<number, string>>(() => {
    const s = loadWorkspaceFromStorage()
    const out: Record<number, string> = {}
    Object.entries(s.transportadoraPorPedido ?? {}).forEach(([k, v]) => {
      if (typeof v === 'string') out[Number(k)] = v
    })
    return out
  })
  const [numeroNfPorPedido, setNumeroNfPorPedido] = useState<Record<number, string>>(() => {
    const s = loadWorkspaceFromStorage()
    const out: Record<number, string> = {}
    Object.entries(s.numeroNfPorPedido ?? {}).forEach(([k, v]) => {
      if (typeof v === 'string') out[Number(k)] = v
    })
    return out
  })
  useEffect(() => {
    const raw: WorkspacePersisted = {
      kitsPorPedido: Object.fromEntries(
        Object.entries(kitsPorPedido).map(([k, v]) => [k, v])
      ),
      tipoDespachoPorPedido: Object.fromEntries(
        Object.entries(tipoDespachoPorPedido).map(([k, v]) => [k, v])
      ),
      transportadoraPorPedido: Object.fromEntries(
        Object.entries(transportadoraPorPedido).map(([k, v]) => [String(k), v])
      ),
      numeroNfPorPedido: Object.fromEntries(
        Object.entries(numeroNfPorPedido).map(([k, v]) => [String(k), v])
      ),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(raw))
  }, [kitsPorPedido, tipoDespachoPorPedido, transportadoraPorPedido, numeroNfPorPedido])

  const { data: lista, isLoading } = useQuery({
    queryKey: ['pedidos-rastreadores', 'config', busca],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (busca.trim()) params.set('search', busca.trim())
      return api<{ data: PedidoRastreadorApi[] }>(`/pedidos-rastreadores?${params}`)
    },
  })

  const { data: kitsDetalhes = [] } = useQuery<KitDetalhe[]>({
    queryKey: ['aparelhos', 'pareamento', 'kits', 'detalhes'],
    queryFn: () => api('/aparelhos/pareamento/kits/detalhes'),
    enabled: panelOpen && (pedidoApiSelecionado?.kitIds?.length ?? 0) > 0,
  })

  useEffect(() => {
    if (!panelOpen || !pedidoApiSelecionado) return
    const ids = pedidoApiSelecionado.kitIds
    if (!ids || !Array.isArray(ids) || ids.length === 0) return
    if (kitsDetalhes.length === 0) return
    const current = kitsPorPedido[pedidoApiSelecionado.id]
    if (current && current.length > 0) return
    const mapById = new Map(kitsDetalhes.map((k) => [k.id, k]))
    const kits: KitVinculado[] = ids.map((id) => {
      const d = mapById.get(id)
      return { id, nome: d?.nome ?? `Kit #${id}`, quantidade: d?.quantidade ?? 1 }
    })
    if (kits.length > 0) {
      setKitsPorPedido((prev) => ({ ...prev, [pedidoApiSelecionado.id]: kits }))
    }
  }, [panelOpen, pedidoApiSelecionado, kitsDetalhes, kitsPorPedido])

  const pedidosView = useMemo(() => {
    const arr = lista?.data ?? []
    return arr.map(mapPedidoToView)
  }, [lista?.data])

  const progressPorPedido = useMemo(() => {
    const map: Record<number, number> = {}
    Object.entries(kitsPorPedido).forEach(([pedidoId, kits]) => {
      map[Number(pedidoId)] = kits.reduce((s, k) => s + k.quantidade, 0)
    })
    return map
  }, [kitsPorPedido])

  const pedidosPorStatus = useMemo(() => {
    const porStatus: Record<StatusPedidoKey, PedidoRastreadorView[]> = {
      solicitado: [],
      em_configuracao: [],
      configurado: [],
      despachado: [],
      entregue: [],
    }
    pedidosView.forEach((p) => porStatus[p.status].push(p))
    return porStatus
  }, [pedidosView])

  function handleCardClick(pedido: PedidoRastreadorView) {
    const raw = lista?.data?.find((p: PedidoRastreadorApi) => p.id === pedido.id)
    setPedidoSelecionado(pedido)
    setPedidoApiSelecionado(raw ?? null)
    setPanelOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] min-h-0">
      <div className="flex items-center justify-between gap-4 shrink-0 pb-4">
        <div className="relative flex-1 max-w-xs">
          <MaterialIcon
            name="search"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <Input
            className="pl-8 text-[11px]"
            placeholder="Buscar por PED, Técnico ou IMEI..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-auto bg-slate-100 p-4 flex-1 min-h-0">
          <div className="flex gap-4 min-w-max min-h-[420px]">
            {STATUS_ORDER.map((status) => (
              <KanbanColumnConfig
                key={status}
                status={status}
                pedidos={pedidosPorStatus[status]}
                progressPorPedido={progressPorPedido}
                activeId={pedidoSelecionado?.id ?? null}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </div>
      </div>

      <SidePanel
        pedido={pedidoSelecionado}
        pedidoApi={pedidoApiSelecionado as PedidoRastreadorApi | null}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onStatusUpdated={() => { }}
        kitsVinculados={pedidoSelecionado ? (kitsPorPedido[pedidoSelecionado.id] ?? []) : []}
        kitsPorPedido={kitsPorPedido}
        onKitsChange={(kits) => {
          if (pedidoSelecionado) {
            setKitsPorPedido((prev) => ({ ...prev, [pedidoSelecionado.id]: kits }))
          }
        }}
        tipoDespacho={
          pedidoSelecionado
            ? (tipoDespachoPorPedido[pedidoSelecionado.id] ?? 'TRANSPORTADORA')
            : 'TRANSPORTADORA'
        }
        onTipoDespachoChange={(tipo) => {
          if (pedidoSelecionado) {
            setTipoDespachoPorPedido((prev) => ({ ...prev, [pedidoSelecionado.id]: tipo }))
          }
        }}
        transportadora={pedidoSelecionado ? (transportadoraPorPedido[pedidoSelecionado.id] ?? '') : ''}
        numeroNf={pedidoSelecionado ? (numeroNfPorPedido[pedidoSelecionado.id] ?? '') : ''}
        onTransportadoraChange={(valor) => {
          if (pedidoSelecionado) {
            setTransportadoraPorPedido((prev) => ({ ...prev, [pedidoSelecionado.id]: valor }))
          }
        }}
        onNumeroNfChange={(valor) => {
          if (pedidoSelecionado) {
            setNumeroNfPorPedido((prev) => ({ ...prev, [pedidoSelecionado.id]: valor }))
          }
        }}
      />
    </div>
  )
}
