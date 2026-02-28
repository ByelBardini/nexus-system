import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Loader2,
  Search,
  ArrowLeft,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MaterialIcon } from '@/components/MaterialIcon'
import { InputPreco } from '@/components/InputPreco'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type TipoAparelho = 'RASTREADOR' | 'SIM'
type ProprietarioTipo = 'INFINITY' | 'CLIENTE'

interface Cliente {
  id: number
  nome: string
  nomeFantasia?: string | null
}

interface IdValidation {
  validos: string[]
  duplicados: string[]
  invalidos: string[]
  jaExistentes: string[]
}

const MARCAS_RASTREADOR = [
  { value: 'SUNTECH', label: 'Suntech' },
  { value: 'QUECLINK', label: 'Queclink' },
  { value: 'CONCOX', label: 'Concox' },
  { value: 'TELTONIKA', label: 'Teltonika' },
  { value: 'CALAMP', label: 'CalAmp' },
  { value: 'COBAN', label: 'Coban' },
  { value: 'OUTROS', label: 'Outros' },
]

const MODELOS_POR_MARCA: Record<string, { value: string; label: string }[]> = {
  SUNTECH: [
    { value: 'ST310UC', label: 'ST310UC' },
    { value: 'ST340LC', label: 'ST340LC' },
    { value: 'ST4315', label: 'ST4315' },
  ],
  QUECLINK: [
    { value: 'GV300', label: 'GV300' },
    { value: 'GV500', label: 'GV500' },
    { value: 'GL300', label: 'GL300' },
  ],
  CONCOX: [
    { value: 'GT06N', label: 'GT06N' },
    { value: 'JM-VL01', label: 'JM-VL01' },
    { value: 'JM-VL02', label: 'JM-VL02' },
  ],
  TELTONIKA: [
    { value: 'FMB920', label: 'FMB920' },
    { value: 'FMC130', label: 'FMC130' },
  ],
  CALAMP: [
    { value: 'LMU-2630', label: 'LMU-2630' },
  ],
  COBAN: [
    { value: 'TK103B', label: 'TK103B' },
    { value: 'GPS103', label: 'GPS103' },
  ],
  OUTROS: [
    { value: 'GENERICO', label: 'Modelo Genérico' },
  ],
}

const OPERADORAS = [
  { value: 'VIVO', label: 'Vivo' },
  { value: 'CLARO', label: 'Claro' },
  { value: 'TIM', label: 'Tim' },
  { value: 'OI', label: 'Oi' },
  { value: 'ALGAR', label: 'Algar' },
  { value: 'ARQIA', label: 'Arqia' },
  { value: 'OUTROS', label: 'Outras' },
]

function validateIds(
  texto: string,
  tipo: TipoAparelho,
  existentes: string[]
): IdValidation {
  const linhas = texto
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean)

  const validos: string[] = []
  const duplicados: string[] = []
  const invalidos: string[] = []
  const jaExistentes: string[] = []
  const vistos = new Set<string>()

  const tamanhoEsperado = tipo === 'RASTREADOR' ? 15 : 19

  for (const id of linhas) {
    const cleanId = id.replace(/\D/g, '')

    if (vistos.has(cleanId)) {
      duplicados.push(id)
      continue
    }
    vistos.add(cleanId)

    if (existentes.includes(cleanId)) {
      jaExistentes.push(id)
      continue
    }

    if (cleanId.length < tamanhoEsperado - 1 || cleanId.length > tamanhoEsperado + 1) {
      invalidos.push(id)
      continue
    }

    validos.push(cleanId)
  }

  return { validos, duplicados, invalidos, jaExistentes }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function centavosToReais(centavos: number): string {
  return formatCurrency(centavos / 100)
}

export function CadastroLotePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [loteReferencia, setLoteReferencia] = useState('')
  const [loteNotaFiscal, setLoteNotaFiscal] = useState('')
  const [loteDataChegada, setLoteDataChegada] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [loteProprietario, setLoteProprietario] = useState<ProprietarioTipo>('INFINITY')
  const [loteClienteId, setLoteClienteId] = useState<number | null>(null)
  const [loteTipo, setLoteTipo] = useState<TipoAparelho>('RASTREADOR')
  const [loteMarca, setLoteMarca] = useState('')
  const [loteModelo, setLoteModelo] = useState('')
  const [loteOperadora, setLoteOperadora] = useState('')
  const [loteQuantidade, setLoteQuantidade] = useState<number>(0)
  const [loteDefinirIds, setLoteDefinirIds] = useState(true)
  const [loteIdsTexto, setLoteIdsTexto] = useState('')
  const [loteValorUnitario, setLoteValorUnitario] = useState<number>(0)
  const [buscaCliente, setBuscaCliente] = useState('')

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes-lista'],
    queryFn: () => api('/clientes'),
    enabled: loteProprietario === 'CLIENTE',
  })

  const { data: aparelhosExistentes = [] } = useQuery<{ identificador: string }[]>({
    queryKey: ['aparelhos-ids'],
    queryFn: () => api('/aparelhos'),
    select: (data) => data.filter((a: any) => a.identificador),
  })

  const existingIds = useMemo(() => {
    return aparelhosExistentes.map((a) => a.identificador).filter(Boolean) as string[]
  }, [aparelhosExistentes])

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes.slice(0, 10)
    return clientes.filter((c) =>
      c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
      c.nomeFantasia?.toLowerCase().includes(buscaCliente.toLowerCase())
    ).slice(0, 10)
  }, [clientes, buscaCliente])

  const clienteSelecionado = useMemo(() => {
    return clientes.find((c) => c.id === loteClienteId)
  }, [clientes, loteClienteId])

  const idValidation = useMemo(() => {
    if (!loteDefinirIds || !loteIdsTexto.trim()) {
      return { validos: [], duplicados: [], invalidos: [], jaExistentes: [] }
    }
    return validateIds(loteIdsTexto, loteTipo, existingIds)
  }, [loteIdsTexto, loteTipo, loteDefinirIds, existingIds])

  const modelosDisponiveis = useMemo(() => {
    return MODELOS_POR_MARCA[loteMarca] || []
  }, [loteMarca])

  useEffect(() => {
    setLoteModelo('')
  }, [loteMarca])

  useEffect(() => {
    if (loteTipo === 'SIM') {
      setLoteMarca('')
      setLoteModelo('')
    } else {
      setLoteOperadora('')
    }
  }, [loteTipo])

  const valorTotal = useMemo(() => {
    const qtd = loteDefinirIds && idValidation.validos.length > 0
      ? idValidation.validos.length
      : loteQuantidade
    return (loteValorUnitario / 100) * qtd
  }, [loteValorUnitario, loteQuantidade, loteDefinirIds, idValidation.validos.length])

  const quantidadeFinal = useMemo(() => {
    return loteDefinirIds && idValidation.validos.length > 0
      ? idValidation.validos.length
      : loteQuantidade
  }, [loteDefinirIds, idValidation.validos.length, loteQuantidade])

  const erroQuantidade = useMemo(() => {
    if (!loteDefinirIds) return null
    if (loteQuantidade > 0 && idValidation.validos.length > 0) {
      if (loteQuantidade !== idValidation.validos.length) {
        return `Quantidade informada (${loteQuantidade}) não corresponde aos IDs válidos (${idValidation.validos.length})`
      }
    }
    return null
  }, [loteDefinirIds, loteQuantidade, idValidation.validos.length])

  const podeSalvar = useMemo(() => {
    if (!loteReferencia.trim()) return false
    if (loteProprietario === 'CLIENTE' && !loteClienteId) return false
    if (loteTipo === 'RASTREADOR' && (!loteMarca || !loteModelo)) return false
    if (loteTipo === 'SIM' && !loteOperadora) return false
    if (loteValorUnitario <= 0) return false

    if (loteDefinirIds) {
      if (idValidation.validos.length === 0) return false
      if (erroQuantidade) return false
    } else {
      if (loteQuantidade <= 0) return false
    }

    return true
  }, [
    loteReferencia,
    loteProprietario,
    loteClienteId,
    loteTipo,
    loteMarca,
    loteModelo,
    loteOperadora,
    loteValorUnitario,
    loteDefinirIds,
    idValidation.validos.length,
    loteQuantidade,
    erroQuantidade,
  ])

  const createLoteMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        referencia: loteReferencia,
        notaFiscal: loteNotaFiscal || null,
        dataChegada: loteDataChegada,
        proprietarioTipo: loteProprietario,
        clienteId: loteProprietario === 'CLIENTE' ? loteClienteId : null,
        tipo: loteTipo,
        marca: loteTipo === 'RASTREADOR' ? loteMarca : null,
        modelo: loteTipo === 'RASTREADOR' ? loteModelo : null,
        operadora: loteTipo === 'SIM' ? loteOperadora : null,
        quantidade: quantidadeFinal,
        valorUnitario: loteValorUnitario / 100,
        identificadores: loteDefinirIds ? idValidation.validos : [],
      }
      return api('/aparelhos/lote', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aparelhos'] })
      toast.success('Lote registrado com sucesso!')
      navigate('/aparelhos')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar lote')
    },
  })

  return (
    <div className="-m-4 min-h-[100dvh] bg-slate-100">
      {/* Header */}
      <header className="sticky -top-4 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/aparelhos"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon name="inventory_2" className="text-blue-600 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Entrada de Equipamento</h1>
              <p className="text-xs text-slate-500">Cadastro em massa de lote</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex gap-6 p-6">
        {/* Form Area */}
        <div className="flex-1 space-y-6">
          {/* Bloco 1 - Identificação do Lote */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
              <MaterialIcon name="tag" className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Identificação do Lote</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Referência do Lote <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={loteReferencia}
                  onChange={(e) => setLoteReferencia(e.target.value)}
                  placeholder="Ex: LT-2026-001"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Nº Nota Fiscal
                </Label>
                <Input
                  value={loteNotaFiscal}
                  onChange={(e) => setLoteNotaFiscal(e.target.value)}
                  placeholder="Ex: 123456"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Data de Chegada
                </Label>
                <Input
                  type="date"
                  value={loteDataChegada}
                  onChange={(e) => setLoteDataChegada(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Bloco 2 - Propriedade e Tipo */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
              <MaterialIcon name="business" className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Propriedade e Tipo</h3>
            </div>
            <div className="space-y-6">
              {/* Pertence a */}
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Pertence a</Label>
                <div className="flex rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setLoteProprietario('INFINITY')
                      setLoteClienteId(null)
                    }}
                    className={cn(
                      'flex-1 py-2.5 px-4 text-xs font-bold uppercase border transition-all',
                      loteProprietario === 'INFINITY'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Infinity
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoteProprietario('CLIENTE')}
                    className={cn(
                      'flex-1 py-2.5 px-4 text-xs font-bold uppercase border-t border-b border-r transition-all',
                      loteProprietario === 'CLIENTE'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Cliente
                  </button>
                </div>
                {loteProprietario === 'CLIENTE' && (
                  <div className="mt-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="h-10 pl-10"
                      />
                    </div>
                    {clientesFiltrados.length > 0 && (
                      <div className="mt-2 border border-slate-200 rounded-sm max-h-40 overflow-y-auto">
                        {clientesFiltrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => {
                              setLoteClienteId(cliente.id)
                              setBuscaCliente('')
                            }}
                            className={cn(
                              'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0',
                              loteClienteId === cliente.id && 'bg-blue-50'
                            )}
                          >
                            <span className="font-medium">{cliente.nome}</span>
                            {cliente.nomeFantasia && (
                              <span className="text-slate-400 ml-2 text-xs">({cliente.nomeFantasia})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {loteClienteId && clienteSelecionado && (
                      <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-sm px-3 py-2">
                        <MaterialIcon name="check_circle" className="text-blue-600 text-sm" />
                        <span className="text-sm font-medium text-blue-800">{clienteSelecionado.nome}</span>
                        <button
                          type="button"
                          onClick={() => setLoteClienteId(null)}
                          className="ml-auto text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tipo de Equipamento */}
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Tipo de Equipamento</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setLoteTipo('RASTREADOR')}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-sm transition-all',
                      loteTipo === 'RASTREADOR'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <MaterialIcon
                      name="sensors"
                      className={cn('text-3xl', loteTipo === 'RASTREADOR' ? 'text-blue-600' : 'text-slate-400')}
                    />
                    <span className={cn(
                      'text-xs font-bold uppercase',
                      loteTipo === 'RASTREADOR' ? 'text-blue-800' : 'text-slate-500'
                    )}>
                      Rastreador
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoteTipo('SIM')}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-sm transition-all',
                      loteTipo === 'SIM'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <MaterialIcon
                      name="sim_card"
                      className={cn('text-3xl', loteTipo === 'SIM' ? 'text-blue-600' : 'text-slate-400')}
                    />
                    <span className={cn(
                      'text-xs font-bold uppercase',
                      loteTipo === 'SIM' ? 'text-blue-800' : 'text-slate-500'
                    )}>
                      Simcard
                    </span>
                  </button>
                </div>
              </div>

              {/* Marca/Modelo ou Operadora */}
              {loteTipo === 'RASTREADOR' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                      Fabricante / Marca <span className="text-red-500">*</span>
                    </Label>
                    <Select value={loteMarca} onValueChange={setLoteMarca}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MARCAS_RASTREADOR.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                      Modelo <span className="text-red-500">*</span>
                    </Label>
                    <Select value={loteModelo} onValueChange={setLoteModelo} disabled={!loteMarca}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={loteMarca ? 'Selecione...' : 'Selecione o fabricante primeiro...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {modelosDisponiveis.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="w-1/2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Operadora <span className="text-red-500">*</span>
                  </Label>
                  <Select value={loteOperadora} onValueChange={setLoteOperadora}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERADORAS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Bloco 3 - Identificadores */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MaterialIcon name="barcode_reader" className="text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Identificadores ({loteTipo === 'RASTREADOR' ? 'IMEI' : 'ICCID'})
                </h3>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-sm border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Definir IDs agora?</span>
                <button
                  type="button"
                  onClick={() => setLoteDefinirIds(!loteDefinirIds)}
                  className={cn(
                    'w-10 h-5 rounded-full relative transition-colors',
                    loteDefinirIds ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-3 h-3 bg-white rounded-full transition-all',
                      loteDefinirIds ? 'right-1' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-1/3">
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Quantidade <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={loteQuantidade || ''}
                  onChange={(e) => setLoteQuantidade(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="h-10"
                />
              </div>

              {loteDefinirIds && (
                <>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                      Colar IDs (Um por linha ou separados por vírgula)
                    </Label>
                    <textarea
                      value={loteIdsTexto}
                      onChange={(e) => setLoteIdsTexto(e.target.value)}
                      placeholder={`Cole os ${loteTipo === 'RASTREADOR' ? 'IMEIs' : 'ICCIDs'} aqui...\n\nExemplo:\n867322048291834\n867322048291835\n867322048291836\n\nou\n\n867322048291834, 867322048291835, 867322048291836`}
                      className="w-full h-48 p-4 bg-slate-50 border border-slate-300 rounded-sm font-mono text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>

                  {loteIdsTexto.trim() && (
                    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-sm border border-dashed border-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase">
                          <span className="text-slate-900">{idValidation.validos.length}</span> Válidos
                        </span>
                      </div>
                      {idValidation.duplicados.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            <span className="text-slate-900">{idValidation.duplicados.length}</span> Duplicados
                          </span>
                        </div>
                      )}
                      {idValidation.invalidos.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            <span className="text-slate-900">{idValidation.invalidos.length}</span> Inválidos
                          </span>
                        </div>
                      )}
                      {idValidation.jaExistentes.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            <span className="text-slate-900">{idValidation.jaExistentes.length}</span> Já cadastrados
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {erroQuantidade && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-medium">{erroQuantidade}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bloco 4 - Valores */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
              <MaterialIcon name="payments" className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Valores Financeiros</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Valor Unitário (R$) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <InputPreco
                    value={loteValorUnitario}
                    onChange={setLoteValorUnitario}
                    className="h-10 pl-10 text-right font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Valor Total do Lote
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">R$</span>
                  <Input
                    readOnly
                    value={formatCurrency(valorTotal).replace('R$', '').trim()}
                    className="h-10 pl-10 text-right font-mono bg-slate-50 border-slate-200 font-bold text-slate-800"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">Calculado automaticamente (Unitário x Qtd)</p>
              </div>
            </div>
          </div>
          </div>

          {/* Sidebar Resumo - Sticky */}
          <div className="w-80 shrink-0 sticky top-[calc(50vh-300px)] h-fit">
            <div className="bg-slate-800 text-white rounded-lg overflow-hidden shadow-xl">
              <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest">Resumo do Lote</h3>
                <MaterialIcon name="info" className="text-slate-500" />
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Referência</label>
                    <p className="text-lg font-bold">{loteReferencia || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nota Fiscal</label>
                    <p className="text-lg font-bold">{loteNotaFiscal || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                    <p className="text-sm font-medium">
                      {loteTipo === 'RASTREADOR' ? '📡 Rastreador' : '📶 Simcard'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Proprietário</label>
                    <p className="text-sm font-medium">
                      {loteProprietario === 'INFINITY' ? 'Infinity' : (clienteSelecionado?.nome || 'Cliente')}
                    </p>
                  </div>
                </div>
                {loteTipo === 'RASTREADOR' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Marca</label>
                      <p className="text-sm font-medium">
                        {MARCAS_RASTREADOR.find((m) => m.value === loteMarca)?.label || '—'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Modelo</label>
                      <p className="text-sm font-medium">{loteModelo || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Operadora</label>
                    <p className="text-sm font-medium">
                      {OPERADORAS.find((o) => o.value === loteOperadora)?.label || '—'}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qtd. Itens</label>
                    <span className="text-sm font-bold">{quantidadeFinal} Unidades</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Unitário</label>
                    <span className="text-sm font-medium">{centavosToReais(loteValorUnitario)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Total</label>
                    <span className="text-xl font-bold text-blue-400">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>
                {loteDefinirIds && idValidation.validos.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">IDs Válidos</label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">{idValidation.validos.length} identificadores</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-700/30">
                <div className="flex items-start gap-3">
                  <MaterialIcon name="warning" className="text-yellow-500 text-lg shrink-0" />
                  <p className="text-[10px] text-slate-300 leading-relaxed uppercase">
                    Confira os dados antes de registrar o lote.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Footer */}
      <div className="sticky -bottom-4 z-10 h-20 border-t border-slate-200 px-6 flex items-center justify-end gap-4 bg-white">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/aparelhos')}
          className="h-11 px-6 text-[11px] font-bold text-slate-500 uppercase"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => createLoteMutation.mutate()}
          disabled={!podeSalvar || createLoteMutation.isPending}
          className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase gap-2"
        >
          {createLoteMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Registrar Lote
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
