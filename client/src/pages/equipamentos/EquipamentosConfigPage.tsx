import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, MoreVertical, ArrowLeft, X } from 'lucide-react'
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
  _count: { modelos: number }
}

interface Modelo {
  id: number
  nome: string
  ativo: boolean
  marca: { id: number; nome: string; ativo: boolean }
}

interface Operadora {
  id: number
  nome: string
  ativo: boolean
}

export function EquipamentosConfigPage() {
  const queryClient = useQueryClient()
  const [searchMarcas, setSearchMarcas] = useState('')
  const [debouncedSearchMarcas, setDebouncedSearchMarcas] = useState('')
  const [searchOperadoras, setSearchOperadoras] = useState('')
  const [debouncedSearchOperadoras, setDebouncedSearchOperadoras] = useState('')
  const [expandedMarcaIds, setExpandedMarcaIds] = useState<Set<number>>(new Set())

  // Modals
  const [modalMarcaOpen, setModalMarcaOpen] = useState(false)
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null)
  const [nomeMarca, setNomeMarca] = useState('')

  const [modalModeloOpen, setModalModeloOpen] = useState(false)
  const [editingModelo, setEditingModelo] = useState<Modelo | null>(null)
  const [nomeModelo, setNomeModelo] = useState('')
  const [marcaIdForModelo, setMarcaIdForModelo] = useState<string>('')

  const [modalOperadoraOpen, setModalOperadoraOpen] = useState(false)
  const [editingOperadora, setEditingOperadora] = useState<Operadora | null>(null)
  const [nomeOperadora, setNomeOperadora] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchMarcas(searchMarcas), 300)
    return () => clearTimeout(t)
  }, [searchMarcas])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchOperadoras(searchOperadoras), 300)
    return () => clearTimeout(t)
  }, [searchOperadoras])

  const { data: marcas = [], isLoading: loadingMarcas } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: () => api('/equipamentos/marcas'),
  })

  const { data: modelos = [], isLoading: loadingModelos } = useQuery<Modelo[]>({
    queryKey: ['modelos'],
    queryFn: () => api('/equipamentos/modelos'),
  })

  const { data: operadoras = [], isLoading: loadingOperadoras } = useQuery<Operadora[]>({
    queryKey: ['operadoras'],
    queryFn: () => api('/equipamentos/operadoras'),
  })

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas])

  const filteredMarcas = useMemo(() => {
    const q = debouncedSearchMarcas.toLowerCase()
    return marcas.filter((m) => {
      const matchMarca = m.nome.toLowerCase().includes(q)
      const matchModelo = modelos.some(
        (mod) => mod.marca.id === m.id && mod.nome.toLowerCase().includes(q)
      )
      return matchMarca || matchModelo
    })
  }, [marcas, modelos, debouncedSearchMarcas])

  const filteredOperadoras = useMemo(
    () =>
      operadoras.filter((o) =>
        o.nome.toLowerCase().includes(debouncedSearchOperadoras.toLowerCase())
      ),
    [operadoras, debouncedSearchOperadoras]
  )

  const modelosByMarca = useMemo(() => {
    const map = new Map<number, Modelo[]>()
    for (const m of modelos) {
      const list = map.get(m.marca.id) ?? []
      list.push(m)
      map.set(m.marca.id, list)
    }
    return map
  }, [modelos])

  const totalModelos = modelos.length

  function toggleMarca(marcaId: number) {
    setExpandedMarcaIds((prev) => {
      const next = new Set(prev)
      if (next.has(marcaId)) next.delete(marcaId)
      else next.add(marcaId)
      return next
    })
  }

  // Marca mutations
  const createMarcaMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api('/equipamentos/marcas', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      closeModalMarca()
      toast.success('Marca criada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar marca'),
  })

  const updateMarcaMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nome?: string; ativo?: boolean }) =>
      api(`/equipamentos/marcas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      closeModalMarca()
      toast.success('Marca atualizada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar marca'),
  })

  const deleteMarcaMutation = useMutation({
    mutationFn: (id: number) => api(`/equipamentos/marcas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      toast.success('Marca deletada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao deletar marca'),
  })

  // Modelo mutations
  const createModeloMutation = useMutation({
    mutationFn: (data: { nome: string; marcaId: number }) =>
      api('/equipamentos/modelos', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] })
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      closeModalModelo()
      toast.success('Modelo criado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar modelo'),
  })

  const updateModeloMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nome?: string; ativo?: boolean }) =>
      api(`/equipamentos/modelos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] })
      closeModalModelo()
      toast.success('Modelo atualizado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar modelo'),
  })

  const deleteModeloMutation = useMutation({
    mutationFn: (id: number) => api(`/equipamentos/modelos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] })
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      toast.success('Modelo deletado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao deletar modelo'),
  })

  // Operadora mutations
  const createOperadoraMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api('/equipamentos/operadoras', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadoras'] })
      closeModalOperadora()
      toast.success('Operadora criada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar operadora'),
  })

  const updateOperadoraMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; nome?: string; ativo?: boolean }) =>
      api(`/equipamentos/operadoras/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadoras'] })
      closeModalOperadora()
      toast.success('Operadora atualizada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar operadora'),
  })

  const deleteOperadoraMutation = useMutation({
    mutationFn: (id: number) => api(`/equipamentos/operadoras/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadoras'] })
      toast.success('Operadora deletada com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao deletar operadora'),
  })

  function openCreateMarca() {
    setEditingMarca(null)
    setNomeMarca('')
    setModalMarcaOpen(true)
  }

  function openEditMarca(marca: Marca) {
    setEditingMarca(marca)
    setNomeMarca(marca.nome)
    setModalMarcaOpen(true)
  }

  function closeModalMarca() {
    setModalMarcaOpen(false)
    setEditingMarca(null)
    setNomeMarca('')
  }

  function handleSaveMarca() {
    if (!nomeMarca.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (editingMarca) updateMarcaMutation.mutate({ id: editingMarca.id, nome: nomeMarca })
    else createMarcaMutation.mutate({ nome: nomeMarca })
  }

  function toggleAtivoMarca(marca: Marca) {
    updateMarcaMutation.mutate({ id: marca.id, ativo: !marca.ativo })
  }

  function openCreateModelo(marcaId?: number) {
    setEditingModelo(null)
    setNomeModelo('')
    setMarcaIdForModelo(marcaId ? String(marcaId) : '')
    setModalModeloOpen(true)
  }

  function openEditModelo(modelo: Modelo) {
    setEditingModelo(modelo)
    setNomeModelo(modelo.nome)
    setMarcaIdForModelo(String(modelo.marca.id))
    setModalModeloOpen(true)
  }

  function closeModalModelo() {
    setModalModeloOpen(false)
    setEditingModelo(null)
    setNomeModelo('')
    setMarcaIdForModelo('')
  }

  function handleSaveModelo() {
    if (!nomeModelo.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!editingModelo && !marcaIdForModelo) {
      toast.error('Selecione uma marca')
      return
    }
    if (editingModelo) {
      updateModeloMutation.mutate({ id: editingModelo.id, nome: nomeModelo })
    } else {
      createModeloMutation.mutate({ nome: nomeModelo, marcaId: Number(marcaIdForModelo) })
    }
  }

  function toggleAtivoModelo(modelo: Modelo) {
    updateModeloMutation.mutate({ id: modelo.id, ativo: !modelo.ativo })
  }

  function openCreateOperadora() {
    setEditingOperadora(null)
    setNomeOperadora('')
    setModalOperadoraOpen(true)
  }

  function openEditOperadora(operadora: Operadora) {
    setEditingOperadora(operadora)
    setNomeOperadora(operadora.nome)
    setModalOperadoraOpen(true)
  }

  function closeModalOperadora() {
    setModalOperadoraOpen(false)
    setEditingOperadora(null)
    setNomeOperadora('')
  }

  function handleSaveOperadora() {
    if (!nomeOperadora.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (editingOperadora) {
      updateOperadoraMutation.mutate({ id: editingOperadora.id, nome: nomeOperadora })
    } else {
      createOperadoraMutation.mutate({ nome: nomeOperadora })
    }
  }

  function toggleAtivoOperadora(operadora: Operadora) {
    updateOperadoraMutation.mutate({ id: operadora.id, ativo: !operadora.ativo })
  }

  const isLoading = loadingMarcas || loadingModelos || loadingOperadoras

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-[#F1F5F9]">
      {/* Header */}
      <header className="h-20 shrink-0 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/equipamentos"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
              Marcas, Modelos e Operadoras
            </h1>
            <p className="text-xs text-slate-500">
              Gestão de marcas, modelos e operadoras dos aparelhos e simcards.
            </p>
          </div>
        </div>
      </header>

      {/* Content - Grid 12 cols */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Col 7 - Marcas e Modelos */}
          <div className="col-span-7 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MaterialIcon name="sensors" className="text-blue-600" />
                    Marcas e Modelos de Rastreador
                  </h2>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                    onClick={() => openCreateMarca()}
                  >
                    <MaterialIcon name="add" className="text-base" />
                    Nova Marca
                  </Button>
                </div>
                <div className="relative">
                  <MaterialIcon
                    name="search"
                    className="absolute left-3 top-2 text-slate-400 text-lg"
                  />
                  <Input
                    className="h-9 pl-9 pr-3 w-full bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs rounded-sm"
                    placeholder="Pesquisar marca ou modelo..."
                    value={searchMarcas}
                    onChange={(e) => setSearchMarcas(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredMarcas.map((marca) => {
                  const isExpanded = expandedMarcaIds.has(marca.id)
                  const modelosDaMarca = modelosByMarca.get(marca.id) ?? []
                  return (
                    <div
                      key={marca.id}
                      className="border-b border-slate-50 last:border-b-0"
                    >
                      <div
                        className={cn(
                          'flex items-center justify-between p-4 cursor-pointer transition-colors',
                          isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50'
                        )}
                        onClick={() => toggleMarca(marca.id)}
                      >
                        <div className="flex items-center gap-3">
                          <MaterialIcon
                            name={isExpanded ? 'expand_more' : 'chevron_right'}
                            className="text-slate-400"
                          />
                          <span className="font-bold text-slate-800 text-sm tracking-tight">
                            {marca.nome}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded font-bold',
                              marca.ativo ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            {String(marca._count.modelos).padStart(2, '0')} MODELOS
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <MaterialIcon name="edit" className="text-lg" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => openEditMarca(marca)}>
                              <MaterialIcon name="edit" className="mr-2 text-base" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleAtivoMarca(marca)}>
                              <MaterialIcon
                                name={marca.ativo ? 'visibility_off' : 'visibility'}
                                className="mr-2 text-base"
                              />
                              {marca.ativo ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            {marca._count.modelos === 0 && (
                              <DropdownMenuItem
                                onClick={() => deleteMarcaMutation.mutate(marca.id)}
                                className="text-red-600"
                              >
                                <MaterialIcon name="delete" className="mr-2 text-base" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {isExpanded && (
                        <div className="bg-white">
                          {modelosDaMarca.length === 0 ? (
                            <div className="py-4 pl-10 pr-4 text-xs text-slate-500 flex items-center justify-between">
                              <span>Nenhum modelo cadastrado</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openCreateModelo(marca.id)
                                }}
                              >
                                <MaterialIcon name="add" className="text-sm mr-1" />
                                Novo Modelo
                              </Button>
                            </div>
                          ) : (
                            modelosDaMarca.map((modelo) => (
                              <div
                                key={modelo.id}
                                className="flex items-center justify-between py-3 pl-10 pr-4 hover:bg-blue-50/30 border-l-2 border-transparent hover:border-blue-400 transition-all"
                              >
                                <span
                                  className={cn(
                                    'text-xs font-medium',
                                    modelo.ativo ? 'text-slate-600' : 'text-slate-400 line-through'
                                  )}
                                >
                                  {modelo.nome}
                                </span>
                                <div className="flex items-center gap-4">
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border',
                                      modelo.ativo
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    )}
                                  >
                                    {modelo.ativo ? 'Ativo' : 'Desativado'}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-slate-300 hover:text-slate-500"
                                      >
                                        <MoreVertical className="h-5 w-5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditModelo(modelo)}>
                                        <MaterialIcon name="edit" className="mr-2 text-base" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => toggleAtivoModelo(modelo)}
                                      >
                                        <MaterialIcon
                                          name={modelo.ativo ? 'visibility_off' : 'visibility'}
                                          className="mr-2 text-base"
                                        />
                                        {modelo.ativo ? 'Desativar' : 'Ativar'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => deleteModeloMutation.mutate(modelo.id)}
                                        className="text-red-600"
                                      >
                                        <MaterialIcon name="delete" className="mr-2 text-base" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))
                          )}
                          {modelosDaMarca.length > 0 && (
                            <div className="py-2 pl-10 pr-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-7 text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openCreateModelo(marca.id)
                                }}
                              >
                                <MaterialIcon name="add" className="text-sm mr-1" />
                                Novo Modelo
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {filteredMarcas.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Nenhuma marca encontrada
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Total: {filteredMarcas.length} Marcas / {totalModelos} Modelos
                </span>
              </div>
            </div>
          </div>

          {/* Col 5 - Operadoras */}
          <div className="col-span-5 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MaterialIcon name="signal_cellular_alt" className="text-blue-600" />
                    Operadoras
                  </h2>
                  <Button
                    className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                    onClick={openCreateOperadora}
                  >
                    <MaterialIcon name="add" className="text-base" />
                    Nova Operadora
                  </Button>
                </div>
                <div className="relative">
                  <MaterialIcon
                    name="search"
                    className="absolute left-3 top-2 text-slate-400 text-lg"
                  />
                  <Input
                    className="h-9 pl-9 pr-3 w-full bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs rounded-sm"
                    placeholder="Filtrar operadoras..."
                    value={searchOperadoras}
                    onChange={(e) => setSearchOperadoras(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Nome
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Status
                      </th>
                      <th className="px-4 py-2.5 w-10 border-b border-slate-100" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOperadoras.map((operadora) => (
                      <tr
                        key={operadora.id}
                        className={cn(
                          'hover:bg-slate-50/50 transition-colors',
                          !operadora.ativo && 'opacity-60 bg-slate-50/20'
                        )}
                      >
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              'text-xs font-bold',
                              operadora.ativo ? 'text-slate-800' : 'text-slate-500'
                            )}
                          >
                            {operadora.nome}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                operadora.ativo ? 'bg-emerald-500' : 'bg-slate-400'
                              )}
                            />
                            <span
                              className={cn(
                                'text-[10px] font-bold uppercase',
                                operadora.ativo ? 'text-slate-600' : 'text-slate-400'
                              )}
                            >
                              {operadora.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-slate-400 hover:text-slate-600">
                                <MaterialIcon name="settings" className="text-lg" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditOperadora(operadora)}>
                                <MaterialIcon name="edit" className="mr-2 text-base" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleAtivoOperadora(operadora)}
                              >
                                <MaterialIcon
                                  name={operadora.ativo ? 'visibility_off' : 'visibility'}
                                  className="mr-2 text-base"
                                />
                                {operadora.ativo ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteOperadoraMutation.mutate(operadora.id)}
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
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Total: {filteredOperadoras.length} Operadoras Registradas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Marca */}
      {modalMarcaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden">
            <header className="bg-white border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="precision_manufacturing" className="text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingMarca ? 'Editar Marca' : 'Nova Marca'}
                  </h2>
                </div>
                <button onClick={closeModalMarca} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>
            <div className="p-6">
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Nome da Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nomeMarca}
                onChange={(e) => setNomeMarca(e.target.value)}
                placeholder="Ex: Teltonika"
                className="h-10"
              />
            </div>
            <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModalMarca}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveMarca}
                disabled={createMarcaMutation.isPending || updateMarcaMutation.isPending}
              >
                {createMarcaMutation.isPending || updateMarcaMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal Modelo */}
      {modalModeloOpen && (
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
                <button onClick={closeModalModelo} className="text-slate-400 hover:text-slate-600">
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
                  <Select
                    value={marcaIdForModelo}
                    onValueChange={setMarcaIdForModelo}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione uma marca..." />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasAtivas.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.nome}
                        </SelectItem>
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
                  value={nomeModelo}
                  onChange={(e) => setNomeModelo(e.target.value)}
                  placeholder="Ex: FMB920"
                  className="h-10"
                />
              </div>
            </div>
            <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModalModelo}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveModelo}
                disabled={createModeloMutation.isPending || updateModeloMutation.isPending}
              >
                {createModeloMutation.isPending || updateModeloMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal Operadora */}
      {modalOperadoraOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden">
            <header className="bg-white border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="signal_cellular_alt" className="text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingOperadora ? 'Editar Operadora' : 'Nova Operadora'}
                  </h2>
                </div>
                <button
                  onClick={closeModalOperadora}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>
            <div className="p-6">
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Nome da Operadora <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nomeOperadora}
                onChange={(e) => setNomeOperadora(e.target.value)}
                placeholder="Ex: Vivo"
                className="h-10"
              />
            </div>
            <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModalOperadora}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveOperadora}
                disabled={
                  createOperadoraMutation.isPending || updateOperadoraMutation.isPending
                }
              >
                {createOperadoraMutation.isPending || updateOperadoraMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
