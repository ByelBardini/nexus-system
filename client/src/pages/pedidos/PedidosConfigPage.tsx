import { useState, useMemo, useEffect, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatarDataCurta } from '@/lib/format'
import {
  mapPedidoToView,
  type PedidoRastreadorView,
  type PedidoRastreadorApi,
  type StatusPedidoKey,
} from './types'

export type StatusPedidoRastreador =
  | 'SOLICITADO'
  | 'EM_CONFIGURACAO'
  | 'CONFIGURADO'
  | 'DESPACHADO'
  | 'ENTREGUE'

const STATUS_TO_API: Record<StatusPedidoKey, StatusPedidoRastreador> = {
  solicitado: 'SOLICITADO',
  em_configuracao: 'EM_CONFIGURACAO',
  configurado: 'CONFIGURADO',
  despachado: 'DESPACHADO',
  entregue: 'ENTREGUE',
}

const STATUS_CONFIG: Record<
  StatusPedidoKey,
  { label: string; dotColor: string }
> = {
  solicitado: { label: 'Solicitado', dotColor: 'bg-amber-400' },
  em_configuracao: { label: 'Em Configuração', dotColor: 'bg-blue-500' },
  configurado: { label: 'Configurado', dotColor: 'bg-purple-500' },
  despachado: { label: 'Despachado', dotColor: 'bg-orange-500' },
  entregue: { label: 'Entregue', dotColor: 'bg-emerald-500' },
}

const STATUS_ORDER: StatusPedidoKey[] = [
  'solicitado',
  'em_configuracao',
  'configurado',
  'despachado',
  'entregue',
]

const STORAGE_KEY = 'nexus-pedidos-config-workspace'

type TipoDespacho = 'TRANSPORTADORA' | 'CORREIOS' | 'EM_MAOS'

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

interface KitResumo {
  id: number
  nome: string
}

interface KitDetalhe {
  id: number
  nome: string
  criadoEm: string
  quantidade: number
  modelosOperadoras: string
}

interface AparelhoNoKit {
  id: number
  identificador: string | null
  marca: string | null
  modelo: string | null
  operadora: string | null
  status: string
  proprietario?: string
  simVinculado?: { identificador: string | null; operadora: string | null } | null
  cliente?: { id: number; nome: string } | null
  tecnico?: { id: number; nome: string } | null
  kit?: { id: number; nome: string } | null
  kitId?: number | null
}

interface KitComAparelhos {
  id: number
  nome: string
  criadoEm: string
  aparelhos: AparelhoNoKit[]
}

interface KitVinculado {
  id: number
  nome: string
  quantidade: number
}

function KanbanCard({
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
        <span>{pedido.tipo === 'tecnico' ? 'Técnico' : 'Cliente'}</span>
        {pedido.cidadeEstado && (
          <span className="block text-slate-400">{pedido.cidadeEstado}</span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-slate-600">
          <span>Progresso de Montagem</span>
          <span className={progress > 0 ? 'text-erp-blue' : ''}>
            {progress} / {String(total).padStart(2, '0')}
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

function KanbanColumn({
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
            <KanbanCard
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

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ModalSelecaoEKit({
  open,
  onOpenChange,
  pedido,
  onVincular,
  kitParaEditar,
  kitsPorPedido,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  pedido: PedidoRastreadorView | null
  onVincular: (kit: KitResumo, qtd: number) => void
  kitParaEditar?: { id: number; nome: string } | null
  kitsPorPedido?: Record<number, KitVinculado[]>
}) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<'selecao' | 'edicao'>('selecao')
  const [kitSelecionado, setKitSelecionado] = useState<KitComAparelhos | null>(null)
  const [filtroBusca, setFiltroBusca] = useState('')
  const [showCriarNovo, setShowCriarNovo] = useState(false)
  const [nomeNovoKit, setNomeNovoKit] = useState('')
  const [aparelhosSelecionados, setAparelhosSelecionados] = useState<Set<number>>(new Set())
  const [buscaAparelho, setBuscaAparelho] = useState('')
  const [filtroMarcaModelo, setFiltroMarcaModelo] = useState('')
  const [filtroOperadora, setFiltroOperadora] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')

  useEffect(() => {
    if (open && kitParaEditar) {
      setStep('edicao')
      setKitSelecionado({
        id: kitParaEditar.id,
        nome: kitParaEditar.nome,
        criadoEm: '',
        aparelhos: [],
      })
    }
  }, [open, kitParaEditar])

  const { data: kitsDetalhes = [], isLoading: loadingKits } = useQuery<KitDetalhe[]>({
    queryKey: ['aparelhos', 'pareamento', 'kits', 'detalhes'],
    queryFn: () => api('/aparelhos/pareamento/kits/detalhes'),
    enabled: open && step === 'selecao',
  })

  const { data: kitComAparelhos, refetch: refetchKit } = useQuery<KitComAparelhos>({
    queryKey: ['kit', kitSelecionado?.id],
    queryFn: () => api(`/aparelhos/pareamento/kits/${kitSelecionado!.id}`),
    enabled: open && step === 'edicao' && kitSelecionado != null,
  })

  const { data: aparelhosDisponiveis = [] } = useQuery<AparelhoNoKit[]>({
    queryKey: ['aparelhos', 'disponiveis', kitSelecionado?.id],
    queryFn: () => api('/aparelhos/pareamento/aparelhos-disponiveis'),
    enabled: open && step === 'edicao' && kitSelecionado != null,
  })

  const createMutation = useMutation({
    mutationFn: (nome: string) =>
      api<KitResumo>('/aparelhos/pareamento/kits', {
        method: 'POST',
        body: JSON.stringify({ nome: nome.trim() }),
      }),
    onSuccess: (data) => {
      toast.success('Kit criado')
      queryClient.invalidateQueries({ queryKey: ['aparelhos', 'pareamento', 'kits'] })
      setKitSelecionado({ id: data.id, nome: data.nome, criadoEm: new Date().toISOString(), aparelhos: [] })
      setShowCriarNovo(false)
      setNomeNovoKit('')
      setStep('edicao')
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Erro ao criar kit'),
  })

  const updateKitMutation = useMutation({
    mutationFn: ({ aparelhoId, kitId }: { aparelhoId: number; kitId: number | null }) =>
      api(`/aparelhos/pareamento/aparelho/${aparelhoId}/kit`, {
        method: 'PATCH',
        body: JSON.stringify({ kitId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kit', kitSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['aparelhos', 'pareamento', 'kits'] })
      queryClient.invalidateQueries({ queryKey: ['aparelhos', 'disponiveis'] })
      refetchKit()
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar'),
  })

  const kitIdsEmOutrosPedidos = useMemo(() => {
    if (!pedido?.id || !kitsPorPedido) return new Set<number>()
    const ids = new Set<number>()
    Object.entries(kitsPorPedido).forEach(([pedidoIdStr, kits]) => {
      if (Number(pedidoIdStr) !== pedido.id) {
        kits.forEach((k) => ids.add(k.id))
      }
    })
    return ids
  }, [pedido?.id, kitsPorPedido])

  const kitsDisponiveis = useMemo(() => {
    return kitsDetalhes.filter((k) => !kitIdsEmOutrosPedidos.has(k.id))
  }, [kitsDetalhes, kitIdsEmOutrosPedidos])

  const kitsFiltrados = useMemo(() => {
    if (!filtroBusca.trim()) return kitsDisponiveis
    const s = filtroBusca.toLowerCase()
    return kitsDisponiveis.filter(
      (k) =>
        k.nome.toLowerCase().includes(s) ||
        k.modelosOperadoras.toLowerCase().includes(s)
    )
  }, [kitsDisponiveis, filtroBusca])

  const aparelhosParaAdicionar = useMemo(() => {
    const noKit = kitComAparelhos?.aparelhos ?? []
    const idsNoKit = new Set(noKit.map((a) => a.id))
    return aparelhosDisponiveis.filter((a) => !idsNoKit.has(a.id))
  }, [aparelhosDisponiveis, kitComAparelhos?.aparelhos])

  const opcoesMarcaModelo = useMemo(() => {
    const set = new Set<string>()
    aparelhosParaAdicionar.forEach((a) => {
      const mm = [a.marca, a.modelo].filter(Boolean).join(' / ')
      if (mm) set.add(mm)
    })
    return Array.from(set).sort()
  }, [aparelhosParaAdicionar])

  const opcoesOperadora = useMemo(() => {
    const set = new Set<string>()
    aparelhosParaAdicionar.forEach((a) => {
      const op = a.operadora ?? a.simVinculado?.operadora
      if (op) set.add(op)
    })
    return Array.from(set).sort()
  }, [aparelhosParaAdicionar])

  const opcoesCliente = useMemo(() => {
    const set = new Set<string>()
    aparelhosParaAdicionar.forEach((a) => {
      const c =
        a.cliente?.nome ??
        a.tecnico?.nome ??
        (a.proprietario === 'INFINITY' ? 'Infinity' : null)
      if (c) set.add(c)
    })
    return Array.from(set).sort()
  }, [aparelhosParaAdicionar])

  const aparelhosFiltrados = useMemo(() => {
    return aparelhosParaAdicionar.filter((a) => {
      if (buscaAparelho.trim()) {
        const s = buscaAparelho.toLowerCase()
        if (
          !(a.identificador?.toLowerCase().includes(s) ?? false) &&
          !(a.marca?.toLowerCase().includes(s) ?? false) &&
          !(a.modelo?.toLowerCase().includes(s) ?? false)
        )
          return false
      }
      const mm = [a.marca, a.modelo].filter(Boolean).join(' / ')
      if (filtroMarcaModelo && mm !== filtroMarcaModelo) return false
      const op = a.operadora ?? a.simVinculado?.operadora
      if (filtroOperadora && op !== filtroOperadora) return false
      const clienteLabel =
        a.cliente?.nome ?? a.tecnico?.nome ?? (a.proprietario === 'INFINITY' ? 'Infinity' : '')
      if (filtroCliente && clienteLabel !== filtroCliente) return false
      return true
    })
  }, [aparelhosParaAdicionar, buscaAparelho, filtroMarcaModelo, filtroOperadora, filtroCliente])

  function getClienteLabel(a: AparelhoNoKit): string {
    return (
      a.cliente?.nome ??
      a.tecnico?.nome ??
      (a.proprietario === 'INFINITY' ? 'Infinity' : '-')
    )
  }

  function handleEscolherKit(kit: KitDetalhe) {
    setKitSelecionado({
      id: kit.id,
      nome: kit.nome,
      criadoEm: kit.criadoEm,
      aparelhos: [],
    })
    setStep('edicao')
  }

  function handleCriarNovo() {
    if (!nomeNovoKit.trim()) return
    createMutation.mutate(nomeNovoKit.trim())
  }

  function handleVoltar() {
    setStep('selecao')
    setKitSelecionado(null)
    setAparelhosSelecionados(new Set())
  }

  function handleRemoverAparelho(aparelhoId: number) {
    if (!kitSelecionado) return
    updateKitMutation.mutate({ aparelhoId, kitId: null })
  }

  function handleAdicionarSelecionados() {
    if (!kitSelecionado) return
    aparelhosSelecionados.forEach((apId) => {
      updateKitMutation.mutate({ aparelhoId: apId, kitId: kitSelecionado.id })
    })
    setAparelhosSelecionados(new Set())
  }

  function handleSalvarEVincular() {
    if (!kitSelecionado) return
    const qtd = (kitComAparelhos?.aparelhos?.length ?? 0) || 1
    onVincular({ id: kitSelecionado.id, nome: kitSelecionado.nome }, qtd)
    toast.success(`Kit ${kitSelecionado.nome} vinculado`)
    onOpenChange(false)
    handleVoltar()
  }

  function handleClose() {
    onOpenChange(false)
    setStep('selecao')
    setKitSelecionado(null)
    setShowCriarNovo(false)
    setNomeNovoKit('')
    setAparelhosSelecionados(new Set())
    setBuscaAparelho('')
    setFiltroMarcaModelo('')
    setFiltroOperadora('')
    setFiltroCliente('')
  }

  const aparelhosNoKit = kitComAparelhos?.aparelhos ?? []
  const progressQtd = aparelhosNoKit.length
  const qtdEsperada = pedido?.quantidade ?? 1

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        hideClose
        className={cn(
          'max-w-[800px] max-h-[90vh] p-0 flex flex-col overflow-hidden',
          step === 'edicao' && 'max-w-[850px]'
        )}
      >
        {step === 'selecao' ? (
          <>
            <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <MaterialIcon name="hub" className="text-blue-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                    Seleção de Kit
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Selecione ou crie um novo kit para configuração
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowCriarNovo(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase"
                >
                  <MaterialIcon name="add_box" className="text-lg" />
                  Criar Novo Kit
                </Button>
              </div>
            </header>
            {showCriarNovo && (
              <div className="px-6 py-3 bg-slate-50 border-b flex gap-2 items-center">
                <Input
                  value={nomeNovoKit}
                  onChange={(e) => setNomeNovoKit(e.target.value)}
                  placeholder="Nome do novo kit (ex: KIT-015)"
                  className="text-sm flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCriarNovo()}
                />
                <Button
                  size="sm"
                  onClick={() => handleCriarNovo()}
                  disabled={!nomeNovoKit.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowCriarNovo(false); setNomeNovoKit('') }}>
                  Cancelar
                </Button>
              </div>
            )}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <MaterialIcon
                  name="search"
                  className="absolute left-2.5 top-2 text-slate-400 text-sm"
                />
                <Input
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  placeholder="Filtrar por nome ou modelos/operadoras..."
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[200px]">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                      Data de Criação
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                      Modelos / Operadoras
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingKits ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                      </td>
                    </tr>
                  ) : kitsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Nenhum kit encontrado.
                      </td>
                    </tr>
                  ) : (
                    kitsFiltrados.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-900">{k.nome}</td>
                        <td className="px-4 py-3 text-slate-500">{formatarDataHora(k.criadoEm)}</td>
                        <td className="px-4 py-3">{k.quantidade}</td>
                        <td className="px-4 py-3 text-slate-600">{k.modelosOperadoras}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold"
                            onClick={() => handleEscolherKit(k)}
                          >
                            Escolher <MaterialIcon name="chevron_right" className="text-sm" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
              <span className="text-[11px] text-slate-500 uppercase">
                Exibindo <span className="font-bold text-slate-700">{kitsFiltrados.length} kits</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <MaterialIcon name="inventory" className="text-blue-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                    Editar Kit — {kitSelecionado?.nome}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Gestão de Configuração Industrial
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleVoltar}>
                <MaterialIcon name="arrow_back" /> Voltar
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {pedido && (
                <section>
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest border-l-4 border-erp-blue pl-2 mb-4">
                    Informações do Kit
                  </h3>
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pedido</Label>
                      <div className="text-xs font-bold text-slate-700">{pedido.codigo}</div>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Destino</Label>
                      <div className="text-xs font-bold text-slate-700">{pedido.destinatario}</div>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantidade Esperada</Label>
                      <div className="text-xs font-bold text-erp-blue bg-blue-50 inline-block px-2 py-0.5 rounded">
                        {qtdEsperada} Unidades
                      </div>
                    </div>
                  </div>
                </section>
              )}
              <section>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-2">
                    Rastreadores no Kit
                  </h3>
                  <div className="text-right w-48">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      <span>Progresso</span>
                      <span>{progressQtd} / {qtdEsperada} Equipamentos</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(100, (progressQtd / qtdEsperada) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">IMEI</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">ICCID</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">Marca / Modelo</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">Kit</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-left">Cliente</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aparelhosNoKit.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-slate-500 text-[11px]">
                            Nenhum rastreador no kit.
                          </td>
                        </tr>
                      ) : (
                        aparelhosNoKit.map((a) => (
                          <tr key={a.id} className="border-b border-slate-100">
                            <td className="px-3 py-2 font-bold">{a.identificador ?? '-'}</td>
                            <td className="px-3 py-2">{a.simVinculado?.identificador ?? '-'}</td>
                            <td className="px-3 py-2">{[a.marca, a.modelo].filter(Boolean).join(' / ') || '-'}</td>
                            <td className="px-3 py-2">
                              <span className="text-[11px] font-bold text-violet-600">
                                {a.kit?.nome ?? kitComAparelhos?.nome ?? '-'}
                              </span>
                            </td>
                            <td className="px-3 py-2">{getClienteLabel(a)}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoverAparelho(a.id)}
                                className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="bg-slate-50 p-5 rounded-lg border border-slate-200 border-dashed">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <MaterialIcon name="search" className="text-sm" />
                    Selecionar Novos Rastreadores
                  </h3>
                  <Button
                    size="sm"
                    onClick={handleAdicionarSelecionados}
                    disabled={aparelhosSelecionados.size === 0}
                  >
                    <MaterialIcon name="add" className="text-sm" /> Adicionar ao Kit
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Buscar por ID ou IMEI</Label>
                    <div className="relative">
                      <MaterialIcon name="search" className="absolute left-2 top-2 text-slate-400 text-sm" />
                      <Input
                        value={buscaAparelho}
                        onChange={(e) => setBuscaAparelho(e.target.value)}
                        placeholder="Digite o identificador..."
                        className="pl-8 h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Marca/Modelo</Label>
                    <select
                      value={filtroMarcaModelo}
                      onChange={(e) => setFiltroMarcaModelo(e.target.value)}
                      className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2"
                    >
                      <option value="">Todos</option>
                      {opcoesMarcaModelo.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Operadora</Label>
                    <select
                      value={filtroOperadora}
                      onChange={(e) => setFiltroOperadora(e.target.value)}
                      className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2"
                    >
                      <option value="">Todas</option>
                      {opcoesOperadora.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cliente</Label>
                    <select
                      value={filtroCliente}
                      onChange={(e) => setFiltroCliente(e.target.value)}
                      className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2"
                    >
                      <option value="">Todos</option>
                      {opcoesCliente.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded max-h-48 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 w-10">
                          <input
                            type="checkbox"
                            checked={aparelhosFiltrados.length > 0 && aparelhosSelecionados.size === aparelhosFiltrados.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAparelhosSelecionados(new Set(aparelhosFiltrados.map((a) => a.id)))
                              } else {
                                setAparelhosSelecionados(new Set())
                              }
                            }}
                            className="rounded border-slate-300 text-erp-blue"
                          />
                        </th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">IMEI</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">Marca/Modelo</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">Operadora</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">Cliente</th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aparelhosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-slate-500 text-[11px]">
                            Nenhum aparelho disponível.
                          </td>
                        </tr>
                      ) : (
                        aparelhosFiltrados.map((a) => (
                          <tr key={a.id} className="border-b border-slate-100">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={aparelhosSelecionados.has(a.id)}
                                onChange={(e) => {
                                  setAparelhosSelecionados((prev) => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.add(a.id)
                                    else next.delete(a.id)
                                    return next
                                  })
                                }}
                                className="rounded border-slate-300 text-erp-blue"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium">{a.identificador ?? '-'}</td>
                            <td className="px-3 py-2">{[a.marca, a.modelo].filter(Boolean).join(' / ') || '-'}</td>
                            <td className="px-3 py-2">{a.operadora ?? a.simVinculado?.operadora ?? '-'}</td>
                            <td className="px-3 py-2">{getClienteLabel(a)}</td>
                            <td className="px-3 py-2">
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <footer className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <span
                className={cn(
                  'text-[10px] font-bold px-3 py-1 rounded-full border uppercase flex items-center gap-1.5',
                  progressQtd >= qtdEsperada
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                )}
              >
                <MaterialIcon name="check_circle" className="text-sm" />
                {progressQtd >= qtdEsperada ? 'Kit Completo' : `Em andamento (${progressQtd}/${qtdEsperada})`}
              </span>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSalvarEVincular}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salvar e Vincular ao Pedido
                </Button>
              </div>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SidePanel({
  pedido,
  pedidoApi,
  open,
  onClose,
  onStatusUpdated,
  kitsVinculados,
  onKitsChange,
  tipoDespacho,
  onTipoDespachoChange,
  kitsPorPedido,
  transportadora,
  numeroNf,
  onTransportadoraChange,
  onNumeroNfChange,
}: {
  pedido: PedidoRastreadorView | null
  pedidoApi: PedidoRastreadorApi | null
  open: boolean
  onClose: () => void
  onStatusUpdated: () => void
  kitsVinculados: KitVinculado[]
  onKitsChange: (kits: KitVinculado[]) => void
  tipoDespacho: TipoDespacho
  onTipoDespachoChange: (tipo: TipoDespacho) => void
  kitsPorPedido: Record<number, KitVinculado[]>
  transportadora: string
  numeroNf: string
  onTransportadoraChange: (valor: string) => void
  onNumeroNfChange: (valor: string) => void
}) {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [kitExpandidoId, setKitExpandidoId] = useState<number | null>(null)

  const [detalhesKitId, setDetalhesKitId] = useState<number | null>(null)
  const [modalSelecaoKit, setModalSelecaoKit] = useState(false)
  const [kitParaEditar, setKitParaEditar] = useState<{ id: number; nome: string } | null>(null)

  const { data: kitDetalhes, isLoading: carregandoDetalhes } = useQuery({
    queryKey: ['kit', detalhesKitId],
    queryFn: () => api<KitComAparelhos>(`/aparelhos/pareamento/kits/${detalhesKitId}`),
    enabled: detalhesKitId != null,
  })

  const podeEditar = hasPermission('AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR')

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      kitIds,
    }: {
      id: number
      status: StatusPedidoRastreador
      kitIds?: number[]
    }) =>
      api(`/pedidos-rastreadores/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, kitIds }),
      }),
    onSuccess: (_, variables) => {
      const status = variables.status
      queryClient.invalidateQueries({ queryKey: ['pedidos-rastreadores'] })
      // Sempre invalidar aparelhos quando mudança de status pode afetar equipamentos
      if (
        status === 'DESPACHADO' ||
        status === 'ENTREGUE' ||
        status === 'CONFIGURADO' ||
        status === 'EM_CONFIGURACAO' ||
        status === 'SOLICITADO'
      ) {
        queryClient.invalidateQueries({ queryKey: ['aparelhos'] })
        queryClient.invalidateQueries({ queryKey: ['kit'] })
        queryClient.invalidateQueries({ queryKey: ['kits'] })
      }
      onStatusUpdated()
      toast.success('Status atualizado')
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status'),
  })

  if (!pedido || !open) return null

  const estaConcluido = pedido.status === 'entregue'
  const statusIdx = STATUS_ORDER.indexOf(pedido.status)
  const podeRetroceder = statusIdx > 0 && podeEditar && !estaConcluido
  const statusAnterior = podeRetroceder ? STATUS_ORDER[statusIdx - 1] : null

  const proximoStatus: StatusPedidoKey | null = (() => {
    if (estaConcluido || statusIdx >= STATUS_ORDER.length - 1 || !podeEditar) return null
    if (pedido.status === 'configurado' && tipoDespacho === 'EM_MAOS') return 'entregue'
    if (pedido.status === 'despachado') return 'entregue'
    return STATUS_ORDER[statusIdx + 1]
  })()
  const progress = kitsVinculados.reduce((s, k) => s + k.quantidade, 0)
  const total = pedido?.quantidade ?? 0
  const progressPct = total ? Math.min(100, (progress / total) * 100) : 0
  const podeDespachar = progress >= total && total > 0

  const bloqueiaAvançoParaConfigurado = proximoStatus === 'configurado' && progress < total
  const podeAvançar = proximoStatus != null && !bloqueiaAvançoParaConfigurado
  const mostraConcluir = proximoStatus === 'entregue'

  function handleAvançar() {
    if (!proximoStatus || !pedido) return
    const novoStatus = STATUS_TO_API[proximoStatus]
    const precisaKitIds =
      novoStatus === 'CONFIGURADO' || novoStatus === 'DESPACHADO' || novoStatus === 'ENTREGUE'
    const payload = {
      id: pedido.id,
      status: novoStatus,
      kitIds: precisaKitIds && kitsVinculados.length > 0 ? kitsVinculados.map((k) => k.id) : undefined,
    }
    statusMutation.mutate(payload)
  }

  function handleRetroceder() {
    if (!statusAnterior || !pedido) return
    const novoStatus = STATUS_TO_API[statusAnterior]
    const precisaKitIds = pedido.status === 'despachado' || pedido.status === 'entregue'
    const payload: { id: number; status: StatusPedidoRastreador; kitIds?: number[] } = {
      id: pedido.id,
      status: novoStatus,
    }
    if (precisaKitIds) {
      const ids =
        kitsVinculados.length > 0
          ? kitsVinculados.map((k) => k.id)
          : (pedidoApi?.kitIds && Array.isArray(pedidoApi.kitIds)
            ? pedidoApi.kitIds
            : [])
      if (ids.length > 0) payload.kitIds = ids
    }
    statusMutation.mutate(payload)
  }

  function handleVincularKit(kit: KitResumo, qtd: number) {
    onKitsChange(
      (() => {
        const prev = kitsVinculados
        const idx = prev.findIndex((k) => k.id === kit.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], nome: kit.nome, quantidade: qtd }
          return next
        }
        return [...prev, { id: kit.id, nome: kit.nome, quantidade: qtd }]
      })()
    )
  }

  function handleRemoverKit(kitId: number) {
    onKitsChange(kitsVinculados.filter((k) => k.id !== kitId))
    if (kitExpandidoId === kitId) setKitExpandidoId(null)
    if (detalhesKitId === kitId) setDetalhesKitId(null)
  }

  function handleToggleExpandir(kitId: number) {
    if (kitExpandidoId === kitId) {
      setKitExpandidoId(null)
      setDetalhesKitId(null)
    } else {
      setKitExpandidoId(kitId)
      setDetalhesKitId(kitId)
    }
  }

  function handleEditarKit(kit: KitVinculado) {
    setKitParaEditar({ id: kit.id, nome: kit.nome })
    setModalSelecaoKit(true)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[580px] max-w-[95vw] sm:max-w-[580px] p-0 flex flex-col overflow-y-auto"
      >
        <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pedido em Foco
              </span>
              {pedido.urgencia && (
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase px-2 py-0.5 rounded',
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
            <SheetTitle className="text-xl font-bold text-slate-900">{pedido.codigo}</SheetTitle>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500 mb-1">Destinatário</p>
              <p className="font-semibold">{pedido.destinatario}</p>
              <p className="text-slate-400">
                {pedido.tipo === 'tecnico' ? 'Técnico' : 'Cliente'}
              </p>
              {pedido.cidadeEstado && (
                <p className="text-slate-500 text-[11px] mt-0.5">{pedido.cidadeEstado}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500 mb-1">Solicitação</p>
              <p className="font-semibold">
                {pedido.dataSolicitacao
                  ? formatarDataCurta(pedido.dataSolicitacao)
                  : '-'}
              </p>
            </div>
            {(pedido.endereco || pedido.cpfCnpj) && (
              <div className="col-span-2 space-y-2">
                {pedido.endereco && (
                  <div>
                    <p className="text-slate-500 mb-1">Endereço</p>
                    <p className="font-medium text-slate-700">{pedido.endereco}</p>
                  </div>
                )}
                {pedido.cpfCnpj && (
                  <div>
                    <p className="text-slate-500 mb-1">CPF/CNPJ</p>
                    <p className="font-medium text-slate-700">{pedido.cpfCnpj}</p>
                  </div>
                )}
              </div>
            )}
            {(pedido.marcaModelo || pedido.operadora) && (
              <div className="col-span-2 p-3 bg-white border border-slate-200 rounded-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                  Requisitos de Hardware
                </p>
                <div className="flex flex-wrap gap-2">
                  {pedido.marcaModelo && (
                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-medium text-slate-700">
                      {pedido.marcaModelo}
                    </span>
                  )}
                  {pedido.operadora && (
                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-medium text-slate-700">
                      Operadora: {pedido.operadora}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="p-6 border-b border-slate-100">
          {estaConcluido ? (
            <div className="flex items-center gap-2 py-2 mb-4">
              <MaterialIcon name="check_circle" className="text-emerald-500 text-xl" />
              <span className="text-sm font-bold text-emerald-700">Concluído</span>
            </div>
          ) : (
            podeEditar && (podeAvançar || podeRetroceder) && (
              <div className="flex gap-2 mb-4 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetroceder}
                  disabled={!podeRetroceder || statusMutation.isPending}
                  className="flex-1 text-[10px] font-bold uppercase"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Retroceder
                </Button>
                <Button
                  size="sm"
                  onClick={handleAvançar}
                  disabled={!podeAvançar || statusMutation.isPending}
                  className="flex-1 bg-erp-blue hover:bg-blue-700 text-[10px] font-bold uppercase"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : mostraConcluir ? (
                    <>
                      Concluir
                      <MaterialIcon name="check" className="text-sm ml-1" />
                    </>
                  ) : (
                    <>
                      Avançar
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )
          )}
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Progresso da Configuração
            </span>
            <div className="text-right">
              <span className="text-3xl font-bold text-erp-blue leading-none">{progress}</span>
              <span className="text-slate-400 font-medium"> / {total}</span>
            </div>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-erp-blue rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {bloqueiaAvançoParaConfigurado && (
            <p className="text-[10px] text-amber-600 mt-1.5">
              Vincule todos os rastreadores ({progress}/{total}) para avançar
            </p>
          )}
        </div>

        <div className={cn('p-6 border-b border-slate-100', estaConcluido && 'opacity-90')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Kits Vinculados</h3>
            {!estaConcluido && kitsVinculados.length > 0 && (
              <button
                type="button"
                onClick={() => setModalSelecaoKit(true)}
                className="text-[10px] font-bold text-erp-blue flex items-center gap-1 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <MaterialIcon name="add" className="text-sm" /> ADICIONAR KIT
              </button>
            )}
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-semibold">KIT</th>
                <th className="pb-2 font-semibold text-center">QTD</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {kitsVinculados.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <p className="text-[11px]">Nenhum kit vinculado.</p>
                      {!estaConcluido && (
                        <button
                          type="button"
                          onClick={() => setModalSelecaoKit(true)}
                          className="text-[10px] font-bold text-erp-blue flex items-center gap-1 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <MaterialIcon name="add" className="text-sm" /> ADICIONAR KIT
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                kitsVinculados.map((k) => (
                  <Fragment key={k.id}>
                    <tr
                      key={k.id}
                      className={cn(
                        'hover:bg-slate-50 group',
                        kitExpandidoId === k.id && 'bg-blue-50/50'
                      )}
                    >
                      <td className="py-2.5 font-bold text-slate-700">{k.nome}</td>
                      <td className="py-2.5 text-center">{k.quantidade}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleExpandir(k.id)}
                            className="text-slate-400 hover:text-erp-blue"
                          >
                            <MaterialIcon
                              name={kitExpandidoId === k.id ? 'expand_less' : 'expand_more'}
                              className="text-base"
                            />
                          </button>
                          {!estaConcluido && (
                            <button
                              type="button"
                              onClick={() => handleRemoverKit(k.id)}
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                              aria-label="Remover kit"
                            >
                              <MaterialIcon name="delete" className="text-base" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {kitExpandidoId === k.id && (
                      <tr key={`${k.id}-expand`} className="bg-slate-50/80">
                        <td colSpan={3} className="px-4 pb-4 pt-1 align-top">
                          <div className="pl-2 border-l-2 border-slate-200">
                            {carregandoDetalhes ? (
                              <div className="flex items-center py-4 text-slate-500 text-[11px]">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Carregando...
                              </div>
                            ) : kitDetalhes && detalhesKitId === k.id ? (
                              <div className="space-y-3 pt-1">
                                {!estaConcluido && (
                                  <div className="flex gap-2 flex-wrap items-center mb-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditarKit(k)}
                                      className="text-[10px] font-bold h-7 bg-erp-blue hover:bg-blue-700"
                                    >
                                      <MaterialIcon name="edit" className="text-sm mr-2" />
                                      Editar
                                    </Button>
                                  </div>
                                )}
                                {(() => {
                                  const aparelhos = kitDetalhes.aparelhos ?? []
                                  const marcasModelos = Array.from(
                                    new Set(
                                      aparelhos
                                        .map((a) => [a.marca, a.modelo].filter(Boolean).join(' / '))
                                        .filter(Boolean)
                                    )
                                  ).sort()
                                  const operadoras = Array.from(
                                    new Set(
                                      aparelhos
                                        .map((a) => a.operadora ?? a.simVinculado?.operadora ?? '')
                                        .filter(Boolean)
                                    )
                                  ).sort()
                                  const empresas = Array.from(
                                    new Set(
                                      aparelhos.map((a) =>
                                        a.cliente?.nome ??
                                        a.tecnico?.nome ??
                                        (a.proprietario === 'INFINITY' ? 'Infinity' : null)
                                      ).filter(Boolean)
                                    )
                                  ).sort()
                                  return (
                                    <div className="grid grid-cols-1 gap-2 text-[11px]">
                                      {marcasModelos.length > 0 && (
                                        <div className="p-2 bg-white rounded border border-slate-200">
                                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">Marcas / Modelos</p>
                                          <div className="flex flex-wrap gap-1">
                                            {marcasModelos.map((mm) => (
                                              <span key={mm} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{mm}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {operadoras.length > 0 && (
                                        <div className="p-2 bg-white rounded border border-slate-200">
                                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">Operadoras</p>
                                          <div className="flex flex-wrap gap-1">
                                            {operadoras.map((op) => (
                                              <span key={op} className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">{op}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {empresas.length > 0 && (
                                        <div className="p-2 bg-white rounded border border-slate-200">
                                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">Empresas</p>
                                          <div className="flex flex-wrap gap-1">
                                            {empresas.map((emp) => (
                                              <span key={emp} className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700">{emp}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {marcasModelos.length === 0 && operadoras.length === 0 && empresas.length === 0 && (
                                        <p className="text-slate-500 italic text-[11px]">Nenhum aparelho no kit.</p>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t-2 border-t-blue-100 bg-blue-50/20">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
            <MaterialIcon name="local_shipping" className="text-erp-blue" />
            Despacho de Carga
          </h3>
          <div className={cn('space-y-3', (estaConcluido || !podeDespachar) && 'opacity-75 pointer-events-none')}>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                Tipo de envio
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'TRANSPORTADORA' as const, label: 'Transportadora', icon: 'local_shipping' },
                  { value: 'CORREIOS' as const, label: 'Correios', icon: 'mail' },
                  { value: 'EM_MAOS' as const, label: 'Em Mãos', icon: 'handshake' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onTipoDespachoChange(opt.value)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-bold uppercase border transition-colors w-full',
                      tipoDespacho === opt.value
                        ? 'bg-erp-blue text-white border-erp-blue'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    )}
                  >
                    <MaterialIcon name={opt.icon} className="text-sm" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {tipoDespacho !== 'EM_MAOS' && (
              <div className="grid grid-cols-2 gap-3">
                {tipoDespacho === 'TRANSPORTADORA' && (
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Transportadora
                    </Label>
                    <Input
                      value={transportadora}
                      onChange={(e) => onTransportadoraChange(e.target.value)}
                      onBlur={(e) => onTransportadoraChange(e.target.value.trim())}
                      placeholder="Ex: Braspress"
                      className="text-[11px] h-9"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {tipoDespacho === 'CORREIOS' ? 'Cód. Rastreio' : 'Nº NF'}
                  </Label>
                  <Input
                    value={numeroNf}
                    onChange={(e) => onNumeroNfChange(e.target.value)}
                    onBlur={(e) => onNumeroNfChange(e.target.value.trim())}
                    placeholder={tipoDespacho === 'CORREIOS' ? 'BR12345678' : 'Ex: 12345'}
                    className="text-[11px] h-9"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {pedido.historico && pedido.historico.length > 0 && (
          <div className="p-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">
              Histórico do Pedido
            </h3>
            <div className="text-[11px]">
              {pedido.historico.map((item, idx) => (
                <div
                  key={idx}
                  className="relative pl-6 pb-4 border-l border-slate-200 last:border-0"
                >
                  <div
                    className={cn(
                      'absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white',
                      item.concluido ? 'bg-erp-blue' : 'bg-slate-300'
                    )}
                  />
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800">{item.titulo}</span>
                  </div>
                  <p className="text-slate-500">{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <ModalSelecaoEKit
          open={modalSelecaoKit}
          onOpenChange={(o) => {
            setModalSelecaoKit(o)
            if (!o) setKitParaEditar(null)
          }}
          pedido={pedido}
          onVincular={handleVincularKit}
          kitParaEditar={kitParaEditar}
          kitsPorPedido={kitsPorPedido}
        />
      </SheetContent>
    </Sheet>
  )
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
              <KanbanColumn
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
