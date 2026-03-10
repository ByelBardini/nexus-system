import { useState, useMemo, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { STATUS_CONFIG_APARELHO, type StatusAparelho } from '@/lib/aparelho-status'
import { formatarDataHora } from '@/lib/format'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface Aparelho {
  id: number
  identificador?: string | null
  tipo: 'RASTREADOR' | 'SIM'
  marca?: string | null
  modelo?: string | null
  operadora?: string | null
  status: StatusAparelho
  proprietario: 'INFINITY' | 'CLIENTE'
  cliente?: { id: number; nome: string } | null
  simVinculado?: {
    id: number
    identificador: string
    operadora?: string | null
    marcaSimcard?: { id: number; nome: string } | null
    planoSimcard?: { id: number; planoMb: number } | null
  } | null
  kitId?: number | null
  kit?: { id: number; nome: string } | null
  tecnico?: { id: number; nome: string } | null
  lote?: { id: number; referencia: string } | null
  criadoEm: string
  atualizadoEm: string
  historico?: { statusAnterior: string; statusNovo: string; observacao?: string | null; criadoEm: string }[]
}

type PipelineFilter = 'TODOS' | 'CONFIGURADO' | 'EM_KIT' | 'DESPACHADO' | 'COM_TECNICO' | 'INSTALADO'

const PAGE_SIZE = 12

export function EquipamentosPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('CONFIGURACAO.APARELHO.CRIAR')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>('TODOS')
  const [statusFilter, setStatusFilter] = useState<string>('TODOS')
  const [page, setPage] = useState(0)

  const { data: aparelhos = [], isLoading } = useQuery<Aparelho[]>({
    queryKey: ['aparelhos'],
    queryFn: () => api('/aparelhos'),
  })

  const { data: kits = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ['aparelhos', 'pareamento', 'kits'],
    queryFn: () => api('/aparelhos/pareamento/kits'),
  })

  const kitsPorId = useMemo(() => new Map(kits.map((k) => [k.id, k.nome])), [kits])

  // Equipamentos = rastreadores com SIM vinculado
  const equipamentos = useMemo(() => {
    return aparelhos.filter(
      (a) => a.tipo === 'RASTREADOR' && a.simVinculado != null
    )
  }, [aparelhos])

  const pipelineCounts = useMemo(() => {
    const total = equipamentos.length
    const configurados = equipamentos.filter((e) => e.status === 'CONFIGURADO' && !e.kitId).length
    const emKit = equipamentos.filter((e) => e.status === 'CONFIGURADO' && e.kitId).length
    const despachados = equipamentos.filter((e) => e.status === 'DESPACHADO').length
    const comTecnico = equipamentos.filter((e) => e.status === 'COM_TECNICO').length
    const instalados = equipamentos.filter((e) => e.status === 'INSTALADO').length
    return { total, configurados, emKit, despachados, comTecnico, instalados }
  }, [equipamentos])

  const filtered = useMemo(() => {
    return equipamentos.filter((e) => {
      const matchBusca =
        !busca.trim() ||
        e.identificador?.toLowerCase().includes(busca.toLowerCase()) ||
        e.simVinculado?.identificador?.toLowerCase().includes(busca.toLowerCase()) ||
        e.tecnico?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        e.kitId?.toString().includes(busca) ||
        e.lote?.referencia?.toLowerCase().includes(busca.toLowerCase())

      const matchPipeline =
        pipelineFilter === 'TODOS' ||
        (pipelineFilter === 'CONFIGURADO' && e.status === 'CONFIGURADO' && !e.kitId) ||
        (pipelineFilter === 'EM_KIT' && e.status === 'CONFIGURADO' && e.kitId) ||
        (pipelineFilter === 'DESPACHADO' && e.status === 'DESPACHADO') ||
        (pipelineFilter === 'COM_TECNICO' && e.status === 'COM_TECNICO') ||
        (pipelineFilter === 'INSTALADO' && e.status === 'INSTALADO')

      const matchStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'CONFIGURADO' && e.status === 'CONFIGURADO' && !e.kitId) ||
        (statusFilter === 'EM_KIT' && e.status === 'CONFIGURADO' && !!e.kitId) ||
        (statusFilter === 'DESPACHADO' && e.status === 'DESPACHADO') ||
        (statusFilter === 'COM_TECNICO' && e.status === 'COM_TECNICO') ||
        (statusFilter === 'INSTALADO' && e.status === 'INSTALADO')

      return matchBusca && matchPipeline && matchStatus
    })
  }, [equipamentos, busca, pipelineFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  function handlePipelineClick(filter: PipelineFilter) {
    setPipelineFilter(filter)
    setStatusFilter(filter === 'TODOS' ? 'TODOS' : filter)
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
    <div className="space-y-4">
      {/* Cards de status */}
      <div className="flex w-full min-h-[88px] shadow-sm border border-slate-300 bg-white">
        <button
          onClick={() => handlePipelineClick('TODOS')}
          className={cn(
            'pipeline-item flex-1 bg-slate-50 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            pipelineFilter === 'TODOS' && 'border-t-2 border-b-2 border-t-blue-500 border-b-blue-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Total
            </span>
            <span className="text-lg font-black text-slate-800">
              {pipelineCounts.total}
            </span>
          </div>
        </button>
        <button
          onClick={() => handlePipelineClick('CONFIGURADO')}
          className={cn(
            'pipeline-item flex-1 bg-blue-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            pipelineFilter === 'CONFIGURADO' && 'border-t-2 border-b-2 border-t-blue-500 border-b-blue-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Configurados
            </span>
            <span className="text-lg font-black text-slate-800">
              {pipelineCounts.configurados}
            </span>
          </div>
        </button>
        <button
          onClick={() => handlePipelineClick('EM_KIT')}
          className={cn(
            'pipeline-item flex-1 bg-purple-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            pipelineFilter === 'EM_KIT' && 'border-t-2 border-b-2 border-t-purple-500 border-b-purple-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-purple-500 pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Em Kit
            </span>
            <span className="text-lg font-black text-slate-800">
              {pipelineCounts.emKit}
            </span>
          </div>
        </button>
        <button
          onClick={() => handlePipelineClick('DESPACHADO')}
          className={cn(
            'pipeline-item flex-1 bg-amber-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            pipelineFilter === 'DESPACHADO' && 'border-t-2 border-b-2 border-t-amber-500 border-b-amber-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-amber-500 pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Despachados
            </span>
            <span className="text-lg font-black text-slate-800">
              {pipelineCounts.despachados}
            </span>
          </div>
        </button>
        <button
          onClick={() => handlePipelineClick('COM_TECNICO')}
          className={cn(
            'pipeline-item flex-1 bg-orange-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors',
            pipelineFilter === 'COM_TECNICO' && 'border-t-2 border-b-2 border-t-orange-500 border-b-orange-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-orange pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Com Técnico
            </span>
            <span className="text-lg font-black text-slate-800">
              {pipelineCounts.comTecnico}
            </span>
          </div>
        </button>
        <button
          onClick={() => handlePipelineClick('INSTALADO')}
          className={cn(
            'pipeline-item flex-1 bg-green-100 p-3 flex flex-col justify-center text-left transition-colors',
            pipelineFilter === 'INSTALADO' && 'border-t-2 border-b-2 border-t-emerald-500 border-b-emerald-500'
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-green pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Instalados
            </span>
            <span className="text-lg font-black text-slate-800">
              {pipelineCounts.instalados}
            </span>
          </div>
        </button>
      </div>

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <MaterialIcon
            name="search"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <Input
            className="pl-8 text-[11px]"
            placeholder="Buscar IMEI, ICCID, Técnico, Kit..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPipelineFilter(v as PipelineFilter)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="CONFIGURADO">Configurado</SelectItem>
              <SelectItem value="EM_KIT">Em Kit</SelectItem>
              <SelectItem value="DESPACHADO">Despachado</SelectItem>
              <SelectItem value="COM_TECNICO">Com Técnico</SelectItem>
              <SelectItem value="INSTALADO">Instalado</SelectItem>
            </SelectContent>
          </Select>
          {canCreate && (
            <>
              <Link to="/equipamentos/pareamento">
                <Button variant="outline" className="text-[11px] font-bold uppercase">
                  <MaterialIcon name="build" className="text-sm mr-1" />
                  Montar Equipamento
                </Button>
              </Link>
              <Link to="/equipamentos/pareamento?modo=massa">
            <Button className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase">
              <MaterialIcon name="inventory_2" className="text-sm mr-1" />
              Cadastro em Lote
            </Button>
          </Link>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-16 pl-4 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                ID
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                IMEI & ICCID
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Marca / Operadora
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Status
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Kit
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Técnico
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Última Mov.
              </TableHead>
              <TableHead className="w-10 px-3 py-2.5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((equip) => {
              const isExpanded = expandedId === equip.id
              const statusConfig = STATUS_CONFIG_APARELHO[equip.status]
              const displayStatus =
                equip.status === 'CONFIGURADO' && equip.kitId
                  ? 'Em Kit'
                  : statusConfig.label

              return (
                <Fragment key={equip.id}>
                  <TableRow
                    className={cn(
                      'cursor-pointer border-b border-slate-100 hover:bg-blue-50/30 transition-colors bg-white',
                      isExpanded && 'border-l-4 border-l-blue-600 bg-blue-50/20'
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : equip.id)}
                  >
                    <TableCell className="pl-4 px-3 py-3">
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        #{equip.id}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <MaterialIcon name="sensors" className="text-[14px] text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">
                            {equip.identificador || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MaterialIcon name="sim_card" className="text-[14px] text-slate-400" />
                          <span className="text-[10px] font-mono text-slate-500">
                            {equip.simVinculado?.identificador || '-'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {equip.marca ? `${equip.marca} ${equip.modelo || ''}`.trim() : '-'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {equip.simVinculado?.operadora || '-'}
                        </span>
                        {(equip.simVinculado?.marcaSimcard?.nome || equip.simVinculado?.planoSimcard) && (
                          <span className="text-[10px] text-slate-500">
                            {[
                              equip.simVinculado?.marcaSimcard?.nome,
                              equip.simVinculado?.planoSimcard
                                ? `${equip.simVinculado.planoSimcard.planoMb} MB`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            equip.status === 'CONFIGURADO' && equip.kitId
                              ? 'bg-purple-500'
                              : statusConfig.dotColor
                          )}
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                          {displayStatus}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      {(equip.kit?.nome ?? (equip.kitId ? kitsPorId.get(equip.kitId) : null)) ? (
                        <span className="text-[11px] text-violet-600 font-bold">
                          {equip.kit?.nome ?? kitsPorId.get(equip.kitId!)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <span className="text-[11px] text-slate-400">
                        {equip.cliente?.nome ?? equip.tecnico?.nome ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatarDataHora(equip.atualizadoEm)}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedId(isExpanded ? null : equip.id)
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <MaterialIcon
                          name={isExpanded ? 'expand_less' : 'more_vert'}
                          className="text-xl"
                        />
                      </button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-white border-b border-slate-200">
                      <TableCell colSpan={9} className="p-6">
                        <div className="grid grid-cols-12 gap-8">
                          <div className="col-span-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 border-b border-slate-100 pb-1">
                              Dados Técnicos
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  IMEI / Identificação
                                </label>
                                <span className="text-xs font-bold text-slate-700">
                                  {equip.identificador || '-'}
                                </span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  Marca / Modelo
                                </label>
                                <span className="text-xs font-bold text-slate-700">
                                  {equip.marca ? `${equip.marca} / ${equip.modelo || '-'}` : '-'}
                                </span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  ICCID / Operadora
                                </label>
                                <span className="text-xs font-bold text-slate-700 block">
                                  {equip.simVinculado
                                    ? `${equip.simVinculado.identificador} (${equip.simVinculado.operadora || '-'})`
                                    : '-'}
                                </span>
                                {(equip.simVinculado?.marcaSimcard?.nome || equip.simVinculado?.planoSimcard) && (
                                  <span className="text-[10px] text-slate-500 mt-1 block">
                                    Marca: {equip.simVinculado.marcaSimcard?.nome || '-'}
                                    {equip.simVinculado.planoSimcard &&
                                      ` · Plano: ${equip.simVinculado.planoSimcard.planoMb} MB`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 border-b border-slate-100 pb-1">
                              Logística
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  Lotes Vinculados
                                </label>
                                <span className="text-xs font-bold text-slate-700">
                                  {equip.lote?.referencia || '-'}
                                </span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  Kit / Nota Fiscal
                                </label>
                                <span className="text-xs font-bold text-slate-700">
                                  {equip.kit?.nome ?? (equip.kitId ? kitsPorId.get(equip.kitId) : null) ?? '-'}
                                </span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  Transporte / Rastreio
                                </label>
                                <span className="text-xs font-bold text-slate-700">-</span>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 border-b border-slate-100 pb-1">
                              Destino
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  Técnico / Empresa
                                </label>
                                <span className="text-xs font-bold text-slate-700">
                                  {equip.cliente?.nome
                                    ? equip.cliente.nome
                                    : equip.tecnico
                                      ? `${equip.tecnico.nome} (ID: ${equip.tecnico.id})`
                                      : '-'}
                                </span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  Cliente Final
                                </label>
                                <span className="text-xs font-bold text-slate-700">
                                  {equip.cliente?.nome || '-'}
                                </span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-medium">
                                  Ordem / Instalação
                                </label>
                                <span className="text-xs font-bold text-slate-700">-</span>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 border-b border-slate-100 pb-1">
                              Histórico
                            </h4>
                            <div className="space-y-3">
                              {equip.historico && equip.historico.length > 0 ? (
                                equip.historico.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="relative pl-6 pb-4 border-l border-slate-200 last:pb-0 last:border-l-0"
                                  >
                                    <div
                                      className={cn(
                                        'absolute left-[-4.5px] top-1 w-2 h-2 rounded-full',
                                        idx === 0 ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-slate-300'
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-800">
                                        {STATUS_CONFIG_APARELHO[item.statusNovo as StatusAparelho]?.label ?? item.statusNovo}
                                      </span>
                                      <span className="text-[9px] text-slate-500">
                                        {formatarDataHora(item.criadoEm)}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">
                                  Sem histórico registrado
                                </p>
                              )}
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
                <TableCell
                  colSpan={9}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  Nenhum equipamento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-300 flex justify-between items-center bg-slate-50">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            Exibindo {paginated.length === 0 ? 0 : page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} equipamentos
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold h-7"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i
              if (totalPages > 5) {
                const half = Math.floor(5 / 2)
                let start = Math.max(0, page - half)
                if (start + 5 > totalPages) start = totalPages - 5
                p = start + i
              }
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className={`text-[10px] font-bold h-7 ${page === p ? 'bg-slate-900' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold h-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
