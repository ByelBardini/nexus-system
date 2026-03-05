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

interface Operadora {
  id: number
  nome: string
  ativo: boolean
  criadoEm: string
}

export function OperadorasPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOperadora, setEditingOperadora] = useState<Operadora | null>(null)
  const [nome, setNome] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: operadoras = [], isLoading } = useQuery<Operadora[]>({
    queryKey: ['operadoras'],
    queryFn: () => api('/equipamentos/operadoras'),
  })

  const filteredOperadoras = operadoras.filter((o) =>
    o.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const createMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api('/equipamentos/operadoras', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadoras'] })
      closeModal()
      toast.success('Operadora criada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar operadora'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nome?: string; ativo?: boolean }) =>
      api(`/equipamentos/operadoras/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadoras'] })
      closeModal()
      toast.success('Operadora atualizada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar operadora'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/operadoras/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadoras'] })
      toast.success('Operadora deletada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao deletar operadora'),
  })

  function openCreate() {
    setEditingOperadora(null)
    setNome('')
    setModalOpen(true)
  }

  function openEdit(operadora: Operadora) {
    setEditingOperadora(operadora)
    setNome(operadora.nome)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingOperadora(null)
    setNome('')
  }

  function handleSave() {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (editingOperadora) {
      updateMutation.mutate({ id: editingOperadora.id, nome })
    } else {
      createMutation.mutate({ nome })
    }
  }

  function toggleAtivo(operadora: Operadora) {
    updateMutation.mutate({ id: operadora.id, ativo: !operadora.ativo })
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
            <MaterialIcon name="sim_card" className="text-blue-600 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Operadoras</h1>
              <p className="text-xs text-slate-500">Gerencie as operadoras de SIM cards</p>
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
              Nova Operadora
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
                  Nome da Operadora
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
              {filteredOperadoras.map((operadora) => (
                <tr
                  key={operadora.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                >
                  <td className="px-4 py-3.5">
                    <span className={cn('text-sm font-bold', !operadora.ativo && 'text-slate-400')}>
                      {operadora.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', operadora.ativo ? 'bg-emerald-500' : 'bg-slate-300')} />
                      <span className={cn('text-[10px] font-bold uppercase', operadora.ativo ? 'text-slate-600' : 'text-slate-400')}>
                        {operadora.ativo ? 'Ativo' : 'Inativo'}
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
                        <DropdownMenuItem onClick={() => openEdit(operadora)}>
                          <MaterialIcon name="edit" className="mr-2 text-base" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAtivo(operadora)}>
                          <MaterialIcon name={operadora.ativo ? 'visibility_off' : 'visibility'} className="mr-2 text-base" />
                          {operadora.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(operadora.id)}
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
              {filteredOperadoras.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">
                    Nenhuma operadora encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
            Total de {filteredOperadoras.length} operadoras
          </span>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent hideClose className="max-w-md p-0 gap-0 overflow-hidden rounded-sm">
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="sim_card" className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingOperadora ? 'Editar Operadora' : 'Nova Operadora'}
              </h2>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Nome da Operadora <span className="text-red-500">*</span>
            </Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vivo"
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
