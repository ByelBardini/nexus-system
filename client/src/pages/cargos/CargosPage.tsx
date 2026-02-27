import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, MoreVertical, Search, ChevronDown, ChevronRight, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

function PermissionCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'w-6 h-6 rounded flex items-center justify-center transition-all border-2',
        checked
          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
          : 'bg-white border-slate-300 hover:border-slate-400'
      )}
    >
      {checked && <Check className="w-4 h-4 stroke-[3]" />}
    </button>
  )
}

function SectorCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-5 h-5 rounded flex items-center justify-center transition-all border-2',
        checked
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
          : 'bg-white border-slate-300 hover:border-slate-400'
      )}
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </button>
  )
}

type CategoriaCargo = 'OPERACIONAL' | 'ADMINISTRATIVO' | 'GESTAO'

interface Permission {
  id: number
  code: string
}

interface Setor {
  id: number
  code: string
  nome: string
}

interface Cargo {
  id: number
  code: string
  nome: string
  descricao: string | null
  categoria: CategoriaCargo
  ativo: boolean
  setor: Setor
  usuariosVinculados: number
  cargoPermissoes: { permissaoId: number }[]
}

interface PaginatedResponse {
  data: Cargo[]
  total: number
  page: number
  totalPages: number
}

const CATEGORIA_CONFIG: Record<CategoriaCargo, { label: string; className: string; dotColor: string }> = {
  OPERACIONAL: {
    label: 'Operacional',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  ADMINISTRATIVO: {
    label: 'Administrativo',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  GESTAO: {
    label: 'Gestão',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
  },
}

const NOMES_SETOR: Record<string, string> = {
  CONFIG: 'Administrativo',
  AGENDAMENTO: 'Agendamento & Ordens',
}

const NOMES_ITEM: Record<string, string> = {
  CARGO: 'Cargos',
  USUARIO: 'Usuários',
  CLIENTE: 'Clientes',
  OS: 'Ordens de Serviço',
  TECNICO: 'Técnicos',
}

const NOMES_ACAO: Record<string, string> = {
  LISTAR: 'Visualizar',
  CRIAR: 'Criar',
  EDITAR: 'Editar',
  EXCLUIR: 'Deletar',
}

const ORDEM_SETORES = ['CONFIG', 'AGENDAMENTO']
const ORDEM_ITENS: Record<string, string[]> = {
  CONFIG: ['CARGO', 'USUARIO'],
  AGENDAMENTO: ['CLIENTE', 'OS', 'TECNICO'],
}
const ORDEM_ACOES = ['LISTAR', 'CRIAR', 'EDITAR', 'EXCLUIR']

function agruparPermissoes(permissoes: Permission[]) {
  const estrutura: Record<string, Record<string, { acao: string; permissao: Permission }[]>> = {}

  for (const p of permissoes) {
    const [setor, item, acao] = p.code.split('.')
    if (!setor || !item || !acao) continue
    if (!estrutura[setor]) estrutura[setor] = {}
    if (!estrutura[setor][item]) estrutura[setor][item] = []
    estrutura[setor][item].push({ acao, permissao: p })
  }

  for (const setor of Object.keys(estrutura)) {
    for (const item of Object.keys(estrutura[setor])) {
      estrutura[setor][item].sort(
        (a, b) => ORDEM_ACOES.indexOf(a.acao) - ORDEM_ACOES.indexOf(b.acao)
      )
    }
  }

  return estrutura
}

interface CargoModalProps {
  cargo: Cargo | null
  isNew: boolean
  onClose: () => void
  permissoes: Permission[]
  setores: Setor[]
}

function CargoModal({ cargo, isNew, onClose, permissoes, setores }: CargoModalProps) {
  const queryClient = useQueryClient()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState<CategoriaCargo>('OPERACIONAL')
  const [setorId, setSetorId] = useState<number>(0)
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([])
  const [expandedSectors, setExpandedSectors] = useState<string[]>(ORDEM_SETORES)

  useEffect(() => {
    if (cargo) {
      setNome(cargo.nome)
      setDescricao(cargo.descricao || '')
      setCategoria(cargo.categoria)
      setSetorId(cargo.setor.id)
      setSelectedPermIds(cargo.cargoPermissoes.map((cp) => cp.permissaoId))
    } else {
      setNome('')
      setDescricao('')
      setCategoria('OPERACIONAL')
      setSetorId(setores[0]?.id || 0)
      setSelectedPermIds([])
    }
  }, [cargo, setores])

  const createMutation = useMutation({
    mutationFn: async (data: { nome: string; code: string; setorId: number; descricao: string; categoria: CategoriaCargo; permissionIds: number[] }) => {
      const created = await api('/roles', {
        method: 'POST',
        body: JSON.stringify({
          nome: data.nome,
          code: data.nome.toUpperCase().replace(/\s+/g, '_'),
          setorId: data.setorId,
          descricao: data.descricao,
          categoria: data.categoria,
          ativo: true,
        }),
      })
      if (data.permissionIds.length > 0) {
        await api(`/roles/${created.id}/permissions`, {
          method: 'PATCH',
          body: JSON.stringify({ permissionIds: data.permissionIds }),
        })
      }
      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-paginated'] })
      onClose()
      toast.success('Cargo criado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar cargo'),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; nome: string; descricao: string; categoria: CategoriaCargo; permissionIds: number[] }) => {
      await api(`/roles/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nome: data.nome,
          descricao: data.descricao,
          categoria: data.categoria,
        }),
      })
      await api(`/roles/${data.id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissionIds: data.permissionIds }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-paginated'] })
      onClose()
      toast.success('Cargo atualizado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar cargo'),
  })

  const estrutura = useMemo(() => agruparPermissoes(permissoes), [permissoes])

  const permissoesAtivas = useMemo(() => {
    return permissoes
      .filter((p) => selectedPermIds.includes(p.id))
      .map((p) => {
        const [setor, item, acao] = p.code.split('.')
        return `${NOMES_ACAO[acao] || acao} ${NOMES_ITEM[item] || item}`
      })
  }, [permissoes, selectedPermIds])

  function togglePermission(id: number) {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleSectorExpanded(setor: string) {
    setExpandedSectors((prev) =>
      prev.includes(setor) ? prev.filter((s) => s !== setor) : [...prev, setor]
    )
  }

  function toggleAllSectorPermissions(setor: string, checked: boolean) {
    const setorItens = estrutura[setor]
    if (!setorItens) return

    const allPermIds = Object.values(setorItens)
      .flat()
      .map((a) => a.permissao.id)

    if (checked) {
      setSelectedPermIds((prev) => [...new Set([...prev, ...allPermIds])])
    } else {
      setSelectedPermIds((prev) => prev.filter((id) => !allPermIds.includes(id)))
    }
  }

  function isSectorFullySelected(setor: string) {
    const setorItens = estrutura[setor]
    if (!setorItens) return false

    const allPermIds = Object.values(setorItens)
      .flat()
      .map((a) => a.permissao.id)

    return allPermIds.every((id) => selectedPermIds.includes(id))
  }

  function handleSave() {
    if (!nome.trim()) {
      toast.error('Nome do cargo é obrigatório')
      return
    }

    if (isNew) {
      if (!setorId) {
        toast.error('Selecione um setor')
        return
      }
      createMutation.mutate({
        nome,
        code: nome.toUpperCase().replace(/\s+/g, '_'),
        setorId,
        descricao,
        categoria,
        permissionIds: selectedPermIds,
      })
    } else if (cargo) {
      updateMutation.mutate({
        id: cargo.id,
        nome,
        descricao,
        categoria,
        permissionIds: selectedPermIds,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const categoriaConfig = CATEGORIA_CONFIG[categoria]

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[1000px] h-[90vh] rounded-sm shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-6 shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <MaterialIcon name="add_moderator" className="text-blue-600 font-bold" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
              {isNew ? 'Novo Cargo' : 'Editar Cargo'}
            </h2>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <Label>Nome do Cargo</Label>
              <Input
                className="w-full h-10"
                placeholder="Ex: Operador Logístico Nível II"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v: CategoriaCargo) => setCategoria(v)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                  <SelectItem value="GESTAO">Gestão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-5">
              <Label>Descrição</Label>
              <Input
                className="w-full h-10"
                placeholder="Breve descrição das responsabilidades..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Matriz de Permissões */}
          <div className="flex-1 overflow-y-auto border-r border-slate-200 custom-scroll">
            <div className="p-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Matriz de Permissões
              </h3>
            </div>

            {ORDEM_SETORES.map((setor) => {
              const itens = estrutura[setor]
              if (!itens) return null
              const isExpanded = expandedSectors.includes(setor)
              const isFullySelected = isSectorFullySelected(setor)
              const ordemItens = ORDEM_ITENS[setor] ?? Object.keys(itens)

              return (
                <div key={setor} className="sector-group">
                  <div
                    className="flex items-center justify-between bg-slate-50 px-4 py-2 border-y border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSectorExpanded(setor)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        {NOMES_SETOR[setor] || setor}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        Acesso Total ao Setor
                      </span>
                      <SectorCheckbox
                        checked={isFullySelected}
                        onChange={(checked) => toggleAllSectorPermissions(setor, checked)}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                            Recurso
                          </th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                            Visualizar
                          </th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                            Criar
                          </th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                            Editar
                          </th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                            Deletar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordemItens.map((item) => {
                          const acoes = itens[item]
                          if (!acoes?.length) return null

                          const acoesMapeadas = ORDEM_ACOES.map((acao) => {
                            const found = acoes.find((a) => a.acao === acao)
                            return found ? found.permissao : null
                          })

                          return (
                            <tr
                              key={item}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white"
                            >
                              <td className="px-4 py-2 text-xs font-medium text-slate-600">
                                {NOMES_ITEM[item] || item}
                              </td>
                              {acoesMapeadas.map((perm, idx) => (
                                <td key={idx} className="px-4 py-3 text-center">
                                  {perm ? (
                                    <div className="flex justify-center">
                                      <PermissionCheckbox
                                        checked={selectedPermIds.includes(perm.id)}
                                        onChange={() => togglePermission(perm.id)}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>

          {/* Sidebar Resumo */}
          <aside className="w-72 bg-slate-50 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
            <div className="sticky top-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                Resumo do Cargo
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome Visualizado</Label>
                  <div className="text-sm font-semibold text-slate-700 italic">
                    {nome || '— Definir Nome —'}
                  </div>
                </div>
                <div>
                  <Label>Categoria Selecionada</Label>
                  <div
                    className={cn(
                      'text-[10px] font-bold uppercase inline-flex items-center px-2 py-0.5 rounded border',
                      categoria ? categoriaConfig.className : 'bg-slate-200 text-slate-500 border-slate-300'
                    )}
                  >
                    {categoria ? categoriaConfig.label : 'Não Especificada'}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">Permissões Ativas</span>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {String(selectedPermIds.length).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {permissoesAtivas.slice(0, 10).map((perm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-500">
                        <MaterialIcon name="check_circle" className="text-[12px] text-emerald-500" />
                        <span>{perm}</span>
                      </div>
                    ))}
                    {permissoesAtivas.length > 10 && (
                      <div className="text-[10px] text-slate-400 italic">
                        + {permissoesAtivas.length - 10} permissões...
                      </div>
                    )}
                    {permissoesAtivas.length === 0 && (
                      <div className="text-[10px] text-slate-400 italic">
                        Nenhuma permissão selecionada
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-1">
                  <MaterialIcon name="info" className="text-[14px]" />
                  Lógica de Acesso:
                </span>
                Permissões de <strong>'Criar'</strong> ou <strong>'Editar'</strong> habilitam
                automaticamente a permissão de <strong>'Visualizar'</strong> para o recurso
                correspondente.
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <MaterialIcon name="lock" className="text-sm" />
            Segurança Industrial Garantida
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="px-6 h-10 text-xs font-bold text-slate-600 hover:text-slate-800 uppercase"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 px-8 rounded-sm shadow-sm uppercase tracking-wide"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? 'Salvando...' : 'Salvar Cargo'}
            </Button>
          </div>
        </footer>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

export function CargosPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('CONFIG.CARGO.CRIAR')
  const canEdit = hasPermission('CONFIG.CARGO.EDITAR')

  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS')
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoriaFilter])

  const { data: response, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['roles-paginated', debouncedSearch, categoriaFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (categoriaFilter && categoriaFilter !== 'TODAS') params.set('categoria', categoriaFilter)
      params.set('page', String(page))
      params.set('limit', '15')
      return api(`/roles/paginated?${params.toString()}`)
    },
  })

  const { data: setores = [] } = useQuery<Setor[]>({
    queryKey: ['setores'],
    queryFn: () => api('/roles/setores'),
    enabled: modalOpen,
  })

  const { data: permissoes = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api('/roles/permissions'),
    enabled: modalOpen,
  })

  function openCreate() {
    setEditingCargo(null)
    setModalOpen(true)
  }

  function openEdit(cargo: Cargo) {
    setEditingCargo(cargo)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingCargo(null)
  }

  const cargos = response?.data ?? []
  const totalCargos = response?.total ?? 0
  const totalPages = response?.totalPages ?? 1

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
            <h1 className="text-lg font-bold text-slate-800">Cargos e Permissões</h1>
            <p className="text-xs text-slate-500">Gerencie níveis de acesso ao sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Busca por nome</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 w-64 h-9"
                placeholder="Filtrar cargo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</Label>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                <SelectItem value="GESTAO">Gestão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <div className="flex flex-col">
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1 opacity-0">Ação</Label>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm"
                onClick={openCreate}
              >
                <MaterialIcon name="add_moderator" className="text-lg mr-2" />
                Novo Cargo
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
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Nome do Cargo
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Categoria
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Descrição
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                  Usuários Vinculados
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                  Status
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-12">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {cargos.map((cargo) => {
                const config = CATEGORIA_CONFIG[cargo.categoria]
                const isInactive = !cargo.ativo

                return (
                  <tr
                    key={cargo.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                  >
                    <td className="px-4 py-3.5">
                      <span className={cn('text-sm font-bold', isInactive ? 'text-slate-400' : 'text-slate-800')}>
                        {cargo.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1 w-fit',
                          config.className,
                          isInactive && 'grayscale opacity-60'
                        )}
                      >
                        <span className={cn('w-2 h-2 rounded-full', isInactive ? 'bg-slate-400' : config.dotColor)} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-xs', isInactive ? 'text-slate-400 italic' : 'text-slate-500')}>
                        {cargo.descricao || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={cn('font-bold text-sm', isInactive ? 'text-slate-400' : 'text-blue-600')}>
                        {String(cargo.usuariosVinculados).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', cargo.ativo ? 'bg-emerald-500' : 'bg-slate-300')} />
                        <span className={cn('text-[10px] font-bold uppercase', cargo.ativo ? 'text-slate-600' : 'text-slate-400')}>
                          {cargo.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(cargo)}>
                              <MaterialIcon name="edit" className="mr-2 text-base" />
                              Editar Cargo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                )
              })}
              {cargos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    Nenhum cargo encontrado
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
              Total de {totalCargos} cargos cadastrados
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase font-bold">
              <span className="w-3 h-3 bg-blue-500 rounded-sm" /> Operacional
              <span className="w-3 h-3 bg-emerald-500 rounded-sm ml-2" /> Administrativo
              <span className="w-3 h-3 bg-purple-500 rounded-sm ml-2" /> Gestão
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

      {/* Modal Unificado */}
      {modalOpen && (
        <CargoModal
          cargo={editingCargo}
          isNew={!editingCargo}
          onClose={closeModal}
          permissoes={permissoes}
          setores={setores}
        />
      )}
    </div>
  )
}
