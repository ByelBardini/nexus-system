import { useState, useEffect, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const SETORES_USUARIO = [
  { value: 'AGENDAMENTO', label: 'Agendamento' },
  { value: 'CONFIGURACAO', label: 'Configuração' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
] as const

type SetorUsuario = typeof SETORES_USUARIO[number]['value']

const schemaCreate = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  ativo: z.boolean(),
  setor: z.string().nullable().optional(),
  cargoIds: z.array(z.number()),
})

const schemaEdit = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  ativo: z.boolean(),
  setor: z.string().nullable().optional(),
})

type FormCreate = z.infer<typeof schemaCreate>
type FormEdit = z.infer<typeof schemaEdit>

interface CargoWithPermissions {
  id: number
  code: string
  nome: string
  categoria: string
  setor: { id: number; code: string; nome: string }
  cargoPermissoes: { permissao: { id: number; code: string } }[]
}

interface PermissoesPorModulo {
  modulo: string
  acoes: string[]
}

function calcularPermissoesHerdadas(
  selectedCargoIds: number[],
  cargos: CargoWithPermissions[]
): { setoresHabilitados: PermissoesPorModulo[]; acoesAltoRisco: { modulo: string; permissao: string }[] } {
  const cargosSelecionados = cargos.filter((c) => selectedCargoIds.includes(c.id))
  const permissoesMap = new Map<string, Set<string>>()
  const acoesAltoRisco: { modulo: string; permissao: string }[] = []

  for (const cargo of cargosSelecionados) {
    for (const cp of cargo.cargoPermissoes) {
      const parts = cp.permissao.code.split('.')
      if (parts.length >= 3) {
        const [setor, modulo, acao] = parts
        const moduloKey = `${setor}.${modulo}`
        
        if (!permissoesMap.has(moduloKey)) {
          permissoesMap.set(moduloKey, new Set())
        }
        permissoesMap.get(moduloKey)!.add(acao)

        if (acao === 'EXCLUIR') {
          const jaExiste = acoesAltoRisco.some((a) => a.permissao === cp.permissao.code)
          if (!jaExiste) {
            acoesAltoRisco.push({ modulo: moduloKey, permissao: cp.permissao.code })
          }
        }
      }
    }
  }

  const setoresHabilitados: PermissoesPorModulo[] = []
  for (const [modulo, acoes] of permissoesMap) {
    setoresHabilitados.push({ modulo, acoes: Array.from(acoes) })
  }

  return { setoresHabilitados, acoesAltoRisco }
}

function getModuloLabel(modulo: string): string {
  const labels: Record<string, string> = {
    'ADMINISTRATIVO.USUARIO': 'Usuários',
    'ADMINISTRATIVO.CARGO': 'Cargos',
    'CONFIGURACAO.APARELHO': 'Aparelhos',
    'AGENDAMENTO.CLIENTE': 'Clientes',
    'AGENDAMENTO.TECNICO': 'Técnicos',
    'AGENDAMENTO.OS': 'Ordens de Serviço',
  }
  return labels[modulo] ?? modulo
}

function getAcaoLabel(acao: string): string {
  const labels: Record<string, string> = {
    LISTAR: 'Visualizar',
    CRIAR: 'Criar',
    EDITAR: 'Editar',
    EXCLUIR: 'Excluir',
  }
  return labels[acao] ?? acao
}

interface Permission {
  id: number
  code: string
}

interface User {
  id: number
  nome: string
  email: string
  ativo: boolean
  setor?: SetorUsuario | null
  createdAt: string
  ultimoAcesso?: string | null
  usuarioCargos?: { cargo: { id: number; nome: string; categoria: string; cargoPermissoes: { permissaoId: number }[] } }[]
}

interface PaginatedResponse {
  data: User[]
  total: number
  page: number
  totalPages: number
}

const CATEGORIA_CONFIG: Record<string, { label: string; className: string }> = {
  OPERACIONAL: {
    label: 'Operacional',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  ADMINISTRATIVO: {
    label: 'Administrativo',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  GESTAO: {
    label: 'Gestão',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
}

function getSetorLabel(setor?: SetorUsuario | null): string {
  if (!setor) return ''
  const found = SETORES_USUARIO.find((s) => s.value === setor)
  return found?.label ?? setor
}

function getInitials(nome: string) {
  const parts = nome.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return nome.substring(0, 2).toUpperCase()
}

function getAccessLevel(user: User, totalPermissions: number): { percent: number; label: string; color: string; barColor: string } {
  if (!user.usuarioCargos || user.usuarioCargos.length === 0 || totalPermissions === 0) {
    return { percent: 0, label: 'Nenhum', color: 'text-slate-400', barColor: 'bg-slate-300' }
  }

  const uniquePermIds = new Set<number>()
  for (const uc of user.usuarioCargos) {
    for (const cp of uc.cargo.cargoPermissoes) {
      uniquePermIds.add(cp.permissaoId)
    }
  }

  const percent = Math.round((uniquePermIds.size / totalPermissions) * 100)

  if (percent <= 25) {
    return { percent, label: 'Baixo', color: 'text-emerald-600', barColor: 'bg-emerald-500' }
  }
  if (percent <= 50) {
    return { percent, label: 'Médio', color: 'text-amber-600', barColor: 'bg-amber-500' }
  }
  if (percent <= 75) {
    return { percent, label: 'Alto', color: 'text-orange-600', barColor: 'bg-orange-500' }
  }
  return { percent, label: 'Total', color: 'text-red-600', barColor: 'bg-red-500' }
}

function formatLastLogin(dateStr?: string | null): string {
  if (!dateStr) return 'Nunca acessou'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diffDays === 1) {
    return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diffDays < 7) {
    return `${diffDays} dias atrás`
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function UsuariosPage() {
  const queryClient = useQueryClient()
  const { hasPermission, user: currentUser } = useAuth()
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('TODOS')
  const [page, setPage] = useState(1)
  const [showCreateRoleSelector, setShowCreateRoleSelector] = useState(false)
  const [showEditRoleSelector, setShowEditRoleSelector] = useState(false)
  const canCreate = hasPermission('ADMINISTRATIVO.USUARIO.CRIAR')
  const canEdit = hasPermission('ADMINISTRATIVO.USUARIO.EDITAR')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  const { data: response, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['users-paginated', debouncedSearch, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter && statusFilter !== 'TODOS') params.set('ativo', statusFilter === 'ATIVOS' ? 'true' : 'false')
      params.set('page', String(page))
      params.set('limit', '15')
      return api(`/users/paginated?${params.toString()}`)
    },
  })

  const { data: permissoes = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api('/roles/permissions'),
  })

  const { data: cargosComPermissoes = [] } = useQuery<CargoWithPermissions[]>({
    queryKey: ['roles-with-permissions'],
    queryFn: () => api('/roles?includePermissions=true'),
    enabled: openCreate || !!editingId,
  })

  const [selectedCreateRoleIds, setSelectedCreateRoleIds] = useState<number[]>([])

  const createMutation = useMutation({
    mutationFn: async (data: FormCreate) => {
      const user: { id: number } = await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          password: '#Infinity123',
          ativo: data.ativo,
          setor: data.setor,
        }),
      })
      if (data.cargoIds.length > 0) {
        await api(`/roles/users/${user.id}/roles`, {
          method: 'PATCH',
          body: JSON.stringify({ roleIds: data.cargoIds }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-paginated'] })
      setOpenCreate(false)
      createForm.reset()
      setSelectedCreateRoleIds([])
      toast.success('Usuário criado com senha padrão')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, roleIds }: { id: number; data: FormEdit; roleIds: number[] }) => {
      await api(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      await api(`/roles/users/${id}/roles`, {
        method: 'PATCH',
        body: JSON.stringify({ roleIds }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-paginated'] })
      setEditingId(null)
      toast.success('Usuário atualizado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
      await api(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-paginated'] })
      toast.success('Status atualizado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      await api(`/users/${id}/reset-password`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      toast.success('Senha resetada para: #Infinity123')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao resetar senha'),
  })

  const createForm = useForm<FormCreate>({
    resolver: zodResolver(schemaCreate),
    defaultValues: { nome: '', email: '', ativo: true, setor: null, cargoIds: [] },
  })

  const editForm = useForm<FormEdit>({
    resolver: zodResolver(schemaEdit),
    defaultValues: { nome: '', email: '', ativo: true, setor: null },
  })

  function handleCreateSubmit(data: FormCreate) {
    createMutation.mutate({ ...data, cargoIds: selectedCreateRoleIds })
  }

  function handleEditSubmit(data: FormEdit) {
    if (!editingId) return
    updateMutation.mutate({ id: editingId, data, roleIds: selectedRoleIds })
  }

  function openEdit(usuario: User) {
    editForm.reset({
      nome: usuario.nome,
      email: usuario.email,
      ativo: usuario.ativo,
      setor: usuario.setor ?? null,
    })
    setSelectedRoleIds(usuario.usuarioCargos?.map((uc) => uc.cargo.id) ?? [])
    setEditingId(usuario.id)
  }

  function toggleRole(roleId: number) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  function toggleCreateRole(roleId: number) {
    setSelectedCreateRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const cargosPorSetor = cargosComPermissoes.reduce<Record<string, CargoWithPermissions[]>>((acc, c) => {
    const key = c.setor.nome
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const permissoesCreatePreview = calcularPermissoesHerdadas(selectedCreateRoleIds, cargosComPermissoes)
  const permissoesEditPreview = calcularPermissoesHerdadas(selectedRoleIds, cargosComPermissoes)

  const createAccessScore = permissoes.length > 0
    ? Math.round((selectedCreateRoleIds.length > 0
        ? cargosComPermissoes
            .filter((c) => selectedCreateRoleIds.includes(c.id))
            .flatMap((c) => c.cargoPermissoes.map((cp) => cp.permissao.id))
            .filter((v, i, a) => a.indexOf(v) === i).length
        : 0) / permissoes.length * 100)
    : 0

  const editAccessScore = permissoes.length > 0
    ? Math.round((selectedRoleIds.length > 0
        ? cargosComPermissoes
            .filter((c) => selectedRoleIds.includes(c.id))
            .flatMap((c) => c.cargoPermissoes.map((cp) => cp.permissao.id))
            .filter((v, i, a) => a.indexOf(v) === i).length
        : 0) / permissoes.length * 100)
    : 0

  const users = response?.data ?? []
  const totalUsers = response?.total ?? 0
  const totalPages = response?.totalPages ?? 1
  const activeCount = users.filter((u) => u.ativo).length
  const inactiveCount = users.filter((u) => !u.ativo).length
  const totalPermissions = permissoes.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      {/* Header */}
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/configuracoes"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Usuários & Segurança</h1>
            <p className="text-xs text-slate-500">Controle de acesso e gestão de usuários do sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Buscar usuário</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 w-64 h-9"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ATIVOS">Ativos</SelectItem>
                <SelectItem value="INATIVOS">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <div className="flex flex-col">
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1 opacity-0">Ação</Label>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm"
                onClick={() => setOpenCreate(true)}
              >
                <MaterialIcon name="person_add" className="text-lg mr-2" />
                Novo Usuário
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white min-h-0">
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 w-8"></th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Usuário / Identificação
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Setor
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Cargo(s) Atribuídos
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Último Acesso
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Nível de Acesso
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isExpanded = expandedId === user.id
                const isInactive = !user.ativo
                const accessLevel = getAccessLevel(user, totalPermissions)

                return (
                  <Fragment key={user.id}>
                    <tr
                      className={cn(
                        'border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer',
                        isExpanded && 'border-l-4 border-l-blue-600 bg-white',
                        isInactive && 'bg-slate-50'
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : user.id)}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('flex items-center gap-3', isInactive && 'opacity-50')}>
                          <div className={cn(
                            'w-8 h-8 rounded-sm flex items-center justify-center font-bold text-[10px] border',
                            isInactive
                              ? 'bg-slate-200 text-slate-400 border-slate-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {getInitials(user.nome)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{user.nome}</span>
                            <span className="text-[10px] text-slate-500">
                              ID: {String(user.id).padStart(5, '0')} • {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('flex flex-wrap gap-1', isInactive && 'opacity-50')}>
                          {user.setor ? (
                            <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {getSetorLabel(user.setor)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sem setor</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('flex flex-wrap gap-1', isInactive && 'opacity-50 grayscale')}>
                          {user.usuarioCargos && user.usuarioCargos.length > 0 ? (
                            user.usuarioCargos.map((uc) => {
                              const config = CATEGORIA_CONFIG[uc.cargo.categoria] || CATEGORIA_CONFIG.OPERACIONAL
                              return (
                                <span
                                  key={uc.cargo.id}
                                  className={cn(
                                    'px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border flex items-center gap-1.5',
                                    config.className
                                  )}
                                  title={`Categoria: ${config.label}`}
                                >
                                  {uc.cargo.nome}
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sem cargo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatLastLogin(user.ultimoAcesso)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full transition-all', accessLevel.barColor)}
                              style={{ width: `${accessLevel.percent}%` }}
                            />
                          </div>
                          <span className={cn('text-[10px] font-bold uppercase', accessLevel.color)}>
                            {accessLevel.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.ativo ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase border border-emerald-200">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold uppercase border border-slate-200">
                            Inativo
                          </span>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 shadow-inner">
                            <div className="grid grid-cols-12 gap-6">
                              {/* Audit Trail & Security */}
                              <div className="col-span-5 border-r border-slate-200 pr-6">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                  <MaterialIcon name="security_update_good" className="text-sm" />
                                  Audit Trail & Segurança
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Data de cadastro</span>
                                    <span className="font-bold text-slate-700">
                                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Último acesso</span>
                                    <span className={cn(
                                      'font-bold',
                                      user.ultimoAcesso ? 'text-slate-700' : 'text-amber-600'
                                    )}>
                                      {formatLastLogin(user.ultimoAcesso)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-500">Permissões ativas</span>
                                    <span className="font-bold text-blue-600">
                                      {accessLevel.percent}% ({Math.round(accessLevel.percent * totalPermissions / 100)} de {totalPermissions})
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Cargos Vinculados */}
                              <div className="col-span-4 border-r border-slate-200 pr-6">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                  <MaterialIcon name="badge" className="text-sm" />
                                  Cargos Vinculados
                                </h4>
                                <div className="space-y-1">
                                  {user.usuarioCargos && user.usuarioCargos.length > 0 ? (
                                    user.usuarioCargos.map((uc) => {
                                      const config = CATEGORIA_CONFIG[uc.cargo.categoria] || CATEGORIA_CONFIG.OPERACIONAL
                                      return (
                                        <div key={uc.cargo.id} className="flex items-center gap-2 text-[10px] text-slate-600">
                                          <MaterialIcon name="check_circle" className="text-xs text-emerald-500" />
                                          <span className="font-medium">{uc.cargo.nome}</span>
                                          <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-bold uppercase', config.className)}>
                                            {config.label}
                                          </span>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <div className="text-[10px] text-slate-400 italic">
                                      Nenhum cargo vinculado
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Ações Rápidas */}
                              <div className="col-span-3 flex flex-col justify-center gap-2">
                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => resetPasswordMutation.mutate(user.id)}
                                      disabled={resetPasswordMutation.isPending}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-colors border bg-white text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                      <MaterialIcon name="lock_reset" className="text-base" />
                                      Resetar Senha
                                    </button>
                                    <button
                                      onClick={() => openEdit(user)}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-colors border bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    >
                                      <MaterialIcon name="edit" className="text-base" />
                                      Editar Usuário
                                    </button>
                                    {currentUser?.id !== user.id && (
                                      <button
                                        onClick={() => toggleStatusMutation.mutate({ id: user.id, ativo: !user.ativo })}
                                        className={cn(
                                          'flex items-center gap-1 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-colors border',
                                          user.ativo
                                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        )}
                                      >
                                        <MaterialIcon name={user.ativo ? 'person_off' : 'person'} className="text-base" />
                                        {user.ativo ? 'Inativar Usuário' : 'Ativar Usuário'}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
              Total de {totalUsers} usuários cadastrados
            </span>
            <div className="flex items-center gap-4 text-[9px] text-slate-400 uppercase font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" /> {activeCount} Ativos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full" /> {inactiveCount} Inativos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-sm border border-slate-300 text-slate-400 bg-white hover:bg-slate-50 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <MaterialIcon name="chevron_left" className="text-base" />
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-sm border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <MaterialIcon name="chevron_right" className="text-base" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar - Design Industrial */}
      <Dialog open={openCreate} onOpenChange={(open) => {
        setOpenCreate(open)
        if (!open) {
          createForm.reset()
          setSelectedCreateRoleIds([])
          setShowCreateRoleSelector(false)
        }
      }}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <div className="h-16 border-b border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-4">
              <MaterialIcon name="person_add" className="text-blue-600 text-xl" />
              <span className="text-base font-bold text-slate-800 uppercase tracking-tight">
                Configuração de Novo Usuário
              </span>
              <div className="h-5 w-px bg-slate-200 mx-3" />
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                <span className="w-6 h-6 rounded-full border-2 border-blue-600 flex items-center justify-center text-[10px]">01</span>
                Identidade & Acesso
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="flex-1 overflow-y-auto px-12 py-10">
              <div className="max-w-2xl mx-auto space-y-10">
                {/* Dados Cadastrais */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    Dados Cadastrais
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome Completo</Label>
                      <Input {...createForm.register('nome')} placeholder="Ex: Ricardo Cavalcanti" className="h-11 text-sm" />
                      {createForm.formState.errors.nome && (
                        <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.nome.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Setor</Label>
                      <Controller
                        name="setor"
                        control={createForm.control}
                        render={({ field }) => (
                          <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                            <SelectTrigger className="h-11 text-sm">
                              <SelectValue placeholder="Selecione um setor" />
                            </SelectTrigger>
                            <SelectContent>
                              {SETORES_USUARIO.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">E-mail Corporativo</Label>
                      <Input type="email" {...createForm.register('email')} placeholder="usuario@empresa.com.br" className="h-11 text-sm" />
                      {createForm.formState.errors.email && (
                        <p className="text-xs text-red-500 mt-1">{createForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Atribuição de Cargos */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    Atribuição de Cargos
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Cargos Selecionados</Label>
                      <div className="border border-slate-300 p-4 min-h-[52px] flex flex-wrap gap-2 items-center bg-white rounded">
                        {selectedCreateRoleIds.length === 0 ? (
                          <span className="text-sm text-slate-400 italic">Nenhum cargo selecionado</span>
                        ) : (
                          selectedCreateRoleIds.map((roleId) => {
                            const cargo = cargosComPermissoes.find((c) => c.id === roleId)
                            if (!cargo) return null
                            const catConfig = CATEGORIA_CONFIG[cargo.categoria] ?? { label: cargo.categoria, className: 'bg-slate-50 text-slate-700 border-slate-200' }
                            return (
                              <span key={roleId} className={cn('px-3 py-1 rounded text-xs font-bold uppercase border flex items-center gap-2', catConfig.className)}>
                                {cargo.nome}
                                <button type="button" onClick={() => toggleCreateRole(roleId)} className="hover:opacity-70">
                                  <MaterialIcon name="close" className="text-sm" />
                                </button>
                              </span>
                            )
                          })
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400 italic">As permissões serão herdadas automaticamente com base nos cargos selecionados.</p>
                    </div>
                    
                    {/* Botão para abrir seletor de cargos */}
                    <button
                      type="button"
                      onClick={() => setShowCreateRoleSelector(!showCreateRoleSelector)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-600">
                        {showCreateRoleSelector ? 'Fechar seleção de cargos' : 'Selecionar cargos'}
                      </span>
                      <MaterialIcon name={showCreateRoleSelector ? 'expand_less' : 'expand_more'} className="text-slate-400" />
                    </button>
                    
                    {/* Lista de cargos expansível */}
                    {showCreateRoleSelector && (
                      <div className="space-y-4 border border-slate-200 rounded p-4 bg-slate-50 max-h-64 overflow-y-auto">
                        {Object.entries(cargosPorSetor).map(([setorNome, setorCargos]) => (
                          <div key={setorNome}>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">{setorNome}</p>
                            <div className="flex flex-wrap gap-2">
                              {setorCargos.map((cargo) => {
                                const isSelected = selectedCreateRoleIds.includes(cargo.id)
                                const catConfig = CATEGORIA_CONFIG[cargo.categoria] ?? { label: cargo.categoria, className: 'bg-slate-50 text-slate-700 border-slate-200' }
                                return (
                                  <button
                                    key={cargo.id}
                                    type="button"
                                    onClick={() => toggleCreateRole(cargo.id)}
                                    className={cn(
                                      'px-3 py-1.5 rounded text-xs font-bold uppercase border transition-all',
                                      isSelected
                                        ? cn(catConfig.className, 'ring-2 ring-blue-500 ring-offset-1')
                                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                    )}
                                  >
                                    {cargo.nome}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        {Object.keys(cargosPorSetor).length === 0 && (
                          <p className="text-sm text-slate-400 italic">Carregando cargos...</p>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Protocolos de Segurança */}
                <section className="bg-slate-50 p-5 border border-slate-200 rounded">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <MaterialIcon name="security" className="text-base" />
                    Protocolos de Segurança
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-not-allowed">
                      <Checkbox checked disabled className="w-5 h-5" />
                      <span className="text-sm font-medium text-slate-700">
                        Forçar reset de senha no primeiro login <span className="text-slate-400">(Obrigatório)</span>
                      </span>
                    </label>
                    <p className="text-xs text-slate-400 italic ml-8">
                      A senha inicial será <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">#Infinity123</code> e o usuário deverá alterá-la no primeiro acesso.
                    </p>
                  </div>
                </section>

              </div>
            </form>

            {/* Sidebar de Resumo */}
            <aside className="w-96 bg-slate-50 border-l border-slate-200 flex flex-col h-full">
              <div className="p-6 border-b border-slate-200 bg-slate-100/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumo de Herança</h4>
                <p className="text-[11px] text-slate-400 mt-1">Permissões efetivas calculadas em tempo real</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* Setores Habilitados */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-4">Setores Habilitados</span>
                    <div className="space-y-3">
                      {permissoesCreatePreview.setoresHabilitados.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Selecione cargos para ver as permissões</p>
                      ) : (
                        permissoesCreatePreview.setoresHabilitados.map((setor) => (
                          <div key={setor.modulo} className="flex items-start gap-3">
                            <MaterialIcon name="check_circle" className="text-emerald-500 text-base mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{getModuloLabel(setor.modulo)}</span>
                              <span className="text-[11px] text-slate-500">
                                {setor.acoes.map(getAcaoLabel).join(', ')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ações de Alto Risco */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-4">Ações de Alto Risco</span>
                    <div className="space-y-3">
                      {permissoesCreatePreview.acoesAltoRisco.length === 0 ? (
                        <div className="flex items-start gap-3">
                          <MaterialIcon name="check_circle" className="text-emerald-500 text-base" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">Nenhuma permissão de exclusão</span>
                            <span className="text-[11px] text-slate-500 italic">Usuário sem ações destrutivas</span>
                          </div>
                        </div>
                      ) : (
                        permissoesCreatePreview.acoesAltoRisco.map((acao) => (
                          <div key={acao.permissao} className="flex items-start gap-3">
                            <MaterialIcon name="warning" className="text-amber-500 text-base mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">Excluir {getModuloLabel(acao.modulo)}</span>
                              <span className="text-[11px] text-slate-500">Acesso via cargos selecionados</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score de Acesso */}
              <div className="p-6 bg-slate-800 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Score de Acesso</span>
                  <span className={cn(
                    'text-sm font-bold',
                    createAccessScore <= 25 ? 'text-emerald-400' :
                    createAccessScore <= 50 ? 'text-amber-400' :
                    createAccessScore <= 75 ? 'text-orange-400' : 'text-red-400'
                  )}>
                    {createAccessScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      createAccessScore <= 25 ? 'bg-emerald-500' :
                      createAccessScore <= 50 ? 'bg-amber-500' :
                      createAccessScore <= 75 ? 'bg-orange-500' : 'bg-red-500'
                    )}
                    style={{ width: `${createAccessScore}%` }}
                  />
                </div>
              </div>
            </aside>
          </div>

          <div className="h-20 border-t border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white">
            <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)} className="text-sm font-bold text-slate-500 uppercase hover:text-slate-700">
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={createForm.handleSubmit(handleCreateSubmit)}
              disabled={createMutation.isPending}
              className="px-8 py-3 bg-blue-600 text-white text-sm font-bold uppercase hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MaterialIcon name="verified_user" className="text-base" />
              {createMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar - Design Industrial */}
      <Dialog open={!!editingId} onOpenChange={(v) => {
        if (!v) {
          setEditingId(null)
          setShowEditRoleSelector(false)
        }
      }}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <div className="h-16 border-b border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-4">
              <MaterialIcon name="edit" className="text-blue-600 text-xl" />
              <span className="text-base font-bold text-slate-800 uppercase tracking-tight">
                Editar Usuário
              </span>
              <div className="h-5 w-px bg-slate-200 mx-3" />
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                <span className="w-6 h-6 rounded-full border-2 border-blue-600 flex items-center justify-center text-[10px]">01</span>
                Identidade & Acesso
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="flex-1 overflow-y-auto px-12 py-10">
              <div className="max-w-2xl mx-auto space-y-10">
                {/* Dados Cadastrais */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    Dados Cadastrais
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome Completo</Label>
                      <Input {...editForm.register('nome')} placeholder="Ex: Ricardo Cavalcanti" className="h-11 text-sm" />
                      {editForm.formState.errors.nome && (
                        <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.nome.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Setor</Label>
                      <Controller
                        name="setor"
                        control={editForm.control}
                        render={({ field }) => (
                          <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                            <SelectTrigger className="h-11 text-sm">
                              <SelectValue placeholder="Selecione um setor" />
                            </SelectTrigger>
                            <SelectContent>
                              {SETORES_USUARIO.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">E-mail Corporativo</Label>
                      <Input type="email" {...editForm.register('email')} placeholder="usuario@empresa.com.br" className="h-11 text-sm" />
                      {editForm.formState.errors.email && (
                        <p className="text-xs text-red-500 mt-1">{editForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Atribuição de Cargos */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    Atribuição de Cargos
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Cargos Vinculados</Label>
                      <div className="border border-slate-300 p-4 min-h-[52px] flex flex-wrap gap-2 items-center bg-white rounded">
                        {selectedRoleIds.length === 0 ? (
                          <span className="text-sm text-slate-400 italic">Nenhum cargo selecionado</span>
                        ) : (
                          selectedRoleIds.map((roleId) => {
                            const cargo = cargosComPermissoes.find((c) => c.id === roleId)
                            if (!cargo) return null
                            const catConfig = CATEGORIA_CONFIG[cargo.categoria] ?? { label: cargo.categoria, className: 'bg-slate-50 text-slate-700 border-slate-200' }
                            return (
                              <span key={roleId} className={cn('px-3 py-1 rounded text-xs font-bold uppercase border flex items-center gap-2', catConfig.className)}>
                                {cargo.nome}
                                <button type="button" onClick={() => toggleRole(roleId)} className="hover:opacity-70">
                                  <MaterialIcon name="close" className="text-sm" />
                                </button>
                              </span>
                            )
                          })
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400 italic">As permissões serão herdadas automaticamente com base nos cargos selecionados.</p>
                    </div>
                    
                    {/* Botão para abrir seletor de cargos */}
                    <button
                      type="button"
                      onClick={() => setShowEditRoleSelector(!showEditRoleSelector)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-600">
                        {showEditRoleSelector ? 'Fechar seleção de cargos' : 'Selecionar cargos'}
                      </span>
                      <MaterialIcon name={showEditRoleSelector ? 'expand_less' : 'expand_more'} className="text-slate-400" />
                    </button>
                    
                    {/* Lista de cargos expansível */}
                    {showEditRoleSelector && (
                      <div className="space-y-4 border border-slate-200 rounded p-4 bg-slate-50 max-h-64 overflow-y-auto">
                        {Object.entries(cargosPorSetor).map(([setorNome, setorCargos]) => (
                          <div key={setorNome}>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">{setorNome}</p>
                            <div className="flex flex-wrap gap-2">
                              {setorCargos.map((cargo) => {
                                const isSelected = selectedRoleIds.includes(cargo.id)
                                const catConfig = CATEGORIA_CONFIG[cargo.categoria] ?? { label: cargo.categoria, className: 'bg-slate-50 text-slate-700 border-slate-200' }
                                return (
                                  <button
                                    key={cargo.id}
                                    type="button"
                                    onClick={() => toggleRole(cargo.id)}
                                    className={cn(
                                      'px-3 py-1.5 rounded text-xs font-bold uppercase border transition-all',
                                      isSelected
                                        ? cn(catConfig.className, 'ring-2 ring-blue-500 ring-offset-1')
                                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                    )}
                                  >
                                    {cargo.nome}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        {Object.keys(cargosPorSetor).length === 0 && (
                          <p className="text-sm text-slate-400 italic">Carregando cargos...</p>
                        )}
                      </div>
                    )}
                  </div>
                </section>

              </div>
            </form>

            {/* Sidebar de Resumo */}
            <aside className="w-96 bg-slate-50 border-l border-slate-200 flex flex-col h-full">
              <div className="p-6 border-b border-slate-200 bg-slate-100/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumo de Herança</h4>
                <p className="text-[11px] text-slate-400 mt-1">Permissões efetivas calculadas em tempo real</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* Setores Habilitados */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-4">Setores Habilitados</span>
                    <div className="space-y-3">
                      {permissoesEditPreview.setoresHabilitados.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Selecione cargos para ver as permissões</p>
                      ) : (
                        permissoesEditPreview.setoresHabilitados.map((setor) => (
                          <div key={setor.modulo} className="flex items-start gap-3">
                            <MaterialIcon name="check_circle" className="text-emerald-500 text-base mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{getModuloLabel(setor.modulo)}</span>
                              <span className="text-[11px] text-slate-500">
                                {setor.acoes.map(getAcaoLabel).join(', ')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ações de Alto Risco */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-4">Ações de Alto Risco</span>
                    <div className="space-y-3">
                      {permissoesEditPreview.acoesAltoRisco.length === 0 ? (
                        <div className="flex items-start gap-3">
                          <MaterialIcon name="check_circle" className="text-emerald-500 text-base" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">Nenhuma permissão de exclusão</span>
                            <span className="text-[11px] text-slate-500 italic">Usuário sem ações destrutivas</span>
                          </div>
                        </div>
                      ) : (
                        permissoesEditPreview.acoesAltoRisco.map((acao) => (
                          <div key={acao.permissao} className="flex items-start gap-3">
                            <MaterialIcon name="warning" className="text-amber-500 text-base mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">Excluir {getModuloLabel(acao.modulo)}</span>
                              <span className="text-[11px] text-slate-500">Acesso via cargos selecionados</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score de Acesso */}
              <div className="p-6 bg-slate-800 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Score de Acesso</span>
                  <span className={cn(
                    'text-sm font-bold',
                    editAccessScore <= 25 ? 'text-emerald-400' :
                    editAccessScore <= 50 ? 'text-amber-400' :
                    editAccessScore <= 75 ? 'text-orange-400' : 'text-red-400'
                  )}>
                    {editAccessScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      editAccessScore <= 25 ? 'bg-emerald-500' :
                      editAccessScore <= 50 ? 'bg-amber-500' :
                      editAccessScore <= 75 ? 'bg-orange-500' : 'bg-red-500'
                    )}
                    style={{ width: `${editAccessScore}%` }}
                  />
                </div>
              </div>
            </aside>
          </div>

          <div className="h-20 border-t border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white">
            <Button type="button" variant="ghost" onClick={() => setEditingId(null)} className="text-sm font-bold text-slate-500 uppercase hover:text-slate-700">
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={editForm.handleSubmit(handleEditSubmit)}
              disabled={updateMutation.isPending}
              className="px-8 py-3 bg-blue-600 text-white text-sm font-bold uppercase hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MaterialIcon name="verified_user" className="text-base" />
              {updateMutation.isPending ? 'Salvando...' : 'Confirmar Edição'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
