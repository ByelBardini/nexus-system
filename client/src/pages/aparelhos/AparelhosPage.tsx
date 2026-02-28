import { useState, useMemo, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Plus,
  Router,
  Smartphone,
} from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type StatusAparelho = 'EM_ESTOQUE' | 'CONFIGURADO' | 'DESPACHADO' | 'COM_TECNICO' | 'INSTALADO'
type TipoAparelho = 'RASTREADOR' | 'SIM'
type ProprietarioTipo = 'INFINITY' | 'CLIENTE'

interface Aparelho {
  id: number
  identificador?: string | null
  tipo: TipoAparelho
  marca?: string | null
  modelo?: string | null
  operadora?: string | null
  status: StatusAparelho
  proprietario: ProprietarioTipo
  cliente?: { id: number; nome: string } | null
  simVinculado?: { id: number; identificador: string; operadora?: string | null } | null
  kitId?: number | null
  tecnico?: { id: number; nome: string } | null
  lote?: { id: number; referencia: string } | null
  valorUnitario?: number | null
  criadoEm: string
  historico?: HistoricoItem[]
}

interface HistoricoItem {
  data: string
  acao: string
  descricao?: string
}

interface StatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}

const STATUS_CONFIG: Record<StatusAparelho, StatusConfig> = {
  EM_ESTOQUE: {
    label: 'Em Estoque',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: '🟡',
  },
  CONFIGURADO: {
    label: 'Configurado',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🔵',
  },
  DESPACHADO: {
    label: 'Despachado',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '🟣',
  },
  COM_TECNICO: {
    label: 'Com Técnico',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '🟠',
  },
  INSTALADO: {
    label: 'Instalado',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: '🟢',
  },
}

const TIPO_CONFIG: Record<TipoAparelho, { label: string; icon: typeof Router }> = {
  RASTREADOR: { label: 'Rastreador', icon: Router },
  SIM: { label: 'SIM Card', icon: Smartphone },
}

const PROPRIETARIO_CONFIG: Record<ProprietarioTipo, { label: string; className: string }> = {
  INFINITY: {
    label: 'Infinity',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  CLIENTE: {
    label: 'Cliente',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
}

const PAGE_SIZE = 15

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function AparelhosPage() {
  const { hasPermission } = useAuth()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusAparelho | 'TODOS'>('TODOS')
  const [tipoFilter, setTipoFilter] = useState<TipoAparelho | 'TODOS'>('TODOS')
  const [proprietarioFilter, setProprietarioFilter] = useState<ProprietarioTipo | 'TODOS'>('TODOS')
  const [marcaFilter, setMarcaFilter] = useState<string>('TODOS')
  const [page, setPage] = useState(0)

  const canCreate = hasPermission('CONFIGURACAO.APARELHO.CRIAR')

  const { data: aparelhos = [], isLoading } = useQuery<Aparelho[]>({
    queryKey: ['aparelhos'],
    queryFn: () => api('/aparelhos'),
  })

  const marcas = useMemo(() => {
    const set = new Set<string>()
    aparelhos.forEach((a) => {
      if (a.tipo === 'RASTREADOR' && a.marca) set.add(a.marca)
      if (a.tipo === 'SIM' && a.operadora) set.add(a.operadora)
    })
    return Array.from(set).sort()
  }, [aparelhos])

  const statusCounts = useMemo(() => {
    const counts: Record<StatusAparelho, number> = {
      EM_ESTOQUE: 0,
      CONFIGURADO: 0,
      DESPACHADO: 0,
      COM_TECNICO: 0,
      INSTALADO: 0,
    }
    aparelhos.forEach((a) => {
      counts[a.status]++
    })
    return counts
  }, [aparelhos])

  const totalCount = useMemo(() => {
    return Object.values(statusCounts).reduce((a, b) => a + b, 0)
  }, [statusCounts])

  const filtered = useMemo(() => {
    return aparelhos.filter((a) => {
      const matchBusca =
        !busca.trim() ||
        a.identificador?.toLowerCase().includes(busca.toLowerCase()) ||
        a.lote?.referencia?.toLowerCase().includes(busca.toLowerCase()) ||
        a.tecnico?.nome?.toLowerCase().includes(busca.toLowerCase())

      const matchStatus = statusFilter === 'TODOS' || a.status === statusFilter
      const matchTipo = tipoFilter === 'TODOS' || a.tipo === tipoFilter
      const matchProprietario = proprietarioFilter === 'TODOS' || a.proprietario === proprietarioFilter
      const matchMarca =
        marcaFilter === 'TODOS' ||
        (a.tipo === 'RASTREADOR' && a.marca === marcaFilter) ||
        (a.tipo === 'SIM' && a.operadora === marcaFilter)

      return matchBusca && matchStatus && matchTipo && matchProprietario && matchMarca
    })
  }, [aparelhos, busca, statusFilter, tipoFilter, proprietarioFilter, marcaFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  function handleStatusClick(status: StatusAparelho | 'TODOS') {
    setStatusFilter(status)
    setPage(0)
  }

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
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Aparelhos</h1>
            <p className="text-xs text-slate-500">Controle logístico de equipamentos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Busca Global</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 w-72 pl-9"
                placeholder="IMEI, ICCID, Lote, Kit, Técnico..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>
          {canCreate && (
            <>
              <div className="flex flex-col">
                <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500 opacity-0">Ação</Label>
                <Link to="/aparelhos/lote">
                  <Button
                    variant="outline"
                    className="h-9 gap-2 border-slate-300"
                  >
                    <MaterialIcon name="inventory_2" className="text-base" />
                    Entrada de Lote
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col">
                <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500 opacity-0">Ação</Label>
                <Button className="h-9 gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Criar Manual
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-8 py-3">
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusAparelho | 'TODOS')
              setPage(0)
            }}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {(Object.keys(STATUS_CONFIG) as StatusAparelho[]).map((status) => (
                <SelectItem key={status} value={status}>
                  <span className="flex items-center gap-2">
                    <span>{STATUS_CONFIG[status].icon}</span>
                    {STATUS_CONFIG[status].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Tipo</Label>
          <Select
            value={tipoFilter}
            onValueChange={(v) => {
              setTipoFilter(v as TipoAparelho | 'TODOS')
              setPage(0)
            }}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="RASTREADOR">Rastreador</SelectItem>
              <SelectItem value="SIM">SIM Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Pertence a</Label>
          <Select
            value={proprietarioFilter}
            onValueChange={(v) => {
              setProprietarioFilter(v as ProprietarioTipo | 'TODOS')
              setPage(0)
            }}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="INFINITY">Infinity</SelectItem>
              <SelectItem value="CLIENTE">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Marca / Operadora</Label>
          <Select
            value={marcaFilter}
            onValueChange={(v) => {
              setMarcaFilter(v)
              setPage(0)
            }}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas</SelectItem>
              {marcas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pipeline Visual */}
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStatusClick('TODOS')}
            className={cn(
              'flex items-center gap-2 rounded-l-md border px-4 py-2.5 transition-all',
              statusFilter === 'TODOS'
                ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-400 ring-offset-1'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            )}
          >
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
              {totalCount}
            </span>
          </button>

          {(Object.keys(STATUS_CONFIG) as StatusAparelho[]).map((status, index) => {
            const config = STATUS_CONFIG[status]
            const count = statusCounts[status]
            const isActive = statusFilter === status
            const isLast = index === Object.keys(STATUS_CONFIG).length - 1

            return (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                className={cn(
                  'flex items-center gap-2 border px-4 py-2.5 transition-all',
                  isLast && 'rounded-r-md',
                  isActive
                    ? cn(config.bgColor, config.borderColor, 'ring-2 ring-offset-1', config.color.replace('text-', 'ring-'))
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                )}
              >
                <span className="text-sm">{config.icon}</span>
                <span className={cn('text-sm font-medium', isActive ? config.color : 'text-slate-600')}>
                  {config.label}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    isActive ? cn(config.bgColor, config.color) : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-10 px-4 py-2" />
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Identificação
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tipo
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Marca / Operadora
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Proprietário
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  SIM/Rastreador Vinculado
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Kit
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Técnico
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Lote
                </TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Data Entrada
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((aparelho) => {
                const isExpanded = expandedId === aparelho.id
                const statusConfig = STATUS_CONFIG[aparelho.status]
                const tipoConfig = TIPO_CONFIG[aparelho.tipo]
                const TipoIcon = tipoConfig.icon
                const propConfig = PROPRIETARIO_CONFIG[aparelho.proprietario]

                return (
                  <Fragment key={aparelho.id}>
                    <TableRow
                      className={cn(
                        'cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors',
                        isExpanded && 'border-l-4 border-l-blue-600 bg-blue-50/30'
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : aparelho.id)}
                    >
                      <TableCell className="px-4 py-3 text-slate-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TipoIcon className="h-4 w-4 text-slate-400" />
                          <span className="font-mono text-sm font-medium text-slate-800">
                            {aparelho.identificador || `#${aparelho.id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase',
                            aparelho.tipo === 'RASTREADOR'
                              ? 'border-slate-200 bg-slate-100 text-slate-600'
                              : 'border-sky-200 bg-sky-50 text-sky-700'
                          )}
                        >
                          {tipoConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600">
                        {aparelho.tipo === 'RASTREADOR'
                          ? aparelho.marca || '-'
                          : aparelho.operadora || '-'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase',
                            propConfig.className
                          )}
                        >
                          {propConfig.label}
                        </span>
                        {aparelho.cliente && (
                          <p className="mt-0.5 text-[10px] text-slate-500 truncate max-w-[120px]">
                            {aparelho.cliente.nome}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase',
                            statusConfig.bgColor,
                            statusConfig.borderColor,
                            statusConfig.color
                          )}
                        >
                          <span>{statusConfig.icon}</span>
                          {statusConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {aparelho.simVinculado ? (
                          <span className="font-mono text-xs text-blue-600">
                            {aparelho.simVinculado.identificador}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {aparelho.tipo === 'RASTREADOR' ? 'Não vinculado' : 'Disponível'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {aparelho.kitId ? (
                          <span className="rounded-sm bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200">
                            KIT-{aparelho.kitId}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600">
                        {aparelho.tecnico?.nome || '-'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {aparelho.lote ? (
                          <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                            {aparelho.lote.referencia}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(aparelho.criadoEm)}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={11} className="border-b border-slate-200 p-0">
                          <div className="bg-slate-50 px-8 py-6">
                            <div className="grid grid-cols-3 gap-8">
                              <div>
                                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                  <MaterialIcon name="description" className="text-sm" />
                                  Dados do Equipamento
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      {aparelho.tipo === 'RASTREADOR' ? 'IMEI' : 'ICCID'}
                                    </span>
                                    <span className="font-mono font-bold text-slate-700">
                                      {aparelho.identificador || `#${aparelho.id}`}
                                    </span>
                                  </div>
                                  {aparelho.tipo === 'RASTREADOR' && (
                                    <>
                                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Marca</span>
                                        <span className="font-bold text-slate-700">{aparelho.marca || '-'}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Modelo</span>
                                        <span className="font-bold text-slate-700">{aparelho.modelo || '-'}</span>
                                      </div>
                                    </>
                                  )}
                                  {aparelho.tipo === 'SIM' && (
                                    <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                      <span className="text-slate-500">Operadora</span>
                                      <span className="font-bold text-slate-700">{aparelho.operadora || '-'}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Proprietário</span>
                                    <span className="font-bold text-slate-700">
                                      {propConfig.label}
                                      {aparelho.cliente && ` - ${aparelho.cliente.nome}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Valor Unitário</span>
                                    <span className="font-bold text-slate-700">
                                      {formatCurrency(aparelho.valorUnitario)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">Lote</span>
                                    <span className="font-bold text-slate-700">{aparelho.lote?.referencia || '-'}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                  <MaterialIcon name="link" className="text-sm" />
                                  Vínculos
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      {aparelho.tipo === 'RASTREADOR' ? 'SIM Vinculado' : 'Rastreador Vinculado'}
                                    </span>
                                    <span className={cn('font-bold', aparelho.simVinculado ? 'text-blue-600 font-mono' : 'text-slate-400 italic')}>
                                      {aparelho.simVinculado?.identificador || (aparelho.tipo === 'RASTREADOR' ? 'Não vinculado' : 'Disponível')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Kit</span>
                                    <span className={cn('font-bold', aparelho.kitId ? 'text-violet-600' : 'text-slate-400')}>
                                      {aparelho.kitId ? `KIT-${aparelho.kitId}` : '-'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Técnico</span>
                                    <span className={cn('font-bold', aparelho.tecnico ? 'text-slate-700' : 'text-slate-400')}>
                                      {aparelho.tecnico?.nome || '-'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">Ordem de Serviço</span>
                                    {aparelho.ordemServicoId ? (
                                      <span className="font-bold text-blue-600 hover:underline cursor-pointer">
                                        OS #{aparelho.ordemServicoId}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                  <MaterialIcon name="history" className="text-sm" />
                                  Histórico
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {aparelho.historico && aparelho.historico.length > 0 ? (
                                    aparelho.historico.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-3 border-l-2 border-slate-200 pl-3 py-1"
                                      >
                                        <div className="flex-1">
                                          <p className="text-[11px] font-bold text-slate-700">{item.acao}</p>
                                          {item.descricao && (
                                            <p className="text-[10px] text-slate-500">{item.descricao}</p>
                                          )}
                                          <p className="text-[9px] text-slate-400 mt-0.5">
                                            {formatDateTime(item.data)}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[11px] text-slate-400 italic">Sem histórico registrado</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="px-4 py-12 text-center text-sm text-slate-500">
                    Nenhum aparelho encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex h-12 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6">
          <div className="flex items-center gap-6">
            <span className="text-[11px] font-medium uppercase tracking-tight text-slate-500">
              Total de {filtered.length} aparelho{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4 text-[9px] text-slate-400 uppercase font-bold">
              <span className="flex items-center gap-1">
                <Router className="h-3 w-3" />
                {aparelhos.filter((a) => a.tipo === 'RASTREADOR').length} Rastreadores
              </span>
              <span className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                {aparelhos.filter((a) => a.tipo === 'SIM').length} SIM Cards
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs font-bold">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
