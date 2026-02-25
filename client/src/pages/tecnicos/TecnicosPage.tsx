import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Loader2 } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InputPreco } from '@/components/InputPreco'
import { InputTelefone } from '@/components/InputTelefone'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useUFs, useMunicipios } from '@/hooks/useBrasilAPI'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  telefone: z.string().optional(),
  enderecoEntrega: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  ativo: z.boolean(),
  instalacaoComBloqueio: z.coerce.number().min(0),
  instalacaoSemBloqueio: z.coerce.number().min(0),
  revisao: z.coerce.number().min(0),
  retirada: z.coerce.number().min(0),
  deslocamento: z.coerce.number().min(0),
})

type FormData = z.infer<typeof schema>

interface Tecnico {
  id: number
  nome: string
  telefone: string | null
  enderecoEntrega: string | null
  cidade: string | null
  estado: string | null
  ativo: boolean
  precos?: {
    instalacaoComBloqueio: number | string
    instalacaoSemBloqueio: number | string
    revisao: number | string
    retirada: number | string
    deslocamento: number | string
  }
}

function toNum(v: number | string | undefined): number {
  if (v === undefined) return 0
  return typeof v === 'string' ? parseFloat(v) || 0 : v
}

export function TecnicosPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const canCreate = hasPermission('AGENDAMENTO.TECNICO.CRIAR')
  const canEdit = hasPermission('AGENDAMENTO.TECNICO.EDITAR')

  const { data: tecnicos = [], isLoading } = useQuery<Tecnico[]>({
    queryKey: ['tecnicos'],
    queryFn: () => api('/tecnicos'),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api('/tecnicos', {
        method: 'POST',
        body: JSON.stringify({
          nome: data.nome,
          telefone: data.telefone || undefined,
          enderecoEntrega: data.enderecoEntrega || undefined,
          cidade: data.cidade || undefined,
          estado: data.estado || undefined,
          ativo: data.ativo,
          precos: {
            instalacaoComBloqueio: data.instalacaoComBloqueio / 100,
            instalacaoSemBloqueio: data.instalacaoSemBloqueio / 100,
            revisao: data.revisao / 100,
            retirada: data.retirada / 100,
            deslocamento: data.deslocamento / 100,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnicos'] })
      setOpenCreate(false)
      toast.success('Técnico criado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      api(`/tecnicos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nome: data.nome,
          telefone: data.telefone || undefined,
          enderecoEntrega: data.enderecoEntrega || undefined,
          cidade: data.cidade || undefined,
          estado: data.estado || undefined,
          ativo: data.ativo,
          precos: {
            instalacaoComBloqueio: data.instalacaoComBloqueio / 100,
            instalacaoSemBloqueio: data.instalacaoSemBloqueio / 100,
            revisao: data.revisao / 100,
            retirada: data.retirada / 100,
            deslocamento: data.deslocamento / 100,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnicos'] })
      setEditingId(null)
      toast.success('Técnico atualizado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nome: '',
      telefone: '',
      enderecoEntrega: '',
      cidade: '',
      estado: '',
      ativo: true,
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    } as FormData,
  })

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nome: '',
      telefone: '',
      enderecoEntrega: '',
      cidade: '',
      estado: '',
      ativo: true,
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    } as FormData,
  })

  const estadoForMunicipios = openCreate ? form.watch('estado') : editingId ? editForm.watch('estado') : null
  const { data: ufs = [] } = useUFs()
  const { data: municipios = [] } = useMunicipios(estadoForMunicipios || null)

  useEffect(() => {
    if (!editingId || !municipios.length) return
    const cidade = editForm.getValues('cidade')
    if (!cidade) return
    const match = municipios.find((m) => m.nome.toLowerCase() === cidade.toLowerCase())
    if (match && cidade !== match.nome) {
      editForm.setValue('cidade', match.nome)
    }
  }, [editingId, municipios, editForm])

  function handleCreateSubmit(data: FormData) {
    createMutation.mutate(data)
  }

  function handleEditSubmit(data: FormData) {
    if (!editingId) return
    updateMutation.mutate({ id: editingId, data })
  }

  function openEdit(t: Tecnico) {
    editForm.reset({
      nome: t.nome,
      telefone: t.telefone ?? '',
      enderecoEntrega: t.enderecoEntrega ?? '',
      cidade: t.cidade ?? '',
      estado: t.estado ?? '',
      ativo: t.ativo,
      instalacaoComBloqueio: Math.round(toNum(t.precos?.instalacaoComBloqueio) * 100),
      instalacaoSemBloqueio: Math.round(toNum(t.precos?.instalacaoSemBloqueio) * 100),
      revisao: Math.round(toNum(t.precos?.revisao) * 100),
      retirada: Math.round(toNum(t.precos?.retirada) * 100),
      deslocamento: Math.round(toNum(t.precos?.deslocamento) * 100),
    })
    setEditingId(t.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const PrecosFields = ({ control: _control }: { control: 'form' | 'editForm' }) => {
    const f = _control === 'form' ? form : editForm
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <Label>Instalação c/ bloqueio</Label>
          <Controller
            name="instalacaoComBloqueio"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Instalação s/ bloqueio</Label>
          <Controller
            name="instalacaoSemBloqueio"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Revisão</Label>
          <Controller
            name="revisao"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Retirada</Label>
          <Controller
            name="retirada"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <Label>Deslocamento</Label>
          <Controller
            name="deslocamento"
            control={f.control}
            render={({ field }) => (
              <InputPreco value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-condensed uppercase">Técnicos</h1>
        {canCreate && (
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo técnico
          </Button>
        )}
      </div>
      <div className="border border-slate-300 shadow-sm overflow-hidden bg-white">
        <Table className="erp-table font-condensed">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tecnicos.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.nome}</TableCell>
                <TableCell>{t.telefone ?? '-'}</TableCell>
                <TableCell>{t.cidade ?? '-'}</TableCell>
                <TableCell>{t.ativo ? 'Sim' : 'Não'}</TableCell>
                <TableCell>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo técnico</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit as any)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...form.register('nome')} />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>Telefone</Label>
              <Controller
                name="telefone"
                control={form.control}
                render={({ field }) => (
                  <InputTelefone
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v)}
                  />
                )}
              />
            </div>
            <div>
              <Label>Endereço entrega</Label>
              <Input {...form.register('enderecoEntrega')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Estado (UF)</Label>
                <Controller
                  name="estado"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('cidade', '')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((uf) => (
                          <SelectItem key={uf.id} value={uf.sigla}>
                            {uf.sigla} - {uf.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Controller
                  name="cidade"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={!form.watch('estado')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipios.map((m) => (
                          <SelectItem key={m.codigo_ibge} value={m.nome}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div>
              <Label className="block mb-2">Tabela de preços</Label>
              <PrecosFields control="form" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo-create"
                checked={form.watch('ativo')}
                onChange={(e) => form.setValue('ativo', e.target.checked)}
              />
              <Label htmlFor="ativo-create">Ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingId} onOpenChange={(v) => !v && setEditingId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar técnico</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit as any)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...editForm.register('nome')} />
              {editForm.formState.errors.nome && (
                <p className="text-sm text-destructive">{editForm.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>Telefone</Label>
              <Controller
                name="telefone"
                control={editForm.control}
                render={({ field }) => (
                  <InputTelefone
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v)}
                  />
                )}
              />
            </div>
            <div>
              <Label>Endereço entrega</Label>
              <Input {...editForm.register('enderecoEntrega')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Estado (UF)</Label>
                <Controller
                  name="estado"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => {
                        field.onChange(v)
                        editForm.setValue('cidade', '')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((uf) => (
                          <SelectItem key={uf.id} value={uf.sigla}>
                            {uf.sigla} - {uf.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Controller
                  name="cidade"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={!editForm.watch('estado')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipios.map((m) => (
                          <SelectItem key={m.codigo_ibge} value={m.nome}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div>
              <Label className="block mb-2">Tabela de preços</Label>
              <PrecosFields control="editForm" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo-edit"
                checked={editForm.watch('ativo')}
                onChange={(e) => editForm.setValue('ativo', e.target.checked)}
              />
              <Label htmlFor="ativo-edit">Ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
