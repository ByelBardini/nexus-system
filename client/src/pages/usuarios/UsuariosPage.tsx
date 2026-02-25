import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const schemaCreate = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(4, 'Mínimo 4 caracteres'),
  ativo: z.boolean(),
})

const schemaEdit = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  ativo: z.boolean(),
})

type FormCreate = z.infer<typeof schemaCreate>
type FormEdit = z.infer<typeof schemaEdit>

interface User {
  id: number
  nome: string
  email: string
  ativo: boolean
  createdAt: string
  usuarioCargos?: { cargo: { id: number; nome: string; setor: { nome: string } } }[]
}

interface Cargo {
  id: number
  code: string
  nome: string
  setor: { id: number; code: string; nome: string }
}

export function UsuariosPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const canCreate = hasPermission('CONFIG.USUARIO.CRIAR')
  const canEdit = hasPermission('CONFIG.USUARIO.EDITAR')

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api('/users'),
  })

  const { data: cargos = [] } = useQuery<Cargo[]>({
    queryKey: ['roles'],
    queryFn: () => api('/roles'),
    enabled: !!editingId,
  })

  const createMutation = useMutation({
    mutationFn: (data: FormCreate) =>
      api('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpenCreate(false)
      toast.success('Usuário criado')
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
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingId(null)
      toast.success('Usuário atualizado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const createForm = useForm<FormCreate>({
    resolver: zodResolver(schemaCreate),
    defaultValues: { nome: '', email: '', password: '', ativo: true } as FormCreate,
  })

  const editForm = useForm<FormEdit>({
    resolver: zodResolver(schemaEdit),
    defaultValues: { nome: '', email: '', password: '', ativo: true },
  })

  function handleCreateSubmit(data: FormCreate) {
    createMutation.mutate(data)
  }

  function handleEditSubmit(data: FormEdit) {
    if (!editingId) return
    const payload = data.password ? data : { ...data, password: undefined }
    updateMutation.mutate({ id: editingId, data: payload, roleIds: selectedRoleIds })
  }

  function openEdit(usuario: User) {
    editForm.reset({
      nome: usuario.nome,
      email: usuario.email,
      password: '',
      ativo: usuario.ativo,
    })
    setSelectedRoleIds(usuario.usuarioCargos?.map((uc) => uc.cargo.id) ?? [])
    setEditingId(usuario.id)
  }

  function toggleRole(roleId: number) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const cargosPorSetor = cargos.reduce<Record<string, Cargo[]>>((acc, c) => {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-condensed uppercase">Usuários</h1>
        {canCreate && (
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Button>
        )}
      </div>
      <div className="border border-slate-300 shadow-sm overflow-hidden bg-white">
        <Table className="erp-table font-condensed">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Cargos</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.ativo ? 'Sim' : 'Não'}</TableCell>
                <TableCell>
                  {u.usuarioCargos?.map((uc) => uc.cargo.nome).join(', ') ?? '-'}
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(u)}
                    >
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...createForm.register('nome')} />
              {createForm.formState.errors.nome && (
                <p className="text-sm text-destructive">{createForm.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...createForm.register('email')} />
              {createForm.formState.errors.email && (
                <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" {...createForm.register('password')} />
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ativo-create"
                checked={createForm.watch('ativo')}
                onCheckedChange={(v) => createForm.setValue('ativo', !!v)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...editForm.register('nome')} />
              {editForm.formState.errors.nome && (
                <p className="text-sm text-destructive">{editForm.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...editForm.register('email')} />
              {editForm.formState.errors.email && (
                <p className="text-sm text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label>Nova senha (opcional)</Label>
              <Input type="password" placeholder="Deixe em branco para manter" {...editForm.register('password')} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ativo-edit"
                checked={editForm.watch('ativo')}
                onCheckedChange={(v) => editForm.setValue('ativo', !!v)}
              />
              <Label htmlFor="ativo-edit">Ativo</Label>
            </div>
            <div>
              <Label className="mb-2 block">Cargos</Label>
              <div className="space-y-3 rounded-md border p-3">
                {Object.entries(cargosPorSetor).map(([setorNome, setorCargos]) => (
                  <div key={setorNome}>
                    <p className="text-sm font-medium text-muted-foreground">{setorNome}</p>
                    <div className="mt-1 flex flex-wrap gap-3">
                      {setorCargos.map((cargo) => (
                        <div key={cargo.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`cargo-${cargo.id}`}
                            checked={selectedRoleIds.includes(cargo.id)}
                            onCheckedChange={() => toggleRole(cargo.id)}
                          />
                          <Label htmlFor={`cargo-${cargo.id}`} className="text-sm font-normal">
                            {cargo.nome}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
