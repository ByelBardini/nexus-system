import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { MaterialIcon } from '@/components/MaterialIcon'

const tipoLabels: Record<string, string> = {
  INSTALACAO_COM_BLOQUEIO: 'Instalação c/ bloqueio',
  INSTALACAO_SEM_BLOQUEIO: 'Instalação s/ bloqueio',
  REVISAO: 'Revisão',
  RETIRADA: 'Retirada',
  DESLOCAMENTO: 'Deslocamento',
}

const statusLabels: Record<string, string> = {
  AGENDADO: 'Agendado',
  EM_TESTES: 'Em Testes',
  TESTES_REALIZADOS: 'Testes Realizados',
  AGUARDANDO_CADASTRO: 'Ag. Cadastro',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

const statusColors: Record<string, string> = {
  AGENDADO: 'bg-erp-yellow/10 text-yellow-800 border-erp-yellow/30',
  EM_TESTES: 'bg-erp-blue/10 text-erp-blue border-erp-blue/30',
  TESTES_REALIZADOS: 'bg-erp-purple/10 text-purple-800 border-erp-purple/30',
  AGUARDANDO_CADASTRO: 'bg-erp-orange/10 text-orange-800 border-erp-orange/30',
  FINALIZADO: 'bg-erp-green/10 text-green-800 border-erp-green/30',
  CANCELADO: 'bg-slate-200 text-slate-600 border-slate-400',
}

interface Resumo {
  agendado: number
  emTestes: number
  testesRealizados: number
  aguardandoCadastro: number
  finalizado: number
}

interface OrdemServico {
  id: number
  numero: number
  tipo: string
  status: string
  cliente: { id: number; nome: string }
  subcliente?: { id: number; nome: string } | null
  veiculo?: { id: number; placa: string } | null
  tecnico?: { id: number; nome: string } | null
  criadoEm: string
}

interface PaginatedResult {
  items: OrdemServico[]
  total: number
  page: number
  limit: number
  totalPages: number
}


function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OrdensServicoPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('TODOS')
  const canCreate = hasPermission('AGENDAMENTO.OS.CRIAR')

  const { data: resumo, isLoading: loadingResumo } = useQuery<Resumo>({
    queryKey: ['ordens-servico', 'resumo'],
    queryFn: () => api('/ordens-servico/resumo'),
  })

  const { data: lista, isLoading: loadingLista } = useQuery<PaginatedResult>({
    queryKey: ['ordens-servico', page, search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '15')
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'TODOS') params.set('status', statusFilter)
      return api(`/ordens-servico?${params}`)
    },
  })



  if (loadingResumo) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalOrdens =
    (resumo?.agendado ?? 0) +
    (resumo?.emTestes ?? 0) +
    (resumo?.testesRealizados ?? 0) +
    (resumo?.aguardandoCadastro ?? 0) +
    (resumo?.finalizado ?? 0)

  function handleStatusClick(status: string) {
    setStatusFilter(status)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex w-full min-h-[88px] shadow-sm border border-slate-300 bg-white">
        <button
          onClick={() => handleStatusClick('TODOS')}
          className={cn(
            'pipeline-item flex-1 bg-slate-50 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            statusFilter === 'TODOS' && 'border-t-2 border-b-2 border-t-blue-500 border-b-blue-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Total
            </span>
            <span className="text-lg font-black text-slate-800">{totalOrdens}</span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick('AGENDADO')}
          className={cn(
            'pipeline-item flex-1 bg-yellow-50 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            statusFilter === 'AGENDADO' && 'border-t-2 border-b-2 border-t-yellow-500 border-b-yellow-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-yellow pl-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Agendado
            </span>
            <span className="text-lg font-black text-slate-800">{resumo?.agendado ?? 0}</span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick('EM_TESTES')}
          className={cn(
            'pipeline-item flex-1 bg-blue-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            statusFilter === 'EM_TESTES' && 'border-t-2 border-b-2 border-t-blue-500 border-b-blue-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Em Testes
            </span>
            <span className="text-lg font-black text-slate-800">{resumo?.emTestes ?? 0}</span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick('TESTES_REALIZADOS')}
          className={cn(
            'pipeline-item flex-1 bg-purple-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            statusFilter === 'TESTES_REALIZADOS' && 'border-t-2 border-b-2 border-t-purple-500 border-b-purple-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-purple pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Testes Realizados
            </span>
            <span className="text-lg font-black text-slate-800">
              {resumo?.testesRealizados ?? 0}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick('AGUARDANDO_CADASTRO')}
          className={cn(
            'pipeline-item flex-1 bg-orange-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            statusFilter === 'AGUARDANDO_CADASTRO' && 'border-t-2 border-b-2 border-t-orange-500 border-b-orange-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-orange pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Aguardando Cadastro
            </span>
            <span className="text-lg font-black text-slate-800">
              {resumo?.aguardandoCadastro ?? 0}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick('FINALIZADO')}
          className={cn(
            'pipeline-item flex-1 bg-green-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            statusFilter === 'FINALIZADO' && 'border-t-2 border-b-2 border-t-green-500 border-b-green-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-green pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Finalizado
            </span>
            <span className="text-lg font-black text-slate-800">{resumo?.finalizado ?? 0}</span>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <MaterialIcon
            name="search"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <Input
            className="pl-8 text-[11px]"
            placeholder="Buscar OS, placa ou cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canCreate && (
            <Button
              onClick={() => navigate('/ordens-servico/nova')}
              className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase"
            >
              <MaterialIcon name="add" className="text-sm mr-1" />
              Nova OS
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse erp-table font-condensed">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>OS #</th>
                <th>Cliente</th>
                <th>Subcliente</th>
                <th>Placa</th>
                <th>Técnico</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Última Mov.</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-medium uppercase tracking-tight">
              {loadingLista ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : lista?.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nenhuma ordem de serviço
                  </td>
                </tr>
              ) : (
                lista?.items.map((os) => (
                  <tr key={os.id} className="hover:bg-slate-50">
                    <td>
                      <MaterialIcon name="chevron_right" className="text-base text-slate-400" />
                    </td>
                    <td className="font-bold text-slate-950">#{os.numero}</td>
                    <td>{os.cliente?.nome ?? '-'}</td>
                    <td>{os.subcliente?.nome ?? '-'}</td>
                    <td className="font-bold">{os.veiculo?.placa ?? '-'}</td>
                    <td>{os.tecnico?.nome ?? '-'}</td>
                    <td>{tipoLabels[os.tipo] ?? os.tipo}</td>
                    <td>
                      <span
                        className={`px-1.5 py-0.5 border ${
                          statusColors[os.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {statusLabels[os.status] ?? os.status}
                      </span>
                    </td>
                    <td className="text-slate-500">{formatDate(os.criadoEm)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="p-1 hover:bg-slate-200 transition-colors"
                        aria-label="Mais"
                      >
                        <MaterialIcon name="more_vert" className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-300 flex justify-between items-center bg-slate-50">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            Exibindo {(lista?.page ?? 1) * (lista?.limit ?? 15) - (lista?.limit ?? 15) + 1}-
            {Math.min((lista?.page ?? 1) * (lista?.limit ?? 15), lista?.total ?? 0)} de{' '}
            {lista?.total ?? 0} ordens
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold h-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, lista?.totalPages ?? 1) }, (_, i) => i + 1).map(
              (p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className={`text-[10px] font-bold h-7 ${p === page ? 'bg-slate-900' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold h-7"
              disabled={page >= (lista?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
