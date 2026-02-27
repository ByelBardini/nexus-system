import { useState, useMemo, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Pencil,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  X,
  CheckCircle,
  Phone,
  Mail,
  User,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InputTelefone } from '@/components/InputTelefone'
import { InputCNPJ } from '@/components/InputCNPJ'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { formatarTelefone, formatarCNPJ } from '@/lib/format'
import { cn } from '@/lib/utils'

const contatoSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, 'Nome obrigatório'),
  celular: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
})

const schema = z.object({
  nome: z.string().min(1, 'Razão social obrigatória'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().optional(),
  tipoContrato: z.enum(['COMODATO', 'AQUISICAO']),
  estoqueProprio: z.boolean(),
  status: z.enum(['ATIVO', 'PENDENTE', 'INATIVO']),
  contatos: z.array(contatoSchema),
})

type FormData = z.infer<typeof schema>

interface Contato {
  id: number
  nome: string
  celular: string | null
  email: string | null
}

interface Cliente {
  id: number
  nome: string
  nomeFantasia: string | null
  cnpj: string | null
  tipoContrato: 'COMODATO' | 'AQUISICAO'
  estoqueProprio: boolean
  status: 'ATIVO' | 'PENDENTE' | 'INATIVO'
  contatos: Contato[]
  _count?: { ordensServico: number }
}

const PAGE_SIZE = 10

export function ClientesPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroTipoContrato, setFiltroTipoContrato] = useState<string>('todos')
  const [filtroEstoque, setFiltroEstoque] = useState<string>('todos')
  const [page, setPage] = useState(0)
  const canCreate = hasPermission('AGENDAMENTO.CLIENTE.CRIAR')
  const canEdit = hasPermission('AGENDAMENTO.CLIENTE.EDITAR')

  const {
    data: clientes = [],
    isLoading,
    isError,
    error,
  } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => api('/clientes'),
  })

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const matchBusca =
        !busca.trim() ||
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.nomeFantasia?.toLowerCase().includes(busca.toLowerCase()) ||
        c.cnpj?.includes(busca)
      const matchTipoContrato =
        filtroTipoContrato === 'todos' || c.tipoContrato === filtroTipoContrato
      const matchEstoque =
        filtroEstoque === 'todos' ||
        (filtroEstoque === 'proprio' && c.estoqueProprio) ||
        (filtroEstoque === 'terceiro' && !c.estoqueProprio)
      return matchBusca && matchTipoContrato && matchEstoque
    })
  }, [clientes, busca, filtroTipoContrato, filtroEstoque])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      nomeFantasia: '',
      cnpj: '',
      tipoContrato: 'COMODATO',
      estoqueProprio: false,
      status: 'ATIVO',
      contatos: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contatos',
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api('/clientes', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          contatos: data.contatos.map((c) => ({
            nome: c.nome,
            celular: c.celular || undefined,
            email: c.email || undefined,
          })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      closeModal()
      toast.success('Cliente criado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar cliente'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      api(`/clientes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          contatos: data.contatos.map((c) => ({
            id: c.id,
            nome: c.nome,
            celular: c.celular || undefined,
            email: c.email || undefined,
          })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      closeModal()
      toast.success('Cliente atualizado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar cliente'),
  })

  function openCreateModal() {
    setEditingCliente(null)
    form.reset({
      nome: '',
      nomeFantasia: '',
      cnpj: '',
      tipoContrato: 'COMODATO',
      estoqueProprio: false,
      status: 'ATIVO',
      contatos: [],
    })
    setModalOpen(true)
  }

  function openEditModal(c: Cliente) {
    setEditingCliente(c)
    form.reset({
      nome: c.nome,
      nomeFantasia: c.nomeFantasia ?? '',
      cnpj: c.cnpj ?? '',
      tipoContrato: c.tipoContrato,
      estoqueProprio: c.estoqueProprio,
      status: c.status,
      contatos: c.contatos.map((ct) => ({
        id: ct.id,
        nome: ct.nome,
        celular: ct.celular ?? '',
        email: ct.email ?? '',
      })),
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingCliente(null)
  }

  function handleSubmit(data: FormData) {
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  function addContato() {
    append({ nome: '', celular: '', email: '' })
  }

  const watchedValues = form.watch()

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
        <p className="text-destructive font-medium">Erro ao carregar clientes</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error instanceof Error ? error.message : 'Erro desconhecido.'}
        </p>
      </div>
    )
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const activeCount = clientes.filter((c) => c.status === 'ATIVO').length

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/configuracoes"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Clientes</h1>
            <p className="text-xs text-slate-500">Gestão de contatos e registros administrativos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Busca Cliente
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 w-64 pl-9"
                placeholder="Razão Social ou CNPJ..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Tipo Contrato
            </Label>
            <Select
              value={filtroTipoContrato}
              onValueChange={(v) => {
                setFiltroTipoContrato(v)
                setPage(0)
              }}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="COMODATO">Comodato</SelectItem>
                <SelectItem value="AQUISICAO">Aquisição</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Estoque
            </Label>
            <Select
              value={filtroEstoque}
              onValueChange={(v) => {
                setFiltroEstoque(v)
                setPage(0)
              }}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="proprio">Próprio</SelectItem>
                <SelectItem value="terceiro">Terceiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <div className="flex flex-col">
              <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                &nbsp;
              </Label>
              <Button className="h-9 gap-2" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden p-6">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col w-full h-full">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-100 hover:bg-slate-100">
                  <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-16">
                    ID
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Razão Social / Nome Fantasia
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    CNPJ
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                    Tipo Contrato
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                    Estoque Próprio
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                    Status
                  </TableHead>
                  <TableHead className="w-10 px-4 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => {
                  const isExpanded = expandedId === c.id
                  return (
                    <Fragment key={c.id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors',
                          isExpanded && 'bg-slate-50'
                        )}
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      >
                        <TableCell className="px-4 py-4 text-xs font-bold text-slate-400 text-center">
                          {String(c.id).padStart(4, '0')}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{c.nome}</span>
                            {c.nomeFantasia && (
                              <span className="text-[11px] text-slate-500">{c.nomeFantasia}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-slate-600 font-mono">
                          {c.cnpj ? formatarCNPJ(c.cnpj) : '-'}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                              c.tipoContrato === 'COMODATO'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                            )}
                          >
                            {c.tipoContrato === 'COMODATO' ? 'Comodato' : 'Aquisição'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          {c.estoqueProprio ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                c.status === 'ATIVO' && 'bg-emerald-500',
                                c.status === 'PENDENTE' && 'bg-amber-400',
                                c.status === 'INATIVO' && 'bg-slate-300'
                              )}
                            />
                            <span className="text-[10px] font-bold uppercase text-slate-600">
                              {c.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-slate-50">
                          <TableCell colSpan={7} className="border-b border-slate-200 p-0">
                            <div className="bg-slate-50 border-l-4 border-blue-600 p-6 mx-4 mb-4 mt-2 shadow-inner">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                  Meios de Contato
                                </h4>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    className="h-8 px-5 text-[11px] font-bold uppercase gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditModal(c)
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                  </Button>
                                )}
                              </div>
                              {c.contatos.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">
                                  Nenhum contato cadastrado
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {c.contatos.map((contato) => (
                                    <div
                                      key={contato.id}
                                      className="bg-white border border-slate-200 rounded p-3 flex flex-col gap-1.5 shadow-sm hover:border-slate-300 transition-colors"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                                          Nome
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                                          <User className="h-3 w-3 text-slate-400" />
                                          {contato.nome}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                                          Telefone
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                                          <Phone className="h-3 w-3 text-slate-400" />
                                          {contato.celular
                                            ? formatarTelefone(contato.celular)
                                            : <span className="italic text-slate-400 font-normal">Não informado</span>}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                                          E-mail
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                                          <Mail className="h-3 w-3 text-slate-400" />
                                          {contato.email || (
                                            <span className="italic text-slate-400 font-normal">
                                              Não informado
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
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

          <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-6">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                Total de {activeCount} registros ativos
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase font-bold">
                <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm"></span>{' '}
                Comodato
                <span className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded-sm ml-2"></span>{' '}
                Aquisição
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white w-full max-w-[900px] h-[90vh] flex flex-col shadow-2xl rounded-sm overflow-hidden border border-slate-300">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <p className="text-xs text-slate-500">
                  Cadastro de cliente para gestão de serviços
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <form
                id="cliente-form"
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30"
              >
                <section>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
                      01. Dados do Cliente
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Razão Social
                      </label>
                      <Input
                        {...form.register('nome')}
                        placeholder="Ex: Empresa ABC Ltda"
                        className="h-9"
                      />
                      {form.formState.errors.nome && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.nome.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nome Fantasia (opcional)
                      </label>
                      <Input
                        {...form.register('nomeFantasia')}
                        placeholder="Ex: Empresa ABC"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        CNPJ (opcional)
                      </label>
                      <Controller
                        name="cnpj"
                        control={form.control}
                        render={({ field }) => (
                          <InputCNPJ
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            className="h-9 font-mono"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Tipo Contrato
                      </label>
                      <Controller
                        name="tipoContrato"
                        control={form.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="COMODATO">Comodato</SelectItem>
                              <SelectItem value="AQUISICAO">Aquisição</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Status
                      </label>
                      <Controller
                        name="status"
                        control={form.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ATIVO">Ativo</SelectItem>
                              <SelectItem value="PENDENTE">Pendente</SelectItem>
                              <SelectItem value="INATIVO">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Estoque Próprio
                      </label>
                      <div className="flex items-center gap-3 h-9">
                        <Controller
                          name="estoqueProprio"
                          control={form.control}
                          render={({ field }) => (
                            <>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={field.value}
                                onClick={() => field.onChange(!field.value)}
                                className={cn(
                                  'relative h-5 w-10 cursor-pointer rounded-full transition-colors',
                                  field.value ? 'bg-emerald-500' : 'bg-slate-200'
                                )}
                              >
                                <span
                                  className={cn(
                                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                                    field.value && 'translate-x-5'
                                  )}
                                />
                              </button>
                              <span
                                className={cn(
                                  'text-xs font-bold',
                                  field.value ? 'text-emerald-600' : 'text-slate-500'
                                )}
                              >
                                {field.value ? 'SIM' : 'NÃO'}
                              </span>
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
                      02. Contatos
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] uppercase gap-1"
                      onClick={addContato}
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar Contato
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="bg-slate-100 border border-dashed border-slate-300 rounded p-6 text-center">
                      <p className="text-sm text-slate-500">Nenhum contato adicionado</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Clique em "Adicionar Contato" para incluir meios de contato
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="bg-white border border-slate-200 rounded p-4 relative"
                        >
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Nome
                              </label>
                              <Input
                                {...form.register(`contatos.${index}.nome`)}
                                placeholder="Nome do contato"
                                className="h-9"
                              />
                              {form.formState.errors.contatos?.[index]?.nome && (
                                <p className="text-xs text-red-500 mt-1">
                                  {form.formState.errors.contatos[index]?.nome?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Telefone
                              </label>
                              <Controller
                                name={`contatos.${index}.celular`}
                                control={form.control}
                                render={({ field }) => (
                                  <InputTelefone
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    className="h-9"
                                  />
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                E-mail
                              </label>
                              <Input
                                {...form.register(`contatos.${index}.email`)}
                                placeholder="email@empresa.com"
                                type="email"
                                className="h-9"
                              />
                              {form.formState.errors.contatos?.[index]?.email && (
                                <p className="text-xs text-red-500 mt-1">
                                  {form.formState.errors.contatos[index]?.email?.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </form>

              <div className="w-64 border-l border-slate-200 bg-slate-50 p-6 shrink-0 overflow-y-auto">
                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">
                  Resumo do Cliente
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Razão Social
                    </label>
                    <p className="text-sm font-bold text-slate-800 break-words">
                      {watchedValues.nome || '—'}
                    </p>
                  </div>
                  {watchedValues.nomeFantasia && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nome Fantasia
                      </label>
                      <p className="text-sm text-slate-700">{watchedValues.nomeFantasia}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Tipo Contrato
                    </label>
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                        watchedValues.tipoContrato === 'COMODATO'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      )}
                    >
                      {watchedValues.tipoContrato === 'COMODATO' ? 'Comodato' : 'Aquisição'}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                      Contatos
                    </label>
                    <p className="text-sm font-bold text-slate-700">
                      {watchedValues.contatos?.length || 0} contato(s)
                    </p>
                  </div>
                  <div className="mt-8 p-3 bg-blue-50 border border-blue-100 rounded-sm">
                    <p className="text-[10px] text-blue-700 leading-tight">
                      Os contatos cadastrados serão utilizados para comunicação sobre ordens de
                      serviço.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="px-6 uppercase text-sm font-bold"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="cliente-form"
                className="px-8 uppercase text-sm font-bold gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Salvar Cliente
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
