import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, MoreVertical, Search, ArrowLeft } from 'lucide-react'
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
import { CargoModal } from './CargoModal'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

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

export function CargosPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('ADMINISTRATIVO.CARGO.CRIAR')
  const canEdit = hasPermission('ADMINISTRATIVO.CARGO.EDITAR')

  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)

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
          <div className="flex items-center gap-3">
            <MaterialIcon name="add_moderator" className="text-erp-blue text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Cargos e Permissões</h1>
            <p className="text-xs text-slate-500">Gerencie níveis de acesso ao sistema</p>
            </div>
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
                className="bg-erp-blue hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm"
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
      <CargoModal
        open={modalOpen}
        cargo={editingCargo}
        isNew={!editingCargo}
        onClose={closeModal}
        permissoes={permissoes}
        setores={setores}
      />
    </div>
  )
}
