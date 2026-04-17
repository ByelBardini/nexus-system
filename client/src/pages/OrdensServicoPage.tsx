import { Fragment, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Download, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api, apiDownloadBlob } from '@/lib/api'
import {
  formatarCEP,
  formatarDataHora,
  formatarDataHoraCurta,
  formatarTelefone,
  formatarTempoMinutos,
  formatId,
  TIPO_OS_LABELS,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { MaterialIcon } from '@/components/MaterialIcon'
import { SearchableSelect } from '@/components/SearchableSelect'
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
  telefone?: string | null
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
  subclienteSnapshotTelefone?: string | null
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
  veiculo?: { id: number; placa: string; marca?: string; modelo?: string; ano?: number; cor?: string } | null
  criadoPor?: { id: number; nome: string } | null
  atualizadoEm?: string
  historico?: { statusAnterior: string; statusNovo: string; criadoEm: string; observacao?: string | null }[]
  plataforma?: string | null
  statusCadastro?: string | null
  concluidoEm?: string | null
  concluidoPor?: { id: number; nome: string } | null
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
      telefone: os.subclienteSnapshotTelefone ?? undefined,
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

function formatDadosVeiculo(
  v: OrdemServicoDetalhe['veiculo'] | null | undefined
): string {
  if (!v) return '-'
  const partes: string[] = [v.placa]
  if (v.marca || v.modelo) partes.push([v.marca, v.modelo].filter(Boolean).join(' '))
  if (v.ano) partes.push(String(v.ano))
  if (v.cor) partes.push(v.cor)
  return partes.length > 0 ? partes.join(' · ') : '-'
}

function getDadosTeste(os: OrdemServicoDetalhe) {
  const hist = os.historico ?? []
  const entradaEmTestes = hist.find((h) => h.statusNovo === 'EM_TESTES')?.criadoEm ?? null
  const saidaEmTestes = hist.find((h) => h.statusAnterior === 'EM_TESTES')?.criadoEm ?? null
  const now = new Date()
  let tempoMin = 0
  if (entradaEmTestes) {
    const fim = saidaEmTestes ? new Date(saidaEmTestes) : now
    tempoMin = Math.floor((fim.getTime() - new Date(entradaEmTestes).getTime()) / 60000)
  }
  return { entradaEmTestes, saidaEmTestes, tempoMin }
}

function getDadosRetirada(os: OrdemServicoDetalhe): { dataRetirada: string | null; aparelhoEncontrado: boolean | null } {
  const hist = os.historico ?? []
  const entry = hist.find((h) => h.statusNovo === 'AGUARDANDO_CADASTRO')
  const obs = entry?.observacao ?? ''
  let dataRetirada: string | null = null
  let aparelhoEncontrado: boolean | null = null
  const dataMatch = obs.match(/Data retirada:\s*([^|]+)/i)
  if (dataMatch) dataRetirada = dataMatch[1].trim()
  const encontradoMatch = obs.match(/Aparelho encontrado:\s*(Sim|Não)/i)
  if (encontradoMatch) aparelhoEncontrado = encontradoMatch[1].toLowerCase() === 'sim'
  return { dataRetirada, aparelhoEncontrado }
}

export function OrdensServicoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('TODOS')
  const [expandedOsId, setExpandedOsId] = useState<number | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [confirmIniciarOsId, setConfirmIniciarOsId] = useState<number | null>(null)
  const [showRetiradaModal, setShowRetiradaModal] = useState<number | null>(null)
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

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      observacao,
    }: {
      id: number
      status: string
      observacao?: string
    }) =>
      api(`/ordens-servico/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, observacao: observacao || undefined }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      toast.success(
        variables.status === 'AGUARDANDO_CADASTRO' ? 'Retirada registrada' : 'Status atualizado'
      )
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleIniciarTestes = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'EM_TESTES' })
  }

  const handleRetiradaConfirmar = (aparelhoEncontrado: boolean) => {
    const id = showRetiradaModal
    if (id == null) return
    setShowRetiradaModal(null)
    const hoje = new Date().toLocaleDateString('pt-BR')
    const obs = `Data retirada: ${hoje} | Aparelho encontrado: ${aparelhoEncontrado ? 'Sim' : 'Não'}`
    updateStatusMutation.mutate({ id, status: 'AGUARDANDO_CADASTRO', observacao: obs })
  }

  const handleEnviarParaCadastro = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'AGUARDANDO_CADASTRO' })
  }

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

      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Busca</label>
          <div className="relative w-64">
            <MaterialIcon
              name="search"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
            />
            <Input
              className="pl-8 text-[11px]"
              placeholder="OS, placa ou cliente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <SearchableSelect
              className="w-[180px]"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'TODOS', label: 'Todos' },
                ...Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
          </div>
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
                          #{formatId(os.numero)}
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
                              {os.status === 'EM_TESTES' && (
                                <DropdownMenuItem onClick={() => navigate(`/testes?osId=${os.id}`)}>
                                  <MaterialIcon name="biotech" className="text-sm mr-2" />
                                  Ir para Testes
                                </DropdownMenuItem>
                              )}
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
                                <div className="p-3 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* 1. Dados de Emissão */}
                                  <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
                                      <MaterialIcon name="description" className="text-slate-400 text-base" />
                                      <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                                        Dados de Emissão
                                      </h2>
                                    </div>
                                    <div className="p-3">
                                      {(() => {
                                        const sub = getSubclienteParaExibicao(osDetalhe)
                                        return (
                                          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                                            <div>
                                              <dt className="text-[10px] text-slate-500 uppercase font-medium">Emitido por</dt>
                                              <dd className="font-semibold text-slate-800">{osDetalhe.criadoPor?.nome ?? '-'}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-[10px] text-slate-500 uppercase font-medium">Data</dt>
                                              <dd className="font-semibold text-slate-800">{formatarDataHora(osDetalhe.criadoEm)}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-[10px] text-slate-500 uppercase font-medium">Tipo</dt>
                                              <dd className="font-semibold text-slate-800">{TIPO_OS_LABELS[osDetalhe.tipo] ?? osDetalhe.tipo}</dd>
                                            </div>
                                            {['REVISAO', 'RETIRADA'].includes(osDetalhe.tipo) && (osDetalhe.idAparelho || osDetalhe.localInstalacao) && (
                                              <>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">{osDetalhe.tipo === 'RETIRADA' ? 'ID saída' : 'ID substituir'}</dt>
                                                  <dd className="font-semibold text-slate-800">{osDetalhe.idAparelho || '-'}</dd>
                                                </div>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Local inst.</dt>
                                                  <dd className="font-semibold text-slate-800">{osDetalhe.localInstalacao || '-'}</dd>
                                                </div>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Pós-chave</dt>
                                                  <dd className="font-semibold text-slate-800">{osDetalhe.posChave === 'SIM' ? 'Sim' : osDetalhe.posChave === 'NAO' ? 'Não' : '-'}</dd>
                                                </div>
                                              </>
                                            )}
                                            <div className="col-span-2 md:col-span-3">
                                              <dt className="text-[10px] text-slate-500 uppercase font-medium">Endereço subcliente</dt>
                                              <dd className="font-semibold text-slate-800 leading-tight">{formatEnderecoSubcliente(sub)}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-[10px] text-slate-500 uppercase font-medium">Telefone</dt>
                                              <dd className="font-semibold text-slate-800">{sub?.telefone ? formatarTelefone(sub.telefone) : '-'}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-[10px] text-slate-500 uppercase font-medium">E-mail</dt>
                                              <dd className="font-semibold text-slate-800 truncate">{sub?.email || '-'}</dd>
                                            </div>
                                            <div>
                                              <dt className="text-[10px] text-slate-500 uppercase font-medium">Veículo</dt>
                                              <dd className="font-semibold text-slate-800 leading-tight">{formatDadosVeiculo(osDetalhe.veiculo)}</dd>
                                            </div>
                                            {osDetalhe.observacoes && (
                                              <div className="col-span-2 md:col-span-3">
                                                <dt className="text-[10px] text-slate-500 uppercase font-medium">Observações</dt>
                                                <dd className="font-medium text-slate-700 whitespace-pre-wrap leading-tight text-[10px]">{osDetalhe.observacoes}</dd>
                                              </div>
                                            )}
                                          </dl>
                                        )
                                      })()}
                                    </div>
                                  </section>

                                  {/* 2. Dados de teste / Dados da Retirada */}
                                  <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
                                      <MaterialIcon
                                        name={
                                          osDetalhe.tipo === 'RETIRADA' &&
                                          (osDetalhe.status === 'AGENDADO' || osDetalhe.status === 'AGUARDANDO_CADASTRO')
                                            ? 'remove_circle'
                                            : 'science'
                                        }
                                        className="text-slate-400 text-base"
                                      />
                                      <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                                        {osDetalhe.tipo === 'RETIRADA' &&
                                        (osDetalhe.status === 'AGENDADO' || osDetalhe.status === 'AGUARDANDO_CADASTRO')
                                          ? 'Dados da Retirada'
                                          : 'Dados de teste'}
                                      </h2>
                                    </div>
                                    <div className="p-3">
                                      {osDetalhe.tipo === 'RETIRADA' && osDetalhe.status === 'AGENDADO' ? (
                                        <div className="flex flex-col items-center justify-center gap-3 min-h-[120px]">
                                          <div className="w-full text-left space-y-1.5">
                                            <div>
                                              <span className="text-[10px] text-slate-500 uppercase font-medium">ID a retirar</span>
                                              <p className="text-sm font-semibold text-slate-800">{osDetalhe.idAparelho || '—'}</p>
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase h-9"
                                            onClick={() => setShowRetiradaModal(osDetalhe.id)}
                                            disabled={updateStatusMutation.isPending || !hasPermission('AGENDAMENTO.OS.EDITAR')}
                                          >
                                            {updateStatusMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <MaterialIcon name="check_circle" className="text-lg mr-2" />
                                            )}
                                            Retirada Realizada
                                          </Button>
                                        </div>
                                      ) : osDetalhe.tipo === 'RETIRADA' && osDetalhe.status === 'AGUARDANDO_CADASTRO' ? (
                                        (() => {
                                          const { dataRetirada, aparelhoEncontrado } = getDadosRetirada(osDetalhe)
                                          return (
                                            <dl className="space-y-3 text-[11px]">
                                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Data da retirada</dt>
                                                  <dd className="font-semibold text-slate-800">{dataRetirada ?? '—'}</dd>
                                                </div>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Aparelho encontrado</dt>
                                                  <dd className="font-semibold text-slate-800">
                                                    {aparelhoEncontrado === null ? '—' : aparelhoEncontrado ? 'Sim' : 'Não'}
                                                  </dd>
                                                </div>
                                              </div>
                                            </dl>
                                          )
                                        })()
                                      ) : osDetalhe.status === 'AGENDADO' ? (
                                        <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                                          <p className="text-slate-500 text-xs">
                                            Inicie os testes para esta ordem de serviço.
                                          </p>
                                          <Button
                                            size="sm"
                                            className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase h-9"
                                            onClick={() => setConfirmIniciarOsId(osDetalhe.id)}
                                            disabled={updateStatusMutation.isPending || !hasPermission('AGENDAMENTO.OS.EDITAR')}
                                          >
                                            {updateStatusMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <MaterialIcon name="play_arrow" className="text-lg mr-2" />
                                            )}
                                            Iniciar Testes
                                          </Button>
                                        </div>
                                      ) : ['EM_TESTES', 'TESTES_REALIZADOS', 'AGUARDANDO_CADASTRO', 'FINALIZADO'].includes(osDetalhe.status) &&
                                        !(osDetalhe.tipo === 'RETIRADA' && osDetalhe.status === 'AGUARDANDO_CADASTRO') ? (
                                        (() => {
                                          const { entradaEmTestes, saidaEmTestes, tempoMin } = getDadosTeste(osDetalhe)
                                          return (
                                            <dl className="space-y-3 text-[11px]">
                                              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">ID de Entrada</dt>
                                                  <dd className="font-semibold text-slate-800">{osDetalhe.idAparelho || '—'}</dd>
                                                </div>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Local Instalação</dt>
                                                  <dd className="font-semibold text-slate-800">{osDetalhe.localInstalacao || '—'}</dd>
                                                </div>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Pós-chave</dt>
                                                  <dd className="font-semibold text-slate-800">
                                                    {osDetalhe.posChave === 'SIM' ? 'Sim' : osDetalhe.posChave === 'NAO' ? 'Não' : '—'}
                                                  </dd>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Início testes</dt>
                                                  <dd className="font-semibold text-slate-800">
                                                    {entradaEmTestes ? formatarDataHora(entradaEmTestes) : '—'}
                                                  </dd>
                                                </div>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Fim testes</dt>
                                                  <dd className="font-semibold text-slate-800">
                                                    {saidaEmTestes ? formatarDataHora(saidaEmTestes) : 'Em andamento'}
                                                  </dd>
                                                </div>
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Tempo em testes</dt>
                                                  <dd className="font-semibold text-slate-800">{formatarTempoMinutos(tempoMin)}</dd>
                                                </div>
                                              </div>
                                              {osDetalhe.observacoes && (
                                                <div>
                                                  <dt className="text-[10px] text-slate-500 uppercase font-medium">Observações</dt>
                                                  <dd className="font-medium text-slate-700 whitespace-pre-wrap leading-tight text-[10px] mt-0.5">
                                                    {osDetalhe.observacoes}
                                                  </dd>
                                                </div>
                                              )}
                                            </dl>
                                          )
                                        })()
                                      ) : (
                                        <span className="text-slate-500 text-xs italic">
                                          Testes não iniciados
                                        </span>
                                      )}
                                    </div>
                                  </section>

                                  {/* 3. Dados de Cadastro */}
                                  <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
                                      <MaterialIcon name="person_add" className="text-slate-400 text-base" />
                                      <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                                        Dados de Cadastro
                                      </h2>
                                    </div>
                                    <div className="p-3">
                                      {osDetalhe.status === 'TESTES_REALIZADOS' ? (
                                        <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                                          <p className="text-slate-500 text-xs">
                                            Envie esta ordem de serviço para cadastro.
                                          </p>
                                          <Button
                                            size="sm"
                                            className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase h-9"
                                            onClick={() => handleEnviarParaCadastro(osDetalhe.id)}
                                            disabled={updateStatusMutation.isPending}
                                          >
                                            {updateStatusMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                              <MaterialIcon name="send" className="text-lg mr-2" />
                                            )}
                                            Enviar para Cadastro
                                          </Button>
                                        </div>
                                      ) : ['AGUARDANDO_CADASTRO', 'FINALIZADO'].includes(osDetalhe.status) ? (
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                          <div>
                                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Data de Envio</p>
                                            <p className="text-sm text-slate-800">
                                              {(() => {
                                                const entry = osDetalhe.historico?.find(h => h.statusNovo === 'AGUARDANDO_CADASTRO')
                                                return entry ? new Date(entry.criadoEm).toLocaleDateString('pt-BR') : '—'
                                              })()}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Plataforma</p>
                                            <p className="text-sm text-slate-800">{osDetalhe.plataforma ?? '—'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Login Enviado</p>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-100 text-slate-600 border-slate-300">
                                              Não
                                            </span>
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Status do Cadastro</p>
                                            {osDetalhe.statusCadastro ? (
                                              <span className={cn(
                                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                                                osDetalhe.statusCadastro === 'CONCLUIDO'
                                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                  : osDetalhe.statusCadastro === 'EM_CADASTRO'
                                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                                              )}>
                                                {osDetalhe.statusCadastro === 'CONCLUIDO' ? 'Concluído'
                                                  : osDetalhe.statusCadastro === 'EM_CADASTRO' ? 'Em Cadastro'
                                                  : 'Aguardando'}
                                              </span>
                                            ) : '—'}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-slate-500 text-xs italic">Não disponível</span>
                                      )}
                                    </div>
                                  </section>
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

      <Dialog open={confirmIniciarOsId != null} onOpenChange={(open) => !open && setConfirmIniciarOsId(null)}>
        <DialogContent hideClose ariaTitle="Confirmar Iniciar Testes" className="max-w-md p-0 gap-0 overflow-hidden rounded-sm">
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="science" className="text-erp-blue" />
              <h2 className="text-lg font-bold text-slate-800">Iniciar Testes</h2>
            </div>
            <button
              type="button"
              onClick={() => setConfirmIniciarOsId(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja iniciar os testes desta ordem de serviço? O status será alterado para &quot;Em Testes&quot;.
            </p>
          </div>
          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmIniciarOsId(null)} disabled={updateStatusMutation.isPending}>
              Cancelar
            </Button>
            <Button
              className="bg-erp-blue hover:bg-blue-700"
              onClick={() => {
                if (confirmIniciarOsId != null) {
                  handleIniciarTestes(confirmIniciarOsId)
                  setConfirmIniciarOsId(null)
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MaterialIcon name="play_arrow" className="text-lg mr-2" />
              )}
              Iniciar Testes
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      <Dialog open={showRetiradaModal != null} onOpenChange={(open) => !open && setShowRetiradaModal(null)}>
        <DialogContent hideClose ariaTitle="Retirada realizada" className="max-w-md p-0 gap-0 overflow-hidden rounded-sm">
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="remove_circle" className="text-erp-blue" />
              <h2 className="text-lg font-bold text-slate-800">Retirada realizada</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowRetiradaModal(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">O aparelho foi encontrado no local?</p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleRetiradaConfirmar(true)}
                disabled={updateStatusMutation.isPending}
              >
                Sim
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => handleRetiradaConfirmar(false)}
                disabled={updateStatusMutation.isPending}
              >
                Não
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
