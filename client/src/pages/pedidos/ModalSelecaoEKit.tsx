import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatarDataHora } from '@/lib/format'
import type { PedidoRastreadorView } from './types'
import type {
  KitResumo,
  KitVinculado,
  KitComAparelhos,
  AparelhoNoKit,
  KitDetalhe,
} from './pedidos-config-types'

export function ModalSelecaoEKit({
  open,
  onOpenChange,
  pedido,
  onVincular,
  kitParaEditar,
  kitsPorPedido,
  filtrosPedido,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  pedido: PedidoRastreadorView | null
  onVincular: (kit: KitResumo, qtd: number) => void
  kitParaEditar?: { id: number; nome: string } | null
  kitsPorPedido?: Record<number, KitVinculado[]>
  filtrosPedido?: {
    clienteId?: number | null
    modeloEquipamentoId?: number | null
    marcaEquipamentoId?: number | null
    operadoraId?: number | null
  } | null
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
    queryKey: ['aparelhos', 'disponiveis', kitSelecionado?.id, filtrosPedido],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filtrosPedido?.clienteId) params.set('clienteId', String(filtrosPedido.clienteId))
      if (filtrosPedido?.modeloEquipamentoId) params.set('modeloEquipamentoId', String(filtrosPedido.modeloEquipamentoId))
      if (filtrosPedido?.marcaEquipamentoId) params.set('marcaEquipamentoId', String(filtrosPedido.marcaEquipamentoId))
      if (filtrosPedido?.operadoraId) params.set('operadoraId', String(filtrosPedido.operadoraId))
      const qs = params.toString()
      return api(qs ? `/aparelhos/pareamento/aparelhos-disponiveis?${qs}` : '/aparelhos/pareamento/aparelhos-disponiveis')
    },
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
    return kitsDetalhes.filter((k) => !k.kitConcluido && !kitIdsEmOutrosPedidos.has(k.id))
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
                  className="bg-erp-blue hover:bg-blue-700 text-xs font-bold uppercase"
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
                          <Checkbox
                            checked={aparelhosFiltrados.length > 0 && aparelhosSelecionados.size === aparelhosFiltrados.length}
                            onCheckedChange={(v) => {
                              if (v) {
                                setAparelhosSelecionados(new Set(aparelhosFiltrados.map((a) => a.id)))
                              } else {
                                setAparelhosSelecionados(new Set())
                              }
                            }}
                            className="rounded border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
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
                              <Checkbox
                                checked={aparelhosSelecionados.has(a.id)}
                                onCheckedChange={(v) => {
                                  setAparelhosSelecionados((prev) => {
                                    const next = new Set(prev)
                                    if (v) next.add(a.id)
                                    else next.delete(a.id)
                                    return next
                                  })
                                }}
                                className="rounded border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
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
                  className="bg-erp-blue hover:bg-blue-700"
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
