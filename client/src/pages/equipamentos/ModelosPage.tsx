import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, MoreVertical, Search, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Marca {
  id: number
  nome: string
  ativo: boolean
}

interface Modelo {
  id: number
  nome: string
  ativo: boolean
  criadoEm: string
  marca: Marca
}

export function ModelosPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [marcaFilter, setMarcaFilter] = useState<string>('TODAS')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingModelo, setEditingModelo] = useState<Modelo | null>(null)
  const [nome, setNome] = useState('')
  const [marcaId, setMarcaId] = useState<string>('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: marcas = [] } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: () => api('/equipamentos/marcas'),
  })

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas])

  const { data: modelos = [], isLoading } = useQuery<Modelo[]>({
    queryKey: ['modelos'],
    queryFn: () => api('/equipamentos/modelos'),
  })

  const filteredModelos = useMemo(() => {
    return modelos.filter((m) => {
      const matchesSearch = m.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesMarca = marcaFilter === 'TODAS' || m.marca.id === Number(marcaFilter)
      return matchesSearch && matchesMarca
    })
  }, [modelos, debouncedSearch, marcaFilter])

  const createMutation = useMutation({
    mutationFn: (data: { nome: string; marcaId: number }) =>
      api('/equipamentos/modelos', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] })
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      closeModal()
      toast.success('Modelo criado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar modelo'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nome?: string; ativo?: boolean }) =>
      api(`/equipamentos/modelos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] })
      closeModal()
      toast.success('Modelo atualizado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar modelo'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/modelos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] })
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      toast.success('Modelo deletado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao deletar modelo'),
  })

  function openCreate() {
    setEditingModelo(null)
    setNome('')
    setMarcaId('')
    setModalOpen(true)
  }

  function openEdit(modelo: Modelo) {
    setEditingModelo(modelo)
    setNome(modelo.nome)
    setMarcaId(String(modelo.marca.id))
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingModelo(null)
    setNome('')
    setMarcaId('')
  }

  function handleSave() {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!editingModelo && !marcaId) {
      toast.error('Selecione uma marca')
      return
    }
    if (editingModelo) {
      updateMutation.mutate({ id: editingModelo.id, nome })
    } else {
      createMutation.mutate({ nome, marcaId: Number(marcaId) })
    }
  }

  function toggleAtivo(modelo: Modelo) {
    updateMutation.mutate({ id: modelo.id, ativo: !modelo.ativo })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

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
            <MaterialIcon name="devices" className="text-blue-600 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Modelos de Equipamentos</h1>
              <p className="text-xs text-slate-500">Gerencie os modelos de rastreadores por marca</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Busca</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 w-52 h-9"
                placeholder="Filtrar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Marca</Label>
            <Select value={marcaFilter} onValueChange={setMarcaFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                {marcas.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1 opacity-0">Ação</Label>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm"
              onClick={openCreate}
            >
              <MaterialIcon name="add" className="text-lg mr-2" />
              Novo Modelo
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white min-h-0">
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Nome do Modelo
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                  Marca
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
              {filteredModelos.map((modelo) => (
                <tr
                  key={modelo.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                >
                  <td className="px-4 py-3.5">
                    <span className={cn('text-sm font-bold', !modelo.ativo && 'text-slate-400')}>
                      {modelo.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                      modelo.marca.ativo
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    )}>
                      {modelo.marca.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', modelo.ativo ? 'bg-emerald-500' : 'bg-slate-300')} />
                      <span className={cn('text-[10px] font-bold uppercase', modelo.ativo ? 'text-slate-600' : 'text-slate-400')}>
                        {modelo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(modelo)}>
                          <MaterialIcon name="edit" className="mr-2 text-base" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAtivo(modelo)}>
                          <MaterialIcon name={modelo.ativo ? 'visibility_off' : 'visibility'} className="mr-2 text-base" />
                          {modelo.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(modelo.id)}
                          className="text-red-600"
                        >
                          <MaterialIcon name="delete" className="mr-2 text-base" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredModelos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                    Nenhum modelo encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
            Total de {filteredModelos.length} modelos
          </span>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden">
            <header className="bg-white border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="devices" className="text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingModelo ? 'Editar Modelo' : 'Novo Modelo'}
                  </h2>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>
            <div className="p-6 space-y-4">
              {!editingModelo && (
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Marca <span className="text-red-500">*</span>
                  </Label>
                  <Select value={marcaId} onValueChange={setMarcaId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione uma marca..." />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasAtivas.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingModelo && (
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Marca
                  </Label>
                  <div className="h-10 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-600">
                    {editingModelo.marca.nome}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Nome do Modelo <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: ST310UC"
                  className="h-10"
                />
              </div>
            </div>
            <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
