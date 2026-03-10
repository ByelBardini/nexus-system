import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
import type { ClienteResumo, SubclienteResumo, TecnicoResumo } from './types'

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

interface ClienteComSubclientes extends ClienteResumo {
  subclientes?: SubclienteResumo[]
}

export function ModalNovoPedido({
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
    const opts: Array<{
      tipo: 'cliente' | 'subcliente'
      id: number
      label: string
      item: ClienteComSubclientes | (SubclienteResumo & { cliente?: ClienteResumo })
    }> = []
    clientes.forEach((c) => {
      opts.push({ tipo: 'cliente', id: c.id, label: c.nome, item: c })
      ;(c.subclientes ?? []).forEach((s) => {
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
                <Label htmlFor="marcaModeloEspecifico" className="text-xs font-medium cursor-pointer">
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
                <Label htmlFor="operadoraEspecifica" className="text-xs font-medium cursor-pointer">
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
                    {(form.formState.errors.tecnicoId ?? form.formState.errors.destinoCliente ?? form.formState.errors.root)
                      ?.message ?? 'Selecione o destinatário'}
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
                  <span className="font-bold">{destinatarioSelecionado?.nome ?? '...'}</span>.
                </p>
              </div>
            )}
          </div>

          <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-erp-blue hover:bg-blue-700"
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
