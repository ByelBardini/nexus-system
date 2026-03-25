import { useState, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
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
import { MaterialIcon } from '@/components/MaterialIcon'
import { SearchableSelect } from '@/components/SearchableSelect'
import { cn } from '@/lib/utils'

type TipoEntidade = 'cliente' | 'infinity'
type StatusDebito = 'aberto' | 'parcial' | 'quitado'

interface ModeloDebito {
  nome: string
  quantidade: number
}

interface HistoricoItem {
  descricao: string
  data: string
  tipo: 'entrada' | 'saida'
  quantidade: number
}

interface DebitoEquipamento {
  id: number
  devedor: { nome: string; tipo: TipoEntidade }
  credor: { nome: string; tipo: TipoEntidade }
  status: StatusDebito
  ultimaMovimentacao: string
  modelos: ModeloDebito[]
  historico: HistoricoItem[]
}

const MOCK_DEBITOS: DebitoEquipamento[] = [
  {
    id: 1,
    devedor: { nome: 'LogiTech Solutions', tipo: 'cliente' },
    credor: { nome: 'Infinity', tipo: 'infinity' },
    status: 'aberto',
    ultimaMovimentacao: '2023-10-12T09:15:00',
    modelos: [
      { nome: 'ST310U', quantidade: 5 },
      { nome: 'ST310', quantidade: 2 },
    ],
    historico: [
      { descricao: '+10 enviados (Pedido #42)', data: '2023-10-08T14:22:00', tipo: 'entrada', quantidade: 10 },
      { descricao: '-3 retirados por LogiTech', data: '2023-10-12T09:15:00', tipo: 'saida', quantidade: 3 },
    ],
  },
  {
    id: 2,
    devedor: { nome: 'Infinity', tipo: 'infinity' },
    credor: { nome: 'AASC', tipo: 'cliente' },
    status: 'parcial',
    ultimaMovimentacao: '2023-10-05T11:30:00',
    modelos: [
      { nome: 'GV55', quantidade: 8 },
      { nome: 'GV300W', quantidade: 4 },
    ],
    historico: [
      { descricao: '+20 enviados (Remessa #109)', data: '2023-09-20T10:00:00', tipo: 'entrada', quantidade: 20 },
      { descricao: '-8 devolvidos por AASC', data: '2023-10-05T11:30:00', tipo: 'saida', quantidade: 8 },
    ],
  },
  {
    id: 3,
    devedor: { nome: 'Swift Transport', tipo: 'cliente' },
    credor: { nome: 'LogiTech Solutions', tipo: 'cliente' },
    status: 'quitado',
    ultimaMovimentacao: '2023-10-01T08:00:00',
    modelos: [
      { nome: 'ST310U', quantidade: 0 },
    ],
    historico: [
      { descricao: '+6 recebidos de LogiTech', data: '2023-09-01T09:00:00', tipo: 'entrada', quantidade: 6 },
      { descricao: '-6 devolvidos (Finalizado)', data: '2023-10-01T08:00:00', tipo: 'saida', quantidade: 6 },
    ],
  },
]

const STATUS_CONFIG: Record<StatusDebito, { label: string; className: string }> = {
  aberto:  { label: 'Aberto',  className: 'bg-amber-50 text-amber-800 border-amber-200' },
  parcial: { label: 'Parcial', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  quitado: { label: 'Quitado', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
}

const ENTIDADE_CONFIG: Record<TipoEntidade, { className: string }> = {
  infinity: { className: 'bg-erp-blue/10 text-blue-800 border-erp-blue/20' },
  cliente:  { className: 'bg-slate-100 text-slate-700 border-slate-200' },
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DebitosEquipamentosPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusDebito | 'todos'>('todos')
  const [filtroDevedor, setFiltroDevedor] = useState('')
  const [filtroModelo, setFiltroModelo] = useState('')

  const opcoesDevedor = useMemo(() => {
    const nomes = new Set(MOCK_DEBITOS.flatMap((d) => [d.devedor.nome, d.credor.nome]))
    return [{ value: '', label: 'Todos' }, ...[...nomes].map((n) => ({ value: n, label: n }))]
  }, [])

  const opcoesModelo = useMemo(() => {
    const nomes = new Set(MOCK_DEBITOS.flatMap((d) => d.modelos.map((m) => m.nome)))
    return [{ value: '', label: 'Todos' }, ...[...nomes].map((n) => ({ value: n, label: n }))]
  }, [])

  const stats = useMemo(() => {
    const ativos = MOCK_DEBITOS.filter((d) => d.status !== 'quitado')

    // Total de aparelhos devidos (soma das quantidades dos modelos nos débitos ativos)
    const totalAparelhosDevidos = ativos.reduce(
      (acc, d) => acc + d.modelos.reduce((s, m) => s + m.quantidade, 0),
      0
    )

    // Saldo do mês: net de entradas - saídas nos débitos ativos
    const saldoMes = ativos.reduce((acc, d) => {
      return acc + d.historico.reduce((s, h) => s + (h.tipo === 'entrada' ? h.quantidade : -h.quantidade), 0)
    }, 0)

    // Devedores únicos por tipo (apenas ativos)
    const devedoresCliente = new Set(
      ativos.filter((d) => d.devedor.tipo === 'cliente').map((d) => d.devedor.nome)
    ).size
    const devedoresInfinity = new Set(
      ativos.filter((d) => d.devedor.tipo === 'infinity').map((d) => d.devedor.nome)
    ).size
    const totalDevedores = devedoresCliente + devedoresInfinity
    const pctCliente = totalDevedores > 0 ? Math.round((devedoresCliente / totalDevedores) * 100) : 0

    // Modelos ativos (nos débitos não quitados, quantidade > 0)
    const modelosMap = new Map<string, number>()
    ativos.forEach((d) => {
      d.modelos.forEach((m) => {
        if (m.quantidade > 0) modelosMap.set(m.nome, (modelosMap.get(m.nome) ?? 0) + m.quantidade)
      })
    })
    const modelosPorQtd = [...modelosMap.entries()].sort((a, b) => b[1] - a[1])
    const modeloPredominante = modelosPorQtd[0]?.[0] ?? '-'

    return {
      totalAparelhosDevidos,
      saldoMes,
      devedoresCliente,
      devedoresInfinity,
      pctCliente,
      modelosAtivos: modelosMap.size,
      modeloPredominante,
    }
  }, [])

  const filtered = useMemo(() => {
    return MOCK_DEBITOS.filter((d) => {
      const termo = busca.trim().toLowerCase()
      const matchBusca =
        !termo ||
        d.devedor.nome.toLowerCase().includes(termo) ||
        d.credor.nome.toLowerCase().includes(termo)
      const matchStatus = filtroStatus === 'todos' || d.status === filtroStatus
      const matchDevedor =
        !filtroDevedor || d.devedor.nome === filtroDevedor || d.credor.nome === filtroDevedor
      const matchModelo = !filtroModelo || d.modelos.some((m) => m.nome === filtroModelo)
      return matchBusca && matchStatus && matchDevedor && matchModelo
    })
  }, [busca, filtroStatus, filtroDevedor, filtroModelo])

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="flex w-full shadow-sm border border-slate-300 bg-white">
        {/* Débitos Ativos */}
        <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="border-l-4 border-amber-500 pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
                Aparelhos Devidos
              </span>
              <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
                {stats.totalAparelhosDevidos}
              </div>
            </div>
            <MaterialIcon name="account_balance" className="text-amber-400 text-2xl" />
          </div>
          <div className="flex items-center gap-1.5">
            <MaterialIcon
              name={stats.saldoMes >= 0 ? 'trending_up' : 'trending_down'}
              className={cn('text-base', stats.saldoMes >= 0 ? 'text-red-500' : 'text-emerald-500')}
            />
            <span
              className={cn(
                'text-[11px] font-bold',
                stats.saldoMes >= 0 ? 'text-red-600' : 'text-emerald-600'
              )}
            >
              {stats.saldoMes >= 0 ? '+' : ''}{stats.saldoMes} un.
            </span>
            <span className="text-[10px] text-slate-400">desde início do mês</span>
          </div>
        </div>

        {/* Clientes Devedores */}
        <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="border-l-4 border-erp-blue pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
                Clientes Devedores
              </span>
              <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
                {stats.devedoresCliente}
              </div>
            </div>
            <MaterialIcon name="groups" className="text-blue-400 text-2xl" />
          </div>
          <div className="space-y-1">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-erp-blue rounded-full transition-all"
                style={{ width: `${stats.pctCliente}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-blue-600 font-bold">{stats.pctCliente}% clientes</span>
              <span className="text-slate-400">{100 - stats.pctCliente}% infinity</span>
            </div>
          </div>
        </div>

        {/* Modelos Ativos */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="border-l-4 border-emerald-500 pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
                Modelos Ativos
              </span>
              <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
                {stats.modelosAtivos}
              </div>
            </div>
            <MaterialIcon name="devices" className="text-emerald-400 text-2xl" />
          </div>
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="star" className="text-amber-400 text-sm" />
            <span className="text-[10px] text-slate-400">Predominante:</span>
            <span className="text-[11px] font-bold text-slate-700">{stats.modeloPredominante}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Busca</label>
            <div className="relative w-52">
              <MaterialIcon
                name="search"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
              />
              <Input
                className="pl-8 text-[11px]"
                placeholder="Devedor ou credor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Devedor / Credor</label>
            <div className="w-52">
              <SearchableSelect
                options={opcoesDevedor}
                value={filtroDevedor}
                onChange={setFiltroDevedor}
                placeholder="Todos"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Modelo</label>
            <div className="w-44">
              <SearchableSelect
                options={opcoesModelo}
                value={filtroModelo}
                onChange={setFiltroModelo}
                placeholder="Todos"
              />
            </div>
          </div>
          {(busca || filtroDevedor || filtroModelo || filtroStatus !== 'todos') && (
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  setBusca('')
                  setFiltroDevedor('')
                  setFiltroModelo('')
                  setFiltroStatus('todos')
                }}
                className="h-9 px-3 text-[11px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded bg-white hover:bg-slate-50 flex items-center gap-1"
              >
                <MaterialIcon name="close" className="text-sm" />
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {(
            [
              { value: 'todos', label: 'Todos' },
              { value: 'aberto', label: 'Aberto' },
              { value: 'parcial', label: 'Parcial' },
              { value: 'quitado', label: 'Quitado' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFiltroStatus(tab.value)}
              className={cn(
                'px-3 py-1 text-[11px] font-bold rounded border transition-colors',
                filtroStatus === tab.value
                  ? 'bg-erp-blue text-white border-erp-blue'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-16 pl-4 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                ID
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Devedor
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Credor
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Equip.
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Status
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Últ. Mov.
              </TableHead>
              <TableHead className="w-10 px-3 py-2.5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  Nenhum débito encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((debito) => {
              const isExpanded = expandedId === debito.id
              const totalUnidades = debito.modelos.reduce((acc, m) => acc + m.quantidade, 0)
              const statusCfg = STATUS_CONFIG[debito.status]
              const devedorCfg = ENTIDADE_CONFIG[debito.devedor.tipo]
              const credorCfg = ENTIDADE_CONFIG[debito.credor.tipo]

              return (
                <Fragment key={debito.id}>
                  <TableRow
                    className={cn(
                      'cursor-pointer border-b border-slate-100 hover:bg-blue-50/30 transition-colors bg-white',
                      isExpanded && 'border-l-4 border-l-blue-600 bg-blue-50/20'
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : debito.id)}
                  >
                    <TableCell className="pl-4 px-3 py-3">
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        #{debito.id}
                      </span>
                    </TableCell>

                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-700">{debito.devedor.nome}</span>
                        <span
                          className={cn(
                            'self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border',
                            devedorCfg.className
                          )}
                        >
                          {debito.devedor.tipo === 'infinity' ? 'Infinity' : 'Cliente'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-700">{debito.credor.nome}</span>
                        <span
                          className={cn(
                            'self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border',
                            credorCfg.className
                          )}
                        >
                          {debito.credor.tipo === 'infinity' ? 'Infinity' : 'Cliente'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-3 py-3">
                      <span className="text-sm font-black text-slate-800">{totalUnidades}</span>
                      <span className="text-[10px] text-slate-400 ml-1">un.</span>
                    </TableCell>

                    <TableCell className="px-3 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                          statusCfg.className
                        )}
                      >
                        {statusCfg.label}
                      </span>
                    </TableCell>

                    <TableCell className="px-3 py-3">
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatarData(debito.ultimaMovimentacao)}
                      </span>
                    </TableCell>

                    <TableCell className="px-3 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedId(isExpanded ? null : debito.id)
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
                      <TableCell colSpan={7} className="p-0">
                        {/* Cabeçalho resumo */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-5">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded text-[11px] font-bold uppercase border shrink-0',
                              statusCfg.className
                            )}
                          >
                            {statusCfg.label}
                          </span>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span>{debito.devedor.nome}</span>
                            <MaterialIcon name="arrow_forward" className="text-slate-400 text-base" />
                            <span>{debito.credor.nome}</span>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Total</div>
                            <div className="text-lg font-black text-slate-800 leading-none">
                              {totalUnidades} <span className="text-xs font-normal text-slate-400">un.</span>
                            </div>
                          </div>
                        </div>

                        {/* 3 colunas: Modelos | Histórico | Ações */}
                        <div className="grid grid-cols-3 divide-x divide-slate-100">
                          {/* Coluna 1: Distribuição de modelos */}
                          <div className="px-6 py-4 space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
                              Distribuição de Modelos
                            </h4>
                            <div className="space-y-1">
                              {debito.modelos.map((modelo) => (
                                <div
                                  key={modelo.nome}
                                  className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0"
                                >
                                  <span className="text-xs font-semibold text-slate-700">{modelo.nome}</span>
                                  <span className="text-xs font-black text-slate-800">
                                    {modelo.quantidade} <span className="font-normal text-slate-400 text-[10px]">un.</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Total consolidado</span>
                              <span className="text-sm font-black text-slate-800">
                                {totalUnidades} <span className="text-[10px] font-normal text-slate-400">un.</span>
                              </span>
                            </div>
                          </div>

                          {/* Coluna 2: Histórico */}
                          <div className="px-6 py-4 space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
                              Histórico de Movimentações
                            </h4>
                            <div className="space-y-2">
                              {debito.historico.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      'mt-1 w-2 h-2 rounded-full shrink-0',
                                      item.tipo === 'entrada' ? 'bg-emerald-500' : 'bg-red-400'
                                    )}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-700">{item.descricao}</p>
                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                      {formatarDataHora(item.data)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Coluna 3: Ações Corretivas */}
                          <div className="px-6 py-4 space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100">
                              Ações Corretivas
                            </h4>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full justify-start text-[11px] font-bold uppercase gap-1.5"
                                onClick={(e) => { e.stopPropagation(); toast('Funcionalidade em breve') }}
                              >
                                <MaterialIcon name="check_circle" className="text-base text-emerald-600" />
                                Resolver Pendência
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-[11px] font-bold uppercase gap-1.5"
                                onClick={(e) => { e.stopPropagation(); toast('Funcionalidade em breve') }}
                              >
                                <MaterialIcon name="swap_horiz" className="text-base text-blue-600" />
                                Transferência Direta
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-[11px] font-bold uppercase gap-1.5"
                                onClick={(e) => { e.stopPropagation(); toast('Funcionalidade em breve') }}
                              >
                                <MaterialIcon name="remove_circle" className="text-base text-amber-600" />
                                Abater Dívida
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé count */}
      <div className="text-[11px] text-slate-500">
        {filtered.length} registro(s) encontrado(s)
      </div>
    </div>
  )
}
