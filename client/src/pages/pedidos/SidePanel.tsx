import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type {
  PedidoRastreadorView,
  PedidoRastreadorApi,
  StatusPedidoKey,
  StatusPedidoRastreador,
} from './types'
import { STATUS_ORDER, STATUS_TO_API } from './types'
import type { KitResumo, KitVinculado, KitComAparelhos, TipoDespacho } from './pedidos-config-types'
import { ModalSelecaoEKit } from './ModalSelecaoEKit'

export function SidePanel({
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

  const kitIdsMutation = useMutation({
    mutationFn: ({ id, kitIds }: { id: number; kitIds: number[] }) =>
      api(`/pedidos-rastreadores/${id}/kits`, {
        method: 'PATCH',
        body: JSON.stringify({ kitIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-rastreadores'] })
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar kit'),
  })

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
    const prev = kitsVinculados
    const idx = prev.findIndex((k) => k.id === kit.id)
    const newKits =
      idx >= 0
        ? prev.map((k, i) => (i === idx ? { ...k, nome: kit.nome, quantidade: qtd } : k))
        : [...prev, { id: kit.id, nome: kit.nome, quantidade: qtd }]
    onKitsChange(newKits)
    if (pedido) {
      kitIdsMutation.mutate({ id: pedido.id, kitIds: newKits.map((k) => k.id) })
    }
  }

  function handleRemoverKit(kitId: number) {
    const newKits = kitsVinculados.filter((k) => k.id !== kitId)
    onKitsChange(newKits)
    if (kitExpandidoId === kitId) setKitExpandidoId(null)
    if (detalhesKitId === kitId) setDetalhesKitId(null)
    if (pedido) {
      kitIdsMutation.mutate({ id: pedido.id, kitIds: newKits.map((k) => k.id) })
    }
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
                {pedido.tipo === 'tecnico' ? 'Técnico' : pedido.tipo === 'misto' ? 'Misto' : 'Cliente'}
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

        {pedido.tipo === 'misto' && pedido.itensMisto && pedido.itensMisto.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Distribuição dos Itens</p>
            <div className="space-y-1">
              {pedido.itensMisto.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-800">{item.quantidade} un</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-xs font-bold">
              <span className="text-slate-500">Total</span>
              <span className="text-slate-800">{pedido.quantidade} un</span>
            </div>
          </div>
        )}

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
          filtrosPedido={pedidoApi ? {
            clienteId: pedidoApi.deClienteId,
            modeloEquipamentoId: pedidoApi.modeloEquipamentoId,
            marcaEquipamentoId: pedidoApi.marcaEquipamentoId,
            operadoraId: pedidoApi.operadoraId,
          } : null}
        />
      </SheetContent>
    </Sheet>
  )
}
