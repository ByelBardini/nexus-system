import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
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
          ? 'bg-erp-blue border-erp-blue text-white shadow-sm'
          : 'bg-white border-slate-300 hover:border-slate-400'
      )}
    >
      {checked && (
        <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
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
          ? 'bg-emerald-600 border-emerald-600 text-white'
          : 'bg-white border-slate-300 hover:border-slate-400'
      )}
    >
      {checked && (
        <svg className="w-3 h-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
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
  ADMINISTRATIVO: 'Administrativo',
  CONFIGURACAO: 'Configuração',
  AGENDAMENTO: 'Agendamento & Ordens',
}

const NOMES_ITEM: Record<string, string> = {
  CARGO: 'Cargos',
  USUARIO: 'Usuários',
  APARELHO: 'Aparelhos',
  EQUIPAMENTO: 'Equipamentos',
  CLIENTE: 'Clientes',
  OS: 'Ordens de Serviço',
  PEDIDO_RASTREADOR: 'Pedidos de Rastreadores',
  TECNICO: 'Técnicos',
  TESTES: 'Testes de Aparelhos',
}

const NOMES_ACAO: Record<string, string> = {
  LISTAR: 'Visualizar',
  CRIAR: 'Criar',
  EDITAR: 'Editar',
  EXCLUIR: 'Deletar',
  EXECUTAR: 'Executar',
}

const ORDEM_SETORES = ['ADMINISTRATIVO', 'CONFIGURACAO', 'AGENDAMENTO']
const ORDEM_ITENS: Record<string, string[]> = {
  ADMINISTRATIVO: ['CARGO', 'USUARIO'],
  CONFIGURACAO: ['APARELHO', 'EQUIPAMENTO'],
  AGENDAMENTO: ['CLIENTE', 'OS', 'TESTES', 'PEDIDO_RASTREADOR', 'TECNICO'],
}
const ORDEM_ACOES = ['LISTAR', 'CRIAR', 'EDITAR', 'EXCLUIR', 'EXECUTAR']

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

export interface CargoModalProps {
  open: boolean
  cargo: Cargo | null
  isNew: boolean
  onClose: () => void
  permissoes: Permission[]
  setores: Setor[]
}

export function CargoModal({ open, cargo, isNew, onClose, permissoes, setores }: CargoModalProps) {
  const queryClient = useQueryClient()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState<CategoriaCargo>('OPERACIONAL')
  const [ativo, setAtivo] = useState(true)
  const [setorId, setSetorId] = useState<number>(0)
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([])
  const [expandedSectors, setExpandedSectors] = useState<string[]>(['ADMINISTRATIVO', 'CONFIGURACAO', 'AGENDAMENTO'])

  useEffect(() => {
    if (cargo) {
      setNome(cargo.nome)
      setDescricao(cargo.descricao || '')
      setCategoria(cargo.categoria)
      setAtivo(cargo.ativo)
      setSetorId(cargo.setor.id)
      setSelectedPermIds(cargo.cargoPermissoes.map((cp) => cp.permissaoId))
    } else {
      setNome('')
      setDescricao('')
      setCategoria('OPERACIONAL')
      setAtivo(true)
      setSetorId(setores[0]?.id || 0)
      setSelectedPermIds([])
    }
  }, [cargo, setores])

  const createMutation = useMutation({
    mutationFn: async (data: { nome: string; code: string; setorId: number; descricao: string; categoria: CategoriaCargo; permissionIds: number[] }) => {
      const created = await api<{ id: number }>('/roles', {
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
    mutationFn: async (data: { id: number; nome: string; descricao: string; categoria: CategoriaCargo; ativo: boolean; permissionIds: number[] }) => {
      await Promise.all([
        api(`/roles/${data.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nome: data.nome,
            descricao: data.descricao,
            categoria: data.categoria,
            ativo: data.ativo,
          }),
        }),
        api(`/roles/${data.id}/permissions`, {
          method: 'PATCH',
          body: JSON.stringify({ permissionIds: data.permissionIds }),
        }),
      ])
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
        const [, item, acao] = p.code.split('.')
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
    const allPermIds = Object.values(setorItens).flat().map((a) => a.permissao.id)
    if (checked) {
      setSelectedPermIds((prev) => [...new Set([...prev, ...allPermIds])])
    } else {
      setSelectedPermIds((prev) => prev.filter((id) => !allPermIds.includes(id)))
    }
  }

  function isSectorFullySelected(setor: string) {
    const setorItens = estrutura[setor]
    if (!setorItens) return false
    const allPermIds = Object.values(setorItens).flat().map((a) => a.permissao.id)
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
        ativo,
        permissionIds: selectedPermIds,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const categoriaConfig = CATEGORIA_CONFIG[categoria]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent hideClose className="max-w-[1000px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-sm">
        <header className="bg-white border-b border-slate-200 p-6 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MaterialIcon name="add_moderator" className="text-erp-blue font-bold" />
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                {isNew ? 'Novo Cargo' : 'Editar Cargo'}
              </h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Nome do Cargo</Label>
              <Input
                className="w-full h-10 mt-1"
                placeholder="Ex: Operador Logístico Nível II"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Categoria</Label>
              <Select value={categoria} onValueChange={(v: CategoriaCargo) => setCategoria(v)}>
                <SelectTrigger className="h-10 mt-1">
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
              <Label className="text-[10px] font-bold uppercase text-slate-500">Descrição</Label>
              <Input
                className="w-full h-10 mt-1"
                placeholder="Breve descrição das responsabilidades..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            {!isNew && (
              <div className="col-span-12 flex items-center gap-2 pt-2">
                <Checkbox
                  id="cargoAtivo"
                  checked={ativo}
                  onCheckedChange={(checked) => setAtivo(checked === true)}
                />
                <Label htmlFor="cargoAtivo" className="text-sm font-medium cursor-pointer">
                  Cargo ativo (desmarque para inativar)
                </Label>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto border-r border-slate-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                <div key={setor} className="border-b border-slate-100">
                  <div
                    className="flex items-center justify-between bg-slate-50 px-4 py-2 border-y border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSectorExpanded(setor)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        {NOMES_SETOR[setor] || setor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Acesso Total ao Setor</span>
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
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">Recurso</th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">Visualizar</th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">Criar</th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">Editar</th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">Deletar</th>
                          <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">Executar</th>
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
                            <tr key={item} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                              <td className="px-4 py-2 text-xs font-medium text-slate-600">{NOMES_ITEM[item] || item}</td>
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

          <aside className="w-72 bg-slate-50 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
            <div className="sticky top-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Resumo do Cargo</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Nome Visualizado</Label>
                  <div className="text-sm font-semibold text-slate-700 italic mt-1">{nome || '— Definir Nome —'}</div>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Categoria Selecionada</Label>
                  <div className={cn('text-[10px] font-bold uppercase inline-flex items-center px-2 py-0.5 rounded border mt-1', categoria ? categoriaConfig.className : 'bg-slate-200 text-slate-500 border-slate-300')}>
                    {categoria ? categoriaConfig.label : 'Não Especificada'}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">Permissões Ativas</span>
                    <span className="bg-erp-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                      <div className="text-[10px] text-slate-400 italic">+ {permissoesAtivas.length - 10} permissões...</div>
                    )}
                    {permissoesAtivas.length === 0 && (
                      <div className="text-[10px] text-slate-400 italic">Nenhuma permissão selecionada</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-1">
                  <MaterialIcon name="info" className="text-[14px]" />
                  Lógica de Acesso:
                </span>
                Permissões de <strong>Criar</strong> ou <strong>Editar</strong> habilitam automaticamente a permissão de <strong>Visualizar</strong> para o recurso correspondente.
              </div>
            </div>
          </aside>
        </div>

        <footer className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <MaterialIcon name="lock" className="text-sm" />
            Segurança Industrial Garantida
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="px-6 h-10 text-xs font-bold text-slate-600 hover:text-slate-800 uppercase" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold h-10 px-8 rounded-sm shadow-sm uppercase tracking-wide"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? 'Salvando...' : 'Salvar Cargo'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
