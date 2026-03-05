import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, MoreVertical, Search, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
  criadoEm: string
  _count: { modelos: number }
}

export function MarcasPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null)
  const [nome, setNome] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: marcas = [], isLoading } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: () => api('/equipamentos/marcas'),
  })

  const filteredMarcas = marcas.filter((m) =>
    m.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const createMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api('/equipamentos/marcas', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      closeModal()
      toast.success('Marca criada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar marca'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nome?: string; ativo?: boolean }) =>
      api(`/equipamentos/marcas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      closeModal()
      toast.success('Marca atualizada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar marca'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/marcas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      toast.success('Marca deletada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao deletar marca'),
  })

  function openCreate() {
    setEditingMarca(null)
    setNome('')
    setModalOpen(true)
  }

  function openEdit(marca: Marca) {
    setEditingMarca(marca)
    setNome(marca.nome)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingMarca(null)
    setNome('')
  }

  function handleSave() {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (editingMarca) {
      updateMutation.mutate({ id: editingMarca.id, nome })
    } else {
      createMutation.mutate({ nome })
    }
  }

  function toggleAtivo(marca: Marca) {
    updateMutation.mutate({ id: marca.id, ativo: !marca.ativo })
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
            <MaterialIcon name="precision_manufacturing" className="text-blue-600 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Marcas de Equipamentos</h1>
              <p className="text-xs text-slate-500">Gerencie as marcas de rastreadores</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Busca</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 w-64 h-9"
                placeholder="Filtrar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1 opacity-0">Ação</Label>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm"
              onClick={openCreate}
            >
              <MaterialIcon name="add" className="text-lg mr-2" />
              Nova Marca
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
                  Nome da Marca
                </th>
                <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                  Modelos Cadastrados
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
              {filteredMarcas.map((marca) => (
                <tr
                  key={marca.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                >
                  <td className="px-4 py-3.5">
                    <span className={cn('text-sm font-bold', !marca.ativo && 'text-slate-400')}>
                      {marca.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn('font-bold text-sm', !marca.ativo ? 'text-slate-400' : 'text-blue-600')}>
                      {String(marca._count.modelos).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', marca.ativo ? 'bg-emerald-500' : 'bg-slate-300')} />
                      <span className={cn('text-[10px] font-bold uppercase', marca.ativo ? 'text-slate-600' : 'text-slate-400')}>
                        {marca.ativo ? 'Ativo' : 'Inativo'}
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
                        <DropdownMenuItem onClick={() => openEdit(marca)}>
                          <MaterialIcon name="edit" className="mr-2 text-base" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAtivo(marca)}>
                          <MaterialIcon name={marca.ativo ? 'visibility_off' : 'visibility'} className="mr-2 text-base" />
                          {marca.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        {marca._count.modelos === 0 && (
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(marca.id)}
                            className="text-red-600"
                          >
                            <MaterialIcon name="delete" className="mr-2 text-base" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredMarcas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                    Nenhuma marca encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
            Total de {filteredMarcas.length} marcas
          </span>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent hideClose className="max-w-md p-0 gap-0 overflow-hidden rounded-sm">
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="precision_manufacturing" className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingMarca ? 'Editar Marca' : 'Nova Marca'}
              </h2>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Nome da Marca <span className="text-red-500">*</span>
            </Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Suntech"
              className="h-10"
            />
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
