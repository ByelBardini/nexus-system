import { useState, useMemo, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  formatarDataCurta,
  formatarFromNow,
  formatarDuracao,
} from '@/lib/format'
import {
  mapPedidoToView,
  type PedidoRastreadorView,
  type StatusPedidoKey,
  type TecnicoResumo,
  type SubclienteResumo,
  type ClienteResumo,
} from './types'

const schemaNovoPedido = z
  .object({
    tipoDestino: z.enum(['TECNICO', 'CLIENTE']),
    tecnicoId: z.number().optional(),
    destinoCliente: z.string().optional(),
    deCliente: z.boolean().optional(),
    deClienteId: z.number().optional(),
    dataSolicitacao: z.string().min(1, 'Data obrigatória'),
    marcaModeloEspecifico: z.boolean().optional(),
    marcaEquipamentoId: z.number().optional(),
    modeloEquipamentoId: z.number().optional(),
    operadoraEspecifica: z.boolean().optional(),
    operadoraId: z.number().optional(),
    quantidade: z.number().min(1, 'Mínimo 1 unidade'),
    urgencia: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
    observacao: z.string().optional(),
  })
  .refine(
    (d) =>
      (d.tipoDestino === 'TECNICO' && d.tecnicoId && d.tecnicoId > 0) ||
      (d.tipoDestino === 'CLIENTE' && d.destinoCliente && d.destinoCliente.length > 0),
    { message: 'Selecione o destinatário' },
  )

type FormNovoPedido = z.infer<typeof schemaNovoPedido>

const STATUS_CONFIG: Record<
  StatusPedidoKey,
  { label: string; color: string; dotColor: string }
> = {
  solicitado: {
    label: 'Solicitado',
    color: 'amber',
    dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
  },
  em_configuracao: {
    label: 'Em Configuração',
    color: 'blue',
    dotColor: 'bg-blue-500',
  },
  configurado: {
    label: 'Configurado',
    color: 'purple',
    dotColor: 'bg-purple-500',
  },
  despachado: {
    label: 'Despachado',
    color: 'orange',
    dotColor: 'bg-orange-500',
  },
  entregue: {
    label: 'Entregue',
    color: 'emerald',
    dotColor: 'bg-emerald-500',
  },
}

const STATUS_ORDER: StatusPedidoKey[] = [
  'solicitado',
  'em_configuracao',
  'configurado',
  'despachado',
  'entregue',
]

const URGENCIA_STYLE: Record<string, { bar: string; badge: string }> = {
  Baixa: { bar: 'border-l-slate-300', badge: 'bg-slate-50 text-slate-500 border-slate-200' },
  Média: { bar: 'border-l-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  Alta: { bar: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  Urgente: { bar: 'border-l-red-500', badge: 'bg-red-100 text-red-700 border-red-200' },
}

function KanbanCard({
  pedido,
  onClick,
}: {
  pedido: PedidoRastreadorView
  onClick: () => void
}) {
  const tipoLabel = pedido.tipo === 'tecnico' ? 'Técnico' : 'Cliente'
  const tipoIcon = pedido.tipo === 'tecnico' ? 'person' : 'business'
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
          'text-[11px] mb-2 flex items-center gap-1',
          isEntregue ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        <MaterialIcon name={tipoIcon} className="text-sm" />
        {tipoLabel}
      </div>
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

function KanbanColumn({
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

interface ClienteComSubclientes extends ClienteResumo {
  subclientes?: SubclienteResumo[]
}

function ModalNovoPedido({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const hoje = new Date().toISOString().slice(0, 10)

  const defaultValues: FormNovoPedido = {
    tipoDestino: 'TECNICO',
    tecnicoId: undefined,
    destinoCliente: '',
    deCliente: false,
    deClienteId: undefined,
    dataSolicitacao: hoje,
    marcaModeloEspecifico: false,
    marcaEquipamentoId: undefined,
    modeloEquipamentoId: undefined,
    operadoraEspecifica: false,
    operadoraId: undefined,
    quantidade: 1,
    urgencia: 'MEDIA',
    observacao: '',
  }

  const form = useForm<FormNovoPedido>({
    resolver: zodResolver(schemaNovoPedido),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset({ ...defaultValues, dataSolicitacao: new Date().toISOString().slice(0, 10) })
    }
  }, [open])

  const tipoDestino = form.watch('tipoDestino')
  const tecnicoId = form.watch('tecnicoId')
  const destinoCliente = form.watch('destinoCliente')
  const deCliente = form.watch('deCliente')
  const marcaModeloEspecifico = form.watch('marcaModeloEspecifico')
  const marcaEquipamentoId = form.watch('marcaEquipamentoId')
  const operadoraEspecifica = form.watch('operadoraEspecifica')
  const quantidade = form.watch('quantidade')

  const { clienteId, subclienteId } = useMemo((): { clienteId?: number; subclienteId?: number } => {
    if (!destinoCliente || (!destinoCliente.startsWith('cliente-') && !destinoCliente.startsWith('subcliente-')))
      return {}
    const [tipo, idStr] = destinoCliente.split('-')
    const id = parseInt(idStr, 10)
    if (isNaN(id)) return {}
    return tipo === 'cliente' ? { clienteId: id } : { subclienteId: id }
  }, [destinoCliente])

  const { data: tecnicos = [], isLoading: loadingTecnicos } = useQuery<TecnicoResumo[]>({
    queryKey: ['tecnicos'],
    queryFn: () => api('/tecnicos'),
    enabled: open,
  })

  const { data: clientes = [], isLoading: loadingClientes } = useQuery<ClienteComSubclientes[]>({
    queryKey: ['clientes', 'com-subclientes'],
    queryFn: () => api('/clientes?subclientes=true'),
    enabled: open,
  })

  const { data: marcas = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ['equipamentos', 'marcas'],
    queryFn: () => api('/equipamentos/marcas'),
    enabled: open,
  })

  const { data: operadoras = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ['equipamentos', 'operadoras'],
    queryFn: () => api('/equipamentos/operadoras'),
    enabled: open,
  })

  const { data: modelosRaw = [] } = useQuery<{ id: number; nome: string; marcaId: number }[]>({
    queryKey: ['equipamentos', 'modelos', marcaEquipamentoId],
    queryFn: () =>
      api(
        marcaEquipamentoId ? `/equipamentos/modelos?marcaId=${marcaEquipamentoId}` : '/equipamentos/modelos'
      ),
    enabled: open,
  })

  const modelos = modelosRaw
  const modelosFiltrados = useMemo(
    () => (marcaEquipamentoId ? modelos.filter((m) => m.marcaId === marcaEquipamentoId) : modelos),
    [modelos, marcaEquipamentoId]
  )

  const opcoesCliente = useMemo(() => {
    const opts: Array<{ tipo: 'cliente' | 'subcliente'; id: number; label: string; item: ClienteComSubclientes | SubclienteResumo & { cliente?: ClienteResumo } }> = []
    clientes.forEach((c) => {
      opts.push({ tipo: 'cliente', id: c.id, label: c.nome, item: c })
        ; (c.subclientes ?? []).forEach((s) => {
          opts.push({
            tipo: 'subcliente',
            id: s.id,
            label: `${s.nome} — ${c.nome}`,
            item: { ...s, cliente: c },
          })
        })
    })
    return opts
  }, [clientes])

  const destinatarioSelecionado =
    tipoDestino === 'TECNICO'
      ? tecnicos.find((t) => t.id === tecnicoId) ?? null
      : clienteId
        ? clientes.find((c) => c.id === clienteId) ?? null
        : subclienteId
          ? opcoesCliente.find((o) => o.tipo === 'subcliente' && o.id === subclienteId)?.item ?? null
          : null

  const createMutation = useMutation({
    mutationFn: (data: FormNovoPedido) => {
      const dest = data.destinoCliente ?? ''
      const [tipo, idStr] = dest.split('-')
      const id = parseInt(idStr, 10)
      const isCliente = tipo === 'cliente' && !isNaN(id)
      const isSubcliente = tipo === 'subcliente' && !isNaN(id)
      return api('/pedidos-rastreadores', {
        method: 'POST',
        body: JSON.stringify({
          tipoDestino: data.tipoDestino,
          tecnicoId: data.tipoDestino === 'TECNICO' ? data.tecnicoId : undefined,
          clienteId: data.tipoDestino === 'CLIENTE' && isCliente ? id : undefined,
          subclienteId: data.tipoDestino === 'CLIENTE' && isSubcliente ? id : undefined,
          dataSolicitacao: data.dataSolicitacao,
          deClienteId: data.tipoDestino === 'TECNICO' && data.deCliente ? data.deClienteId : undefined,
          marcaEquipamentoId: data.marcaModeloEspecifico ? data.marcaEquipamentoId : undefined,
          modeloEquipamentoId: data.marcaModeloEspecifico ? data.modeloEquipamentoId : undefined,
          operadoraId: data.operadoraEspecifica ? data.operadoraId : undefined,
          quantidade: data.quantidade,
          urgencia: data.urgencia ?? 'MEDIA',
          observacao: data.observacao ?? undefined,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-rastreadores'] })
      form.reset(defaultValues)
      onOpenChange(false)
      onSuccess()
      toast.success('Pedido criado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar pedido'),
  })

  function handleClose() {
    form.reset(defaultValues)
    onOpenChange(false)
  }

  function onSubmit(data: FormNovoPedido) {
    createMutation.mutate(data)
  }

  const cidadeDisplay =
    destinatarioSelecionado && 'cidade' in destinatarioSelecionado && 'estado' in destinatarioSelecionado
      ? destinatarioSelecionado.cidade && destinatarioSelecionado.estado
        ? `${destinatarioSelecionado.cidade}, ${destinatarioSelecionado.estado}`
        : destinatarioSelecionado.cidade ?? '-'
      : null
  const filialDisplay =
    destinatarioSelecionado && 'cliente' in destinatarioSelecionado
      ? (destinatarioSelecionado as SubclienteResumo & { cliente?: ClienteResumo }).cliente?.nome ?? '-'
      : null

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset(defaultValues)
        onOpenChange(o)
      }}
    >
      <DialogContent hideClose className="p-0 max-w-[600px] gap-0 overflow-hidden rounded-sm border-slate-200">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MaterialIcon name="add_circle" className="text-xl text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Novo Pedido de Rastreador</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </header>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Nº do Pedido
                </Label>
                <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-600 font-medium">
                  Será gerado
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Data do Pedido <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="dataSolicitacao"
                  control={form.control}
                  render={({ field }) => (
                    <Input type="date" className="h-9 text-xs" {...field} />
                  )}
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Criado por
                </Label>
                <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-600 font-medium truncate">
                  {user?.nome ?? '-'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Controller
                  name="marcaModeloEspecifico"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="marcaModeloEspecifico"
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        if (!checked) {
                          form.setValue('marcaEquipamentoId', undefined)
                          form.setValue('modeloEquipamentoId', undefined)
                        }
                      }}
                    />
                  )}
                />
                <Label
                  htmlFor="marcaModeloEspecifico"
                  className="text-xs font-medium cursor-pointer"
                >
                  Marca/modelo específico
                </Label>
              </div>
              {marcaModeloEspecifico && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                      Marca
                    </Label>
                    <Controller
                      name="marcaEquipamentoId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => {
                            field.onChange(v ? +v : undefined)
                            form.setValue('modeloEquipamentoId', undefined)
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs w-full">
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {marcas.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                      Modelo
                    </Label>
                    <Controller
                      name="modeloEquipamentoId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(v ? +v : undefined)}
                          disabled={!marcaEquipamentoId}
                        >
                          <SelectTrigger className="h-9 text-xs w-full">
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {modelosFiltrados.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Controller
                  name="operadoraEspecifica"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="operadoraEspecifica"
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        if (!checked) form.setValue('operadoraId', undefined)
                      }}
                    />
                  )}
                />
                <Label
                  htmlFor="operadoraEspecifica"
                  className="text-xs font-medium cursor-pointer"
                >
                  Operadora específica
                </Label>
              </div>
              {operadoraEspecifica && (
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                    Operadora
                  </Label>
                  <Controller
                    name="operadoraId"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(v) => field.onChange(v ? +v : undefined)}
                      >
                        <SelectTrigger className="h-9 text-xs w-full">
                          <SelectValue placeholder="Selecione a operadora" />
                        </SelectTrigger>
                        <SelectContent>
                          {operadoras.map((o) => (
                            <SelectItem key={o.id} value={String(o.id)}>
                              {o.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest border-l-4 border-erp-blue pl-2">
                Informações de Destino
              </h3>
              <div className="flex rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('tipoDestino', 'TECNICO')
                    form.setValue('tecnicoId', undefined)
                    form.setValue('destinoCliente', '')
                    form.setValue('deCliente', false)
                    form.setValue('deClienteId', undefined)
                  }}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 transition-all',
                    tipoDestino === 'TECNICO'
                      ? 'bg-erp-blue text-white border-erp-blue'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  )}
                >
                  Técnico
                </button>
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('tipoDestino', 'CLIENTE')
                    form.setValue('tecnicoId', undefined)
                    form.setValue('destinoCliente', '')
                  }}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 transition-all',
                    tipoDestino === 'CLIENTE'
                      ? 'bg-erp-blue text-white border-erp-blue'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  )}
                >
                  Cliente
                </button>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Pesquisar Destinatário
                </Label>
                <Controller
                  name={tipoDestino === 'TECNICO' ? 'tecnicoId' : 'destinoCliente'}
                  control={form.control}
                  render={({ field }) => (
                    <div className="relative">
                      <MaterialIcon
                        name="search"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
                      />
                      <Select
                        value={
                          tipoDestino === 'TECNICO'
                            ? (field.value != null ? String(field.value) : '')
                            : String(field.value ?? '')
                        }
                        onValueChange={(v) =>
                          tipoDestino === 'TECNICO' ? field.onChange(v ? +v : undefined) : field.onChange(v ?? '')
                        }
                        disabled={
                          (tipoDestino === 'TECNICO' && loadingTecnicos) ||
                          (tipoDestino === 'CLIENTE' && loadingClientes)
                        }
                      >
                        <SelectTrigger className="pl-9 h-9 text-xs">
                          <SelectValue placeholder="Selecione o destinatário" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoDestino === 'TECNICO'
                            ? tecnicos.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.nome} (Técnico)
                              </SelectItem>
                            ))
                            : opcoesCliente.map((o) => (
                              <SelectItem key={`${o.tipo}-${o.id}`} value={`${o.tipo}-${o.id}`}>
                                {o.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                {(form.formState.errors.tecnicoId ?? form.formState.errors.destinoCliente ?? form.formState.errors.root) && (
                  <p className="text-xs text-destructive mt-1">
                    {(form.formState.errors.tecnicoId ?? form.formState.errors.destinoCliente ?? form.formState.errors.root)?.message ??
                      'Selecione o destinatário'}
                  </p>
                )}
              </div>

              {tipoDestino === 'TECNICO' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Controller
                      name="deCliente"
                      control={form.control}
                      render={({ field }) => (
                        <Checkbox
                          id="deCliente"
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            if (!checked) form.setValue('deClienteId', undefined)
                          }}
                        />
                      )}
                    />
                    <Label htmlFor="deCliente" className="text-xs font-medium cursor-pointer">
                      De Cliente (cliente enviando rastreadores para o técnico)
                    </Label>
                  </div>
                  {deCliente && (
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                        Cliente remetente
                      </Label>
                      <Controller
                        name="deClienteId"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(v) => field.onChange(v ? +v : undefined)}
                            disabled={loadingClientes}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {clientes.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              {destinatarioSelecionado && (
                <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded shrink-0">
                    <MaterialIcon
                      name={tipoDestino === 'TECNICO' ? 'engineering' : 'business'}
                      className="text-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 mb-0.5">
                      {destinatarioSelecionado.nome}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      {cidadeDisplay && (
                        <span className="flex items-center gap-1">
                          <MaterialIcon name="location_on" className="text-[14px]" />
                          {cidadeDisplay}
                        </span>
                      )}
                      {filialDisplay && (
                        <span className="flex items-center gap-1">
                          <MaterialIcon name="apartment" className="text-[14px]" />
                          {filialDisplay}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 w-full">
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                    Quantidade <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Controller
                      name="quantidade"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={1}
                          className="h-9 text-xs flex-1"
                          {...field}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            field.onChange(isNaN(v) ? 1 : Math.max(1, v))
                          }}
                        />
                      )}
                    />
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">Unidades</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                    Urgência
                  </Label>
                  <Controller
                    name="urgencia"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value ?? 'MEDIA'} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BAIXA">Baixa</SelectItem>
                          <SelectItem value="MEDIA">Média</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                          <SelectItem value="URGENTE">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              {form.formState.errors.quantidade && (
                <p className="text-xs text-destructive">{form.formState.errors.quantidade.message}</p>
              )}
              {form.formState.errors.dataSolicitacao && (
                <p className="text-xs text-destructive">{form.formState.errors.dataSolicitacao.message}</p>
              )}
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                Observação (Opcional)
              </Label>
              <textarea
                {...form.register('observacao')}
                placeholder="Ex: Solicitação urgente para manutenção preventiva."
                className="w-full h-20 p-3 bg-white border border-slate-300 rounded-sm text-xs focus:ring-2 focus:ring-erp-blue focus:border-erp-blue outline-none resize-none"
              />
            </div>

            {(destinatarioSelecionado ?? quantidade > 0) && (
              <div className="bg-blue-50 border border-blue-100 rounded p-3">
                <p className="text-xs text-blue-800 font-medium flex items-center gap-2">
                  <MaterialIcon name="info" className="text-sm" />
                  Você está solicitando{' '}
                  <span className="font-bold underline">{quantidade} unidades</span> para{' '}
                  <span className="font-bold">
                    {destinatarioSelecionado?.nome ?? '...'}
                  </span>
                  .
                </p>
              </div>
            )}
          </div>

          <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                'Enviar Solicitação'
              )}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DrawerDetalhes({
  pedido,
  open,
  onOpenChange,
  onDeleted,
}: {
  pedido: PedidoRastreadorView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/pedidos-rastreadores/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-rastreadores'] })
      onOpenChange(false)
      onDeleted?.()
      toast.success('Pedido excluído com sucesso')
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir pedido'),
  })

  const podeExcluir = hasPermission('AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR')

  function handleExcluir() {
    if (!pedido) return
    if (!window.confirm(`Tem certeza que deseja excluir o pedido ${pedido.codigo}? Esta ação não pode ser desfeita.`)) return
    deleteMutation.mutate(pedido.id)
  }

  if (!pedido) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[450px] max-w-[95vw] sm:max-w-[450px] p-0 flex flex-col"
      >
        <SheetHeader className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Solicitação Detalhada
              </SheetTitle>
              <p className="text-lg font-bold text-slate-800 leading-tight mt-1">
                {pedido.codigo}
              </p>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
              Informações Gerais
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">
                  Tipo de Destino
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {pedido.tipo === 'tecnico' ? 'Técnico' : 'Cliente'}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">
                  Data do Pedido
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {pedido.dataSolicitacao
                    ? new Date(pedido.dataSolicitacao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    : '-'}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">
                  Quantidade
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {pedido.quantidade} Unidades
                </p>
              </div>
              {pedido.marcaModelo && (
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">
                    Marca / Modelo
                  </p>
                  <p className="text-xs font-semibold text-slate-700">{pedido.marcaModelo}</p>
                </div>
              )}
              {pedido.operadora && (
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">
                    Operadora
                  </p>
                  <p className="text-xs font-semibold text-slate-700">{pedido.operadora}</p>
                </div>
              )}
              {pedido.deCliente && (
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">
                    De Cliente
                  </p>
                  <p className="text-xs font-semibold text-slate-700">{pedido.deCliente}</p>
                </div>
              )}
              {pedido.urgencia && (
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">
                    Urgência
                  </p>
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      pedido.urgencia === 'Urgente' || pedido.urgencia === 'Alta'
                        ? 'text-amber-600'
                        : 'text-slate-700'
                    )}
                  >
                    {pedido.urgencia}
                  </p>
                </div>
              )}
            </div>
          </div>

          {(pedido.endereco || pedido.contato) && (
            <div className="mb-8">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                {pedido.endereco && pedido.contato
                  ? 'Endereço e Contato (Destino)'
                  : pedido.endereco
                    ? 'Endereço (Destino)'
                    : 'Meios de Contato (Destino)'}
              </h3>
              <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
                {pedido.endereco && (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                      Endereço
                    </label>
                    <div className="flex items-start gap-2">
                      <MaterialIcon name="location_on" className="text-slate-400 text-sm shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-slate-800">{pedido.endereco}</span>
                    </div>
                  </div>
                )}
                {pedido.contato && (
                  <>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                        Nome Completo
                      </label>
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="person" className="text-slate-400 text-sm" />
                        <span className="text-xs font-semibold text-slate-800">{pedido.contato.nome}</span>
                      </div>
                    </div>
                    {(pedido.contato.telefone || pedido.contato.email) && (
                      <div className="grid grid-cols-2 gap-4">
                        {pedido.contato.telefone && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                              Telefone
                            </label>
                            <div className="flex items-center gap-2">
                              <MaterialIcon name="call" className="text-slate-400 text-sm" />
                              <span className="text-xs font-semibold text-slate-800">
                                {pedido.contato.telefone}
                              </span>
                            </div>
                          </div>
                        )}
                        {pedido.contato.email && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                              E-mail
                            </label>
                            <div className="flex items-center gap-2">
                              <MaterialIcon name="mail" className="text-slate-400 text-sm" />
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {pedido.contato.email}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {pedido.historico && pedido.historico.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                Linha do Tempo
              </h3>
              <div className="space-y-0">
                {pedido.historico.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative pl-6 pb-6 border-l-2 border-slate-200 last:border-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        'absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2',
                        item.concluido ? 'border-erp-blue' : 'border-slate-300'
                      )}
                    />
                    <p
                      className={cn(
                        'text-[11px] font-bold',
                        item.concluido ? 'text-slate-800' : 'text-slate-400'
                      )}
                    >
                      {item.titulo}
                    </p>
                    <p
                      className={cn(
                        'text-[10px]',
                        item.concluido ? 'text-slate-500' : 'text-slate-400'
                      )}
                    >
                      {item.descricao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <SheetFooter className="p-6 border-t border-slate-200 bg-white flex-row gap-2 sm:flex-row">
          {podeExcluir && (
            <Button
              variant="destructive"
              className="flex-1 sm:flex-initial font-bold text-xs uppercase tracking-wide"
              onClick={handleExcluir}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MaterialIcon name="delete" className="text-sm mr-2" />
              )}
              Excluir
            </Button>
          )}
          <Button
            className={cn(
              'font-bold text-xs uppercase tracking-wide',
              podeExcluir ? 'flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-900' : 'w-full bg-slate-800 hover:bg-slate-900'
            )}
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function PedidosRastreadoresPage() {
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoRastreadorView | null>(null)
  const [modalNovoPedidoOpen, setModalNovoPedidoOpen] = useState(false)

  const { data: lista, isLoading } = useQuery({
    queryKey: ['pedidos-rastreadores', busca],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (busca.trim()) params.set('search', busca.trim())
      return api<{ data: unknown[] }>(`/pedidos-rastreadores?${params}`)
    },
  })

  const pedidosView = useMemo(() => {
    const arr = (lista?.data ?? []) as Parameters<typeof mapPedidoToView>[0][]
    return arr.map(mapPedidoToView)
  }, [lista?.data])

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
    setPedidoSelecionado(pedido)
    setDrawerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <MaterialIcon
            name="search"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <Input
            className="pl-8 text-[11px]"
            placeholder="Buscar pedido ou destino..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setModalNovoPedidoOpen(true)}
            className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase"
          >
            <MaterialIcon name="add" className="text-sm mr-1" />
            Novo Pedido
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto bg-slate-100 p-4 min-h-[450px]">
          <div className="flex gap-4 min-w-max min-h-[420px]">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                pedidos={pedidosPorStatus[status]}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </div>
      </div>

      <DrawerDetalhes
        pedido={pedidoSelecionado}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDeleted={() => setPedidoSelecionado(null)}
      />

      <ModalNovoPedido
        open={modalNovoPedidoOpen}
        onOpenChange={setModalNovoPedidoOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pedidos-rastreadores'] })}
      />
    </div>
  )
}
