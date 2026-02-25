import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
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
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  cnpj: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Cliente {
  id: number
  nome: string
  cnpj: string | null
}

export function ClientesPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const canCreate = hasPermission('AGENDAMENTO.CLIENTE.CRIAR')
  const canEdit = hasPermission('AGENDAMENTO.CLIENTE.EDITAR')

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => api('/clientes'),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api('/clientes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setOpenCreate(false)
      toast.success('Cliente criado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      api(`/clientes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setEditingId(null)
      toast.success('Cliente atualizado')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro'),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', cnpj: '' },
  })

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', cnpj: '' },
  })

  function handleCreateSubmit(data: FormData) {
    createMutation.mutate(data)
  }

  function handleEditSubmit(data: FormData) {
    if (!editingId) return
    updateMutation.mutate({ id: editingId, data })
  }

  function openEdit(cliente: Cliente) {
    editForm.reset({ nome: cliente.nome, cnpj: cliente.cnpj ?? '' })
    setEditingId(cliente.id)
  }

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
        <h1 className="text-2xl font-bold font-condensed uppercase">Clientes</h1>
        {canCreate && (
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        )}
      </div>
      <div className="border border-slate-300 shadow-sm overflow-hidden bg-white">
        <Table className="erp-table font-condensed">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.nome}</TableCell>
                <TableCell>{c.cnpj ?? '-'}</TableCell>
                <TableCell>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
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
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...form.register('nome')} />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>CNPJ (opcional)</Label>
              <Input {...form.register('cnpj')} placeholder="00.000.000/0001-00" />
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
            <DialogTitle>Editar cliente</DialogTitle>
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
              <Label>CNPJ (opcional)</Label>
              <Input {...editForm.register('cnpj')} placeholder="00.000.000/0001-00" />
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
