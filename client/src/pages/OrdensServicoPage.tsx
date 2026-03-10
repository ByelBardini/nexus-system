import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, apiDownloadBlob } from '@/lib/api'
import { formatarCEP, formatarCPFCNPJ, formatarDataHora, formatarDataHoraCurta, TIPO_OS_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { MaterialIcon } from '@/components/MaterialIcon'
import { toast } from 'sonner'

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
  subclienteSnapshotNome?: string | null
  veiculo?: { id: number; placa: string } | null
  tecnico?: { id: number; nome: string } | null
  criadoEm: string
}

interface PaginatedResult {
  data: OrdemServico[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type SubclienteParaExibicao = {
  id?: number
  nome: string
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cep?: string | null
  cidade?: string | null
  estado?: string | null
  cpf?: string | null
  email?: string | null
}

interface OrdemServicoDetalhe {
  id: number
  numero: number
  tipo: string
  status: string
  observacoes: string | null
  criadoEm: string
  idAparelho?: string | null
  localInstalacao?: string | null
  posChave?: string | null
  cliente: { id: number; nome: string }
  subcliente?: SubclienteParaExibicao | null
  subclienteSnapshotNome?: string | null
  subclienteSnapshotLogradouro?: string | null
  subclienteSnapshotNumero?: string | null
  subclienteSnapshotComplemento?: string | null
  subclienteSnapshotBairro?: string | null
  subclienteSnapshotCidade?: string | null
  subclienteSnapshotEstado?: string | null
  subclienteSnapshotCep?: string | null
  subclienteSnapshotCpf?: string | null
  subclienteSnapshotEmail?: string | null
  tecnico?: {
    id: number
    nome: string
    cep?: string | null
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    bairro?: string | null
    cidadeEndereco?: string | null
    estadoEndereco?: string | null
  } | null
  veiculo?: { id: number; placa: string } | null
  criadoPor?: { id: number; nome: string } | null
}

/** Usa snapshot do subcliente quando disponível (preserva dados no momento da criação). */
function getSubclienteParaExibicao(os: OrdemServicoDetalhe): SubclienteParaExibicao | null {
  if (os.subclienteSnapshotNome != null && os.subclienteSnapshotNome !== '') {
    return {
      nome: os.subclienteSnapshotNome,
      logradouro: os.subclienteSnapshotLogradouro ?? undefined,
      numero: os.subclienteSnapshotNumero ?? undefined,
      complemento: os.subclienteSnapshotComplemento ?? undefined,
      bairro: os.subclienteSnapshotBairro ?? undefined,
      cidade: os.subclienteSnapshotCidade ?? undefined,
      estado: os.subclienteSnapshotEstado ?? undefined,
      cep: os.subclienteSnapshotCep ?? undefined,
      cpf: os.subclienteSnapshotCpf ?? undefined,
      email: os.subclienteSnapshotEmail ?? undefined,
    }
  }
  return os.subcliente ?? null
}

function formatEnderecoSubcliente(sub: SubclienteParaExibicao | null | undefined): string {
  if (!sub) return '-'
  const partes: string[] = []
  if (sub.logradouro) {
    let rua = sub.logradouro
    if (sub.numero) rua += `, ${sub.numero}`
    if (sub.complemento) rua += ` - ${sub.complemento}`
    partes.push(rua)
  }
  if (sub.bairro) partes.push(sub.bairro)
  if (sub.cidade || sub.estado) partes.push([sub.cidade, sub.estado].filter(Boolean).join(' - '))
  if (sub.cep) partes.push(`CEP ${formatarCEP(sub.cep)}`)
  return partes.length > 0 ? partes.join(', ') : sub.nome || '-'
}

function formatEnderecoTecnico(tec: OrdemServicoDetalhe['tecnico']): string {
  if (!tec) return '-'
  const partes: string[] = []
  if (tec.logradouro) {
    let rua = tec.logradouro
    if (tec.numero) rua += `, ${tec.numero}`
    if (tec.complemento) rua += ` - ${tec.complemento}`
    partes.push(rua)
  }
  if (tec.bairro) partes.push(tec.bairro)
  if (tec.cidadeEndereco || tec.estadoEndereco) {
    partes.push([tec.cidadeEndereco, tec.estadoEndereco].filter(Boolean).join(' - '))
  }
  if (tec.cep) partes.push(`CEP ${tec.cep}`)
  return partes.length > 0 ? partes.join(', ') : tec.nome || '-'
}

export function OrdensServicoPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('TODOS')
  const [expandedOsId, setExpandedOsId] = useState<number | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
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

  const { data: osDetalhe, isLoading: loadingDetalhe } = useQuery<OrdemServicoDetalhe>({
    queryKey: ['ordens-servico', 'detalhe', expandedOsId],
    queryFn: () => api(`/ordens-servico/${expandedOsId}`),
    enabled: !!expandedOsId,
  })

  const handleAbrirImpressao = async (id: number) => {
    setDownloadingPdf(true)
    try {
      const blob = await apiDownloadBlob(`/ordens-servico/${id}/pdf`, 30_000)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ordem-servico-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF baixado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }



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
              ) : lista?.data?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nenhuma ordem de serviço
                  </td>
                </tr>
              ) : (
                lista?.data?.map((os: OrdemServico) => {
                  const isExpanded = expandedOsId === os.id
                  return (
                    <Fragment key={os.id}>
                      <tr
                        key={os.id}
                        className={cn(
                          'hover:bg-slate-50 cursor-pointer transition-colors',
                          isExpanded && 'bg-slate-100/50 border-l-4 border-erp-blue'
                        )}
                        onClick={() => setExpandedOsId(isExpanded ? null : os.id)}
                      >
                        <td>
                          <MaterialIcon
                            name={isExpanded ? 'expand_more' : 'chevron_right'}
                            className={cn(
                              'text-base',
                              isExpanded ? 'text-erp-blue' : 'text-slate-400'
                            )}
                          />
                        </td>
                        <td
                          className={cn(
                            'font-bold',
                            isExpanded ? 'text-erp-blue' : 'text-slate-950'
                          )}
                        >
                          #{os.numero}
                        </td>
                        <td>{os.cliente?.nome ?? '-'}</td>
                        <td>{os.subclienteSnapshotNome ?? os.subcliente?.nome ?? '-'}</td>
                        <td className="font-bold">{os.veiculo?.placa ?? '-'}</td>
                        <td>{os.tecnico?.nome ?? '-'}</td>
                        <td>{TIPO_OS_LABELS[os.tipo] ?? os.tipo}</td>
                        <td>
                          <span
                            className={`px-1.5 py-0.5 border ${
                              statusColors[os.status] ?? 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {statusLabels[os.status] ?? os.status}
                          </span>
                        </td>
                        <td className="text-slate-500">{formatarDataHoraCurta(os.criadoEm)}</td>
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 hover:bg-slate-200 transition-colors"
                                aria-label="Mais ações"
                              >
                                <MaterialIcon name="more_vert" className="text-sm" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleAbrirImpressao(os.id)}
                                disabled={downloadingPdf}
                              >
                                {downloadingPdf ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Download className="h-4 w-4 mr-2" />
                                )}
                                Salvar PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="p-0 align-top">
                            <div className="border-t border-b border-slate-300 bg-white">
                              {loadingDetalhe ? (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                </div>
                              ) : osDetalhe && expandedOsId === os.id ? (
                                <div className="p-4 bg-slate-50/50 border-t border-slate-200">
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-3 text-[10px]">
                                    <div><span className="text-slate-400 font-semibold uppercase block">Emitido por</span><span className="font-bold text-slate-800">{osDetalhe.criadoPor?.nome ?? '-'}</span></div>
                                    <div><span className="text-slate-400 font-semibold uppercase block">Data</span><span className="font-bold text-slate-800">{formatarDataHora(osDetalhe.criadoEm)}</span></div>
                                    <div className="col-span-2"><span className="text-slate-400 font-semibold uppercase block">Tipo</span><span className="font-bold text-slate-800">{TIPO_OS_LABELS[osDetalhe.tipo] ?? osDetalhe.tipo}</span></div>
                                    {(() => {
                                      const sub = getSubclienteParaExibicao(osDetalhe)
                                      return (
                                        <>
                                          <div><span className="text-slate-400 font-semibold uppercase block">Endereço subcliente</span><span className="font-bold text-slate-800 text-[9px] leading-tight">{formatEnderecoSubcliente(sub)}</span></div>
                                          <div><span className="text-slate-400 font-semibold uppercase block">CPF/CNPJ</span><span className="font-bold text-slate-800">{formatarCPFCNPJ(sub?.cpf ?? '') || '-'}</span></div>
                                          <div><span className="text-slate-400 font-semibold uppercase block">E-mail subcliente</span><span className="font-bold text-slate-800 truncate block">{sub?.email || '-'}</span></div>
                                        </>
                                      )
                                    })()}
                                    <div><span className="text-slate-400 font-semibold uppercase block">Endereço técnico</span><span className="font-bold text-slate-800 text-[9px] leading-tight">{formatEnderecoTecnico(osDetalhe.tecnico)}</span></div>
                                    {['REVISAO', 'RETIRADA'].includes(osDetalhe.tipo) && (
                                      <>
                                        <div><span className="text-slate-400 font-semibold uppercase block">{osDetalhe.tipo === 'RETIRADA' ? 'ID a retirar' : 'ID a substituir'}</span><span className="font-bold text-slate-800">{osDetalhe.idAparelho || '-'}</span></div>
                                        <div><span className="text-slate-400 font-semibold uppercase block">Local instalação</span><span className="font-bold text-slate-800">{osDetalhe.localInstalacao || '-'}</span></div>
                                        <div><span className="text-slate-400 font-semibold uppercase block">Pós-chave</span><span className="font-bold text-slate-800">{osDetalhe.posChave === 'SIM' ? 'Sim' : osDetalhe.posChave === 'NAO' ? 'Não' : '-'}</span></div>
                                      </>
                                    )}
                                    {osDetalhe.observacoes && (
                                      <div className="col-span-full"><span className="text-slate-400 font-semibold uppercase block">Observações</span><p className="text-[9px] text-slate-700 whitespace-pre-wrap leading-tight">{osDetalhe.observacoes}</p></div>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
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
