import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface Permission {
  id: number
  code: string
}

const NOMES_ACAO: Record<string, string> = {
  CRIAR: 'Criar',
  EDITAR: 'Editar',
  EXCLUIR: 'Excluir',
  LISTAR: 'Listar',
}
const CORES_ACAO: Record<string, { base: string; selected: string }> = {
  CRIAR: { base: 'bg-emerald-50 text-emerald-800 border-emerald-200', selected: 'border-emerald-500 ring-2 ring-emerald-200' },
  EDITAR: { base: 'bg-blue-50 text-blue-800 border-blue-200', selected: 'border-blue-500 ring-2 ring-blue-200' },
  EXCLUIR: { base: 'bg-red-50 text-red-800 border-red-200', selected: 'border-red-500 ring-2 ring-red-200' },
  LISTAR: { base: 'bg-slate-50 text-slate-700 border-slate-200', selected: 'border-slate-500 ring-2 ring-slate-200' },
}
const NOMES_ITEM: Record<string, string> = {
  CLIENTE: 'Clientes',
  OS: 'Ordens de Serviço',
  TECNICO: 'Técnicos',
  CARGO: 'Cargos',
  USUARIO: 'Usuários',
}
const ORDEM_ITENS: Record<string, string[]> = {
  AGENDAMENTO: ['CLIENTE', 'OS', 'TECNICO'],
  CONFIG: ['CARGO', 'USUARIO'],
}
const ORDEM_ACOES = ['LISTAR', 'CRIAR', 'EDITAR', 'EXCLUIR']

// Agrupa permissões por setor > item > ação (formato: SETOR.ITEM.AÇÃO)
function agruparPermissoes(permissoes: Permission[]) {
  const estrutura: Record<
    string,
    Record<string, { acao: string; permissao: Permission }[]>
  > = {}

  for (const p of permissoes) {
    const [setor, item, acao] = p.code.split('.')
    if (!setor || !item || !acao) continue
    if (!estrutura[setor]) estrutura[setor] = {}
    if (!estrutura[setor][item]) estrutura[setor][item] = []
    estrutura[setor][item].push({ acao, permissao: p })
  }

  // Ordenar ações dentro de cada item
  for (const setor of Object.keys(estrutura)) {
    for (const item of Object.keys(estrutura[setor])) {
      estrutura[setor][item].sort(
        (a, b) => ORDEM_ACOES.indexOf(a.acao) - ORDEM_ACOES.indexOf(b.acao)
      )
    }
  }

  return estrutura
}

interface Cargo {
  id: number
  code: string
  nome: string
  setor: { code: string; nome: string }
  cargoPermissoes: { permissaoId: number }[]
}

export function CargosPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [editCargoId, setEditCargoId] = useState<number | null>(null)
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([])
  const canEdit = hasPermission('CONFIG.CARGO.EDITAR')

  const { data: cargos = [], isLoading } = useQuery<Cargo[]>({
    queryKey: ['roles'],
    queryFn: () => api('/roles'),
  })

  const { data: permissoes = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api('/roles/permissions'),
    enabled: !!editCargoId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ cargoId, permissaoIds }: { cargoId: number; permissaoIds: number[] }) =>
      api(`/roles/${cargoId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissionIds: permissaoIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setEditCargoId(null)
      toast.success('Permissões atualizadas')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  function openEdit(cargo: Cargo) {
    setEditCargoId(cargo.id)
    setSelectedPermIds(cargo.cargoPermissoes.map((cp) => cp.permissaoId))
  }

  function togglePermission(id: number) {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleSave() {
    if (!editCargoId) return
    updateMutation.mutate({ cargoId: editCargoId, permissaoIds: selectedPermIds })
  }

  const porSetor = cargos.reduce<Record<string, Cargo[]>>((acc, c) => {
    const key = c.setor.nome
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-condensed uppercase">Cargos e Permissões</h1>
      <p className="text-muted-foreground">
        Gerencie as permissões de cada cargo por setor.
      </p>

      <div className="space-y-6">
        {Object.entries(porSetor).map(([setorNome, setorCargos]) => (
          <Card key={setorNome} className="rounded-none border-slate-300">
            <CardHeader>
              <CardTitle>{setorNome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {setorCargos.map((cargo) => (
                <div
                  key={cargo.id}
                  className="flex items-center justify-between border border-slate-300 p-3 bg-white"
                >
                  <div>
                    <p className="font-medium">{cargo.nome}</p>
                    <p className="text-sm text-muted-foreground">{cargo.code}</p>
                  </div>
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(cargo)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Permissões
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editCargoId} onOpenChange={(v) => !v && setEditCargoId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões do cargo</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {(() => {
              const estrutura = agruparPermissoes(permissoes)
              return ['AGENDAMENTO', 'CONFIG'].map((setor) => {
                const itens = estrutura[setor]
              if (!itens) return null
              const setorLabel = setor === 'AGENDAMENTO' ? 'Agendamento' : 'Configuração'
              const ordemItens = ORDEM_ITENS[setor] ?? Object.keys(itens)
              return (
                <div key={setor} className="space-y-4">
                  <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {setorLabel}
                  </h3>
                  <div className="space-y-4 pl-2">
                    {ordemItens.map((item) => {
                      const acoes = itens[item]
                      if (!acoes?.length) return null
                      return (
                        <div key={item} className="space-y-2">
                          <p className="text-sm font-medium text-foreground">
                            {NOMES_ITEM[item] ?? item}
                          </p>
                          <div className="flex flex-wrap gap-2 pl-2">
                            {acoes.map(({ acao, permissao }) => {
                              const checked = selectedPermIds.includes(permissao.id)
                              const cores = CORES_ACAO[acao] ?? { base: 'bg-muted text-muted-foreground border-muted-foreground/20', selected: 'border-muted-foreground/40 ring-2 ring-muted-foreground/20' }
                              return (
                                <button
                                  key={permissao.id}
                                  type="button"
                                  onClick={() => togglePermission(permissao.id)}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    cores.base
                                  } ${checked ? cores.selected : 'hover:brightness-95'}`}
                                >
                                  {checked && <Check className="h-4 w-4 shrink-0" />}
                                  {NOMES_ACAO[acao] ?? acao}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCargoId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
