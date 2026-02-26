import { useState, useMemo, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InputPreco } from '@/components/InputPreco'
import { InputTelefone } from '@/components/InputTelefone'
import { SelectCidade } from '@/components/SelectCidade'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useUFs, useMunicipios } from '@/hooks/useBrasilAPI'
import { formatarTelefone } from '@/lib/format'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  telefone: z.string().optional(),
  enderecoEntrega: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  ativo: z.boolean(),
  instalacaoComBloqueio: z.coerce.number().min(0),
  instalacaoSemBloqueio: z.coerce.number().min(0),
  revisao: z.coerce.number().min(0),
  retirada: z.coerce.number().min(0),
  deslocamento: z.coerce.number().min(0),
})

type FormData = z.infer<typeof schema>

interface Tecnico {
  id: number
  nome: string
  telefone: string | null
  enderecoEntrega: string | null
  cidade: string | null
  estado: string | null
  ativo: boolean
  precos?: {
    instalacaoComBloqueio: number | string
    instalacaoSemBloqueio: number | string
    revisao: number | string
    retirada: number | string
    deslocamento: number | string
  }
}

function toNum(v: number | string | undefined): number {
  if (v === undefined) return 0
  return typeof v === 'string' ? parseFloat(v) || 0 : v
}

function formatReais(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val)
}

const PAGE_SIZE = 10

export function TecnicosPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [page, setPage] = useState(0)
  const canCreate = hasPermission('AGENDAMENTO.TECNICO.CRIAR')
  const canEdit = hasPermission('AGENDAMENTO.TECNICO.EDITAR')

  const { data: tecnicos = [], isLoading, isError, error } = useQuery<Tecnico[]>({
    queryKey: ['tecnicos'],
    queryFn: () => api('/tecnicos'),
  })

  const filtered = useMemo(() => {
    return tecnicos.filter((t) => {
      const matchBusca =
        !busca.trim() ||
        t.nome.toLowerCase().includes(busca.toLowerCase())
      const matchEstado = filtroEstado === 'todos' || (t.estado ?? '') === filtroEstado
      const matchStatus =
        filtroStatus === 'todos' ||
        (filtroStatus === 'ativo' && t.ativo) ||
        (filtroStatus === 'inativo' && !t.ativo)
      return matchBusca && matchEstado && matchStatus
    })
  }, [tecnicos, busca, filtroEstado, filtroStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      api(`/tecnicos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: data.ativo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnicos'] })
      toast.success('Status atualizado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api('/tecnicos', {
        method: 'POST',
        body: JSON.stringify({
          nome: data.nome,
          telefone: data.telefone || undefined,
          enderecoEntrega: data.enderecoEntrega || undefined,
          cidade: data.cidade || undefined,
          estado: data.estado || undefined,
          ativo: data.ativo,
          precos: {
            instalacaoComBloqueio: data.instalacaoComBloqueio / 100,
            instalacaoSemBloqueio: data.instalacaoSemBloqueio / 100,
            revisao: data.revisao / 100,
            retirada: data.retirada / 100,
            deslocamento: data.deslocamento / 100,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnicos'] })
      setOpenCreate(false)
      toast.success('Técnico criado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const updateFullMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      api(`/tecnicos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nome: data.nome,
          telefone: data.telefone || undefined,
          enderecoEntrega: data.enderecoEntrega || undefined,
          cidade: data.cidade || undefined,
          estado: data.estado || undefined,
          ativo: data.ativo,
          precos: {
            instalacaoComBloqueio: data.instalacaoComBloqueio / 100,
            instalacaoSemBloqueio: data.instalacaoSemBloqueio / 100,
            revisao: data.revisao / 100,
            retirada: data.retirada / 100,
            deslocamento: data.deslocamento / 100,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnicos'] })
      setEditingId(null)
      toast.success('Técnico atualizado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nome: '',
      telefone: '',
      enderecoEntrega: '',
      cidade: '',
      estado: '',
      ativo: true,
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    } as FormData,
  })

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nome: '',
      telefone: '',
      enderecoEntrega: '',
      cidade: '',
      estado: '',
      ativo: true,
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    } as FormData,
  })

  const estadoForMunicipios = openCreate ? form.watch('estado') : editingId ? editForm.watch('estado') : null
  const { data: ufs = [] } = useUFs()
  const { data: municipios = [] } = useMunicipios(estadoForMunicipios || null)

  function handleCreateSubmit(data: FormData) {
    createMutation.mutate(data)
  }

  function handleEditSubmit(data: FormData) {
    if (!editingId) return
    updateFullMutation.mutate({ id: editingId, data })
  }

  function openEdit(t: Tecnico) {
    editForm.reset({
      nome: t.nome,
      telefone: t.telefone ?? '',
      enderecoEntrega: t.enderecoEntrega ?? '',
      cidade: t.cidade ?? '',
      estado: t.estado ?? '',
      ativo: t.ativo,
      instalacaoComBloqueio: Math.round(toNum(t.precos?.instalacaoComBloqueio) * 100),
      instalacaoSemBloqueio: Math.round(toNum(t.precos?.instalacaoSemBloqueio) * 100),
      revisao: Math.round(toNum(t.precos?.revisao) * 100),
      retirada: Math.round(toNum(t.precos?.retirada) * 100),
      deslocamento: Math.round(toNum(t.precos?.deslocamento) * 100),
    })
    setEditingId(t.id)
  }

  function toggleStatus(t: Tecnico) {
    if (!canEdit) return
    updateMutation.mutate({
      id: t.id,
      data: { ativo: !t.ativo } as FormData,
    })
  }

  const PrecosFields = ({ control: _control }: { control: 'form' | 'editForm' }) => {
    const f = _control === 'form' ? form : editForm
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <Label>Instalação c/ bloqueio</Label>
          <Controller
            name="instalacaoComBloqueio"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Instalação s/ bloqueio</Label>
          <Controller
            name="instalacaoSemBloqueio"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Revisão</Label>
          <Controller
            name="revisao"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Retirada</Label>
          <Controller
            name="retirada"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Deslocamento</Label>
          <Controller
            name="deslocamento"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive font-medium">Erro ao carregar técnicos</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error instanceof Error ? error.message : 'Erro desconhecido.'}
        </p>
      </div>
    )
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Técnicos</h1>
          <p className="text-xs text-slate-500">Cobertura regional e gestão de prestadores</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Busca</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 w-64 pl-9"
                placeholder="Nome ou CPF/CNPJ..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Estado</Label>
            <Select value={filtroEstado} onValueChange={(v) => { setFiltroEstado(v); setPage(0) }}>
              <SelectTrigger className="h-9 w-24">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {ufs.map((uf) => (
                  <SelectItem key={uf.id} value={uf.sigla}>
                    {uf.sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Status</Label>
            <Select
              value={filtroStatus}
              onValueChange={(v: 'todos' | 'ativo' | 'inativo') => { setFiltroStatus(v); setPage(0) }}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <div className="flex flex-col">
              <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">&nbsp;</Label>
              <Button
                className="h-9 gap-2"
                onClick={() => setOpenCreate(true)}
              >
                <Plus className="h-4 w-4" />
                Novo Técnico
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Espaço para mapa futuro */}
        <section className="w-[40%] shrink-0 border-r border-slate-200 bg-slate-200" />

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                  <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nome</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Cidade/UF</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Telefone</TableHead>
                  <TableHead className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Valor Base (Inst.)</TableHead>
                  <TableHead className="px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                  <TableHead className="w-10 px-4 py-2" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((t) => {
                  const isExpanded = expandedId === t.id
                  const valorBase = toNum(t.precos?.instalacaoSemBloqueio)
                  return (
                    <Fragment key={t.id}>
                      <TableRow
                        key={t.id}
                        className="cursor-pointer border-slate-200 hover:bg-slate-50"
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      >
                        <TableCell className="px-4 py-3 text-sm font-semibold text-slate-800">{t.nome}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-slate-600">
                          {t.cidade && t.estado ? `${t.cidade} / ${t.estado}` : '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-slate-600">
                          {t.telefone ? formatarTelefone(t.telefone) : '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                          {formatReais(valorBase)}
                        </TableCell>
                        <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={t.ativo}
                              disabled={!canEdit}
                              onClick={() => toggleStatus(t)}
                              className={`relative h-5 w-10 cursor-pointer rounded-full transition-colors ${
                                t.ativo ? 'bg-emerald-500' : 'bg-slate-200'
                              } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                  t.ativo ? 'translate-x-5' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${t.id}-expanded`} className="bg-slate-50">
                          <TableCell colSpan={6} className="border-b border-slate-200 p-0">
                            <div className="bg-slate-100 p-6">
                              <div className="grid grid-cols-2 gap-8">
                                <div>
                                  <h4 className="mb-2 text-[10px] font-bold uppercase text-slate-500">Endereço Completo</h4>
                                  <p className="text-sm leading-relaxed text-slate-700">
                                    {t.enderecoEntrega || '-'}
                                    {t.enderecoEntrega && (t.cidade || t.estado) && (
                                      <>
                                        <br />
                                        {[t.cidade, t.estado].filter(Boolean).join(' - ')}
                                      </>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-end justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-auto px-3 py-1.5 text-[11px] uppercase"
                                    disabled
                                  >
                                    Visualizar Contrato
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-6">
                                <h4 className="mb-3 text-[10px] font-bold uppercase text-slate-500">Tabela de Custos Operacionais</h4>
                                <div className="grid grid-cols-5 gap-2">
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Inst. c/ Bloqueio</span>
                                    <span className="text-sm font-bold text-slate-800">{formatReais(toNum(t.precos?.instalacaoComBloqueio))}</span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Inst. s/ Bloqueio</span>
                                    <span className="text-sm font-bold text-slate-800">{formatReais(toNum(t.precos?.instalacaoSemBloqueio))}</span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Revisão</span>
                                    <span className="text-sm font-bold text-slate-800">{formatReais(toNum(t.precos?.revisao))}</span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Retirada</span>
                                    <span className="text-sm font-bold text-slate-800">{formatReais(toNum(t.precos?.retirada))}</span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Deslocamento (km)</span>
                                    <span className="text-sm font-bold text-slate-800">{formatReais(toNum(t.precos?.deslocamento))}</span>
                                  </div>
                                </div>
                              </div>
                              {canEdit && (
                                <div className="mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEdit(t)
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar Perfil
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex h-12 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-4">
            <span className="text-[11px] font-medium uppercase tracking-tight text-slate-500">
              Total de {filtered.length} técnico{filtered.length !== 1 ? 's' : ''} localizado{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-bold">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo técnico</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit as any)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...form.register('nome')} />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>Telefone</Label>
              <Controller
                name="telefone"
                control={form.control}
                render={({ field }) => (
                  <InputTelefone value={field.value ?? ''} onChange={(v) => field.onChange(v)} />
                )}
              />
            </div>
            <div>
              <Label>Endereço entrega</Label>
              <Input {...form.register('enderecoEntrega')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Estado (UF)</Label>
                <Controller
                  name="estado"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('cidade', '')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((uf) => (
                          <SelectItem key={uf.id} value={uf.sigla}>
                            {uf.sigla} - {uf.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Controller
                  name="cidade"
                  control={form.control}
                  render={({ field }) => (
                    <SelectCidade
                      municipios={municipios}
                      value={field.value || ''}
                      onChange={field.onChange}
                      disabled={!form.watch('estado')}
                      placeholder="Selecione a cidade"
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Tabela de preços</Label>
              <PrecosFields control="form" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo-create"
                checked={form.watch('ativo')}
                onChange={(e) => form.setValue('ativo', e.target.checked)}
              />
              <Label htmlFor="ativo-create">Ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingId} onOpenChange={(v) => !v && setEditingId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar técnico</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit as any)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...editForm.register('nome')} />
              {editForm.formState.errors.nome && (
                <p className="text-sm text-destructive">{editForm.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>Telefone</Label>
              <Controller
                name="telefone"
                control={editForm.control}
                render={({ field }) => (
                  <InputTelefone value={field.value ?? ''} onChange={(v) => field.onChange(v)} />
                )}
              />
            </div>
            <div>
              <Label>Endereço entrega</Label>
              <Input {...editForm.register('enderecoEntrega')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Estado (UF)</Label>
                <Controller
                  name="estado"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => {
                        field.onChange(v)
                        editForm.setValue('cidade', '')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((uf) => (
                          <SelectItem key={uf.id} value={uf.sigla}>
                            {uf.sigla} - {uf.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Controller
                  name="cidade"
                  control={editForm.control}
                  render={({ field }) => (
                    <SelectCidade
                      municipios={municipios}
                      value={field.value || ''}
                      onChange={field.onChange}
                      disabled={!editForm.watch('estado')}
                      placeholder="Selecione a cidade"
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Tabela de preços</Label>
              <PrecosFields control="editForm" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo-edit"
                checked={editForm.watch('ativo')}
                onChange={(e) => editForm.setValue('ativo', e.target.checked)}
              />
              <Label htmlFor="ativo-edit">Ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateFullMutation.isPending}>
                {updateFullMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
