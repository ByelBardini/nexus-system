import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Loader2,
  ArrowLeft,
  Link2,
  Router,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Info,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ModoPareamento = 'individual' | 'massa' | 'csv'

type TrackerStatus = 'FOUND_AVAILABLE' | 'FOUND_ALREADY_LINKED' | 'NEEDS_CREATE' | 'INVALID_FORMAT'
type SimStatus = TrackerStatus
type ActionNeeded = 'OK' | 'SELECT_TRACKER_LOT' | 'SELECT_SIM_LOT' | 'FIX_ERROR'

interface PreviewLinha {
  imei: string
  iccid: string
  tracker_status: TrackerStatus
  sim_status: SimStatus
  action_needed: ActionNeeded
  trackerId?: number
  simId?: number
  marca?: string
  modelo?: string
  operadora?: string
}

interface PreviewResult {
  linhas: PreviewLinha[]
  contadores: { validos: number; exigemLote: number; erros: number }
}

function parseIds(text: string): string[] {
  if (!text?.trim()) return []
  return text
    .split(/[,;\n\r]+/)
    .map((s) => s.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
    .filter(Boolean)
}

const TRACKER_STATUS_LABELS: Record<TrackerStatus, { label: string; className: string }> = {
  FOUND_AVAILABLE: { label: 'Disponível', className: 'bg-emerald-100 text-emerald-700' },
  FOUND_ALREADY_LINKED: { label: 'Em Uso', className: 'bg-red-100 text-red-700' },
  NEEDS_CREATE: { label: 'Não Encontrado', className: 'bg-blue-100 text-blue-700' },
  INVALID_FORMAT: { label: 'Formato Inválido', className: 'bg-amber-100 text-amber-700' },
}

const ACTION_LABELS: Record<ActionNeeded, { label: string; className: string }> = {
  OK: { label: '✔ Pronto para vincular', className: 'font-bold text-emerald-600' },
  SELECT_TRACKER_LOT: { label: '➕ Será criado (lote rastreador)', className: 'font-bold text-blue-600' },
  SELECT_SIM_LOT: { label: '➕ Será criado (lote SIM)', className: 'font-bold text-blue-600' },
  FIX_ERROR: { label: '✖ Erro', className: 'font-bold text-red-600' },
}

export function PareamentoPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const modoParam = searchParams.get('modo') as ModoPareamento | null
  const [modo, setModo] = useState<ModoPareamento>(
    modoParam && ['individual', 'massa', 'csv'].includes(modoParam) ? modoParam : 'individual'
  )

  useEffect(() => {
    if (modoParam && ['individual', 'massa', 'csv'].includes(modoParam)) {
      setModo(modoParam as ModoPareamento)
    }
  }, [modoParam])

  // Individual
  const [imeiIndividual, setImeiIndividual] = useState('')
  const [iccidIndividual, setIccidIndividual] = useState('')
  const [pertenceLoteRastreador, setPertenceLoteRastreador] = useState(false)
  const [pertenceLoteSim, setPertenceLoteSim] = useState(false)
  const [marcaRastreador, setMarcaRastreador] = useState('')
  const [modeloRastreador, setModeloRastreador] = useState('')
  const [operadoraSim, setOperadoraSim] = useState('')
  const [adicionarKit, setAdicionarKit] = useState(false)
  const [kitModo, setKitModo] = useState<'existente' | 'novo'>('existente')
  const [kitIdExistente, setKitIdExistente] = useState<string>('')
  const [kitNomeNovo, setKitNomeNovo] = useState<string>('')
  const [quantidadeCriada, setQuantidadeCriada] = useState(0)

  // Massa
  const [kitNomeMassa, setKitNomeMassa] = useState<string>('')
  const [textImeis, setTextImeis] = useState('')
  const [textIccids, setTextIccids] = useState('')
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [loteRastreadorId, setLoteRastreadorId] = useState<string>('')
  const [loteSimId, setLoteSimId] = useState<string>('')
  const [pertenceLoteRastreadorMassa, setPertenceLoteRastreadorMassa] = useState(true)
  const [pertenceLoteSimMassa, setPertenceLoteSimMassa] = useState(true)
  const [marcaRastreadorMassa, setMarcaRastreadorMassa] = useState('')
  const [modeloRastreadorMassa, setModeloRastreadorMassa] = useState('')
  const [operadoraSimMassa, setOperadoraSimMassa] = useState('')
  const [adicionarKitMassa, setAdicionarKitMassa] = useState(false)
  const [kitModoMassa, setKitModoMassa] = useState<'existente' | 'novo'>('existente')
  const [kitIdExistenteMassa, setKitIdExistenteMassa] = useState<string>('')

  const imeis = useMemo(() => parseIds(textImeis), [textImeis])
  const iccids = useMemo(() => parseIds(textIccids), [textIccids])

  const quantidadeBate = imeis.length === iccids.length
  const paresMassa = useMemo(() => {
    if (!quantidadeBate || imeis.length === 0) return []
    return imeis.map((imei, i) => ({ imei, iccid: iccids[i] ?? '' }))
  }, [imeis, iccids, quantidadeBate])

  const { data: lotesRastreadores = [] } = useQuery<{ id: number; referencia: string; quantidadeDisponivelSemId: number }[]>({
    queryKey: ['lotes-rastreadores'],
    queryFn: () => api('/aparelhos/pareamento/lotes-rastreadores'),
    enabled: modo === 'massa' || modo === 'individual',
  })

  const { data: lotesSims = [] } = useQuery<{ id: number; referencia: string; quantidadeDisponivelSemId: number }[]>({
    queryKey: ['lotes-sims'],
    queryFn: () => api('/aparelhos/pareamento/lotes-sims'),
    enabled: modo === 'massa' || modo === 'individual',
  })

  const { data: marcas = [] } = useQuery<{ id: number; nome: string; ativo: boolean }[]>({
    queryKey: ['marcas'],
    queryFn: () => api('/equipamentos/marcas'),
    enabled: modo === 'individual' || modo === 'massa',
  })
  const { data: modelos = [] } = useQuery<{ id: number; nome: string; marca: { id: number } }[]>({
    queryKey: ['modelos'],
    queryFn: () => api('/equipamentos/modelos'),
    enabled: modo === 'individual' || modo === 'massa',
  })
  const { data: operadoras = [] } = useQuery<{ id: number; nome: string; ativo: boolean }[]>({
    queryKey: ['operadoras'],
    queryFn: () => api('/equipamentos/operadoras'),
    enabled: modo === 'individual' || modo === 'massa',
  })
  const { data: kits = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ['kits'],
    queryFn: () => api('/aparelhos/pareamento/kits'),
    enabled: (modo === 'individual' && adicionarKit) || (modo === 'massa' && adicionarKitMassa),
  })

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas])
  const operadorasAtivas = useMemo(() => operadoras.filter((o) => o.ativo), [operadoras])
  const modelosPorMarca = useMemo(() => {
    if (!marcaRastreador) return []
    const marcaEncontrada = marcasAtivas.find((m) => m.nome === marcaRastreador)
    if (!marcaEncontrada) return []
    return modelos.filter((m) => m.marca.id === marcaEncontrada.id)
  }, [marcaRastreador, marcasAtivas, modelos])

  const modelosPorMarcaMassa = useMemo(() => {
    if (!marcaRastreadorMassa) return []
    const marcaEncontrada = marcasAtivas.find((m) => m.nome === marcaRastreadorMassa)
    if (!marcaEncontrada) return []
    return modelos.filter((m) => m.marca.id === marcaEncontrada.id)
  }, [marcaRastreadorMassa, marcasAtivas, modelos])

  const paresIndividual = useMemo(() => {
    const imei = imeiIndividual.replace(/\D/g, '')
    const iccid = iccidIndividual.replace(/\D/g, '')
    // Alinhado com backend: IMEI 14-16 dígitos, ICCID 18-21 dígitos
    if (imei.length < 14 || imei.length > 16 || iccid.length < 18 || iccid.length > 21) return []
    return [{ imei: imeiIndividual.trim(), iccid: iccidIndividual.trim() }]
  }, [imeiIndividual, iccidIndividual])

  const fetchPreview = useCallback(async () => {
    const pares = modo === 'individual' ? paresIndividual : paresMassa
    if (pares.length === 0) return null
    const res = await api<PreviewResult>('/aparelhos/pareamento/preview', {
      method: 'POST',
      body: JSON.stringify({ pares }),
    })
    return res
  }, [modo, paresIndividual, paresMassa])

  const previewMutation = useMutation({
    mutationFn: fetchPreview,
    onSuccess: (data) => setPreview(data ?? null),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao gerar preview'),
  })

  const pareamentoMutation = useMutation({
    mutationFn: async () => {
      const paresParaEnviar =
        modo === 'individual'
          ? paresIndividual
          : (preview?.linhas
              .filter(
                (l) =>
                  l.action_needed === 'OK' ||
                  l.action_needed === 'SELECT_TRACKER_LOT' ||
                  l.action_needed === 'SELECT_SIM_LOT'
              )
              .map((l) => ({ imei: l.imei, iccid: l.iccid })) ?? [])

      const kitPayload =
        modo === 'individual' && adicionarKit
          ? kitModo === 'existente' && kitIdExistente
            ? { kitId: +kitIdExistente }
            : kitModo === 'novo' && kitNomeNovo.trim()
              ? { kitNome: kitNomeNovo.trim() }
              : {}
          : modo === 'massa' && adicionarKitMassa
            ? kitModoMassa === 'existente' && kitIdExistenteMassa
              ? { kitId: +kitIdExistenteMassa }
              : kitModoMassa === 'novo' && kitNomeMassa.trim()
                ? { kitNome: kitNomeMassa.trim() }
                : {}
            : {}

      return api<{ criados: number }>('/aparelhos/pareamento', {
        method: 'POST',
        body: JSON.stringify({
          pares: paresParaEnviar,
          loteRastreadorId:
            modo === 'individual' && pertenceLoteRastreador && loteRastreadorId
              ? +loteRastreadorId
              : modo === 'massa' && pertenceLoteRastreadorMassa && loteRastreadorId
                ? +loteRastreadorId
                : undefined,
          loteSimId:
            modo === 'individual' && pertenceLoteSim && loteSimId
              ? +loteSimId
              : modo === 'massa' && pertenceLoteSimMassa && loteSimId
                ? +loteSimId
                : undefined,
          rastreadorManual:
            modo === 'individual' && !pertenceLoteRastreador && marcaRastreador && modeloRastreador
              ? { marca: marcaRastreador, modelo: modeloRastreador }
              : modo === 'massa' && !pertenceLoteRastreadorMassa && marcaRastreadorMassa && modeloRastreadorMassa
                ? { marca: marcaRastreadorMassa, modelo: modeloRastreadorMassa }
                : undefined,
          simManual:
            modo === 'individual' && !pertenceLoteSim && operadoraSim
              ? { operadora: operadoraSim }
              : modo === 'massa' && !pertenceLoteSimMassa && operadoraSimMassa
                ? { operadora: operadoraSimMassa }
                : undefined,
          ...kitPayload,
        }),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['aparelhos'] })
      queryClient.invalidateQueries({ queryKey: ['kits'] })
      setQuantidadeCriada((prev) => prev + (data?.criados ?? 0))
      toast.success(`${data?.criados ?? 0} equipamento(s) criado(s) com sucesso!`)
      if (modo === 'individual') {
        setImeiIndividual('')
        setIccidIndividual('')
        setPertenceLoteRastreador(false)
        setPertenceLoteSim(false)
        setMarcaRastreador('')
        setModeloRastreador('')
        setOperadoraSim('')
        setLoteRastreadorId('')
        setLoteSimId('')
        setKitIdExistente('')
        setKitNomeNovo('')
      } else {
        setPreview(null)
        setTextImeis('')
        setTextIccids('')
        setLoteRastreadorId('')
        setLoteSimId('')
        setPertenceLoteRastreadorMassa(true)
        setPertenceLoteSimMassa(true)
        setMarcaRastreadorMassa('')
        setModeloRastreadorMassa('')
        setOperadoraSimMassa('')
        setAdicionarKitMassa(false)
        setKitModoMassa('existente')
        setKitIdExistenteMassa('')
        setKitNomeMassa('')
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar equipamentos'),
  })

  const podeConfirmarIndividual = useMemo(() => {
    const imei = imeiIndividual.replace(/\D/g, '')
    const iccid = iccidIndividual.replace(/\D/g, '')
    // Alinhado com backend: IMEI 14-16, ICCID 18-21
    return imei.length >= 14 && imei.length <= 16 && iccid.length >= 18 && iccid.length <= 21
  }, [imeiIndividual, iccidIndividual])

  const loteRastreadorSelecionado = useMemo(
    () =>
      pertenceLoteRastreador &&
      loteRastreadorId &&
      loteRastreadorId !== '_' &&
      !isNaN(Number(loteRastreadorId)),
    [pertenceLoteRastreador, loteRastreadorId]
  )
  const loteSimSelecionado = useMemo(
    () =>
      pertenceLoteSim &&
      loteSimId &&
      loteSimId !== '_' &&
      !isNaN(Number(loteSimId)),
    [pertenceLoteSim, loteSimId]
  )

  const progressoVinculoIndividual = useMemo(() => {
    const imei = imeiIndividual.replace(/\D/g, '')
    const iccid = iccidIndividual.replace(/\D/g, '')
    const imeiOk = imei.length >= 14
    const iccidOk = iccid.length >= 18
    const rastreadorOk = pertenceLoteRastreador
      ? loteRastreadorSelecionado
      : !!(marcaRastreador && modeloRastreador)
    const simOk = pertenceLoteSim ? loteSimSelecionado : !!operadoraSim
    const itensCompletos =
      (imeiOk ? 1 : 0) + (iccidOk ? 1 : 0) + (rastreadorOk ? 1 : 0) + (simOk ? 1 : 0)
    return (itensCompletos / 4) * 100
  }, [
    imeiIndividual,
    iccidIndividual,
    pertenceLoteRastreador,
    pertenceLoteSim,
    loteRastreadorSelecionado,
    loteSimSelecionado,
    marcaRastreador,
    modeloRastreador,
    operadoraSim,
  ])

  const podeConfirmarPareamentoIndividual = useMemo(() => {
    if (!podeConfirmarIndividual || !preview) return false
    if (preview.contadores.validos > 0) return true
    if (preview.contadores.exigemLote > 0) {
      const needTracker = preview.linhas.some((l) => l.tracker_status === 'NEEDS_CREATE')
      const needSim = preview.linhas.some((l) => l.sim_status === 'NEEDS_CREATE')
      if (needTracker) {
        const temLote = pertenceLoteRastreador && loteRastreadorId
        const temManual = !pertenceLoteRastreador && marcaRastreador && modeloRastreador
        if (!temLote && !temManual) return false
      }
      if (needSim) {
        const temLote = pertenceLoteSim && loteSimId
        const temManual = !pertenceLoteSim && operadoraSim
        if (!temLote && !temManual) return false
      }
      return true
    }
    return false
  }, [
    podeConfirmarIndividual,
    preview,
    loteRastreadorId,
    loteSimId,
    pertenceLoteRastreador,
    pertenceLoteSim,
    marcaRastreador,
    modeloRastreador,
    operadoraSim,
  ])

  const podeConfirmarMassa = useMemo(() => {
    if (!quantidadeBate || paresMassa.length === 0) return false
    if (!preview) return false
    const validos = preview.contadores.validos
    const exigemLote = preview.contadores.exigemLote
    const temErros = preview.contadores.erros > 0
    if (temErros && validos === 0 && exigemLote === 0) return false
    if (exigemLote > 0) {
      const needTracker = preview.linhas.some((l) => l.tracker_status === 'NEEDS_CREATE')
      const needSim = preview.linhas.some((l) => l.sim_status === 'NEEDS_CREATE')
      if (needTracker) {
        const temLote = pertenceLoteRastreadorMassa && loteRastreadorId
        const temManual = !pertenceLoteRastreadorMassa && marcaRastreadorMassa && modeloRastreadorMassa
        if (!temLote && !temManual) return false
      }
      if (needSim) {
        const temLote = pertenceLoteSimMassa && loteSimId
        const temManual = !pertenceLoteSimMassa && operadoraSimMassa
        if (!temLote && !temManual) return false
      }
    }
    return validos > 0 || exigemLote > 0
  }, [
    quantidadeBate,
    paresMassa,
    preview,
    loteRastreadorId,
    loteSimId,
    pertenceLoteRastreadorMassa,
    pertenceLoteSimMassa,
    marcaRastreadorMassa,
    modeloRastreadorMassa,
    operadoraSimMassa,
  ])

  const lastPreviewAttemptRef = useRef<string | null>(null)

  useEffect(() => {
    if (
      modo !== 'individual' ||
      !podeConfirmarIndividual ||
      preview ||
      previewMutation.isPending
    )
      return
    const key = `${imeiIndividual.trim()}|${iccidIndividual.trim()}`
    if (lastPreviewAttemptRef.current === key) return
    lastPreviewAttemptRef.current = key
    previewMutation.mutate()
  }, [
    modo,
    podeConfirmarIndividual,
    preview,
    previewMutation.isPending,
    imeiIndividual,
    iccidIndividual,
  ])

  const handleGerarPreview = () => {
    if (modo === 'individual') {
      if (paresIndividual.length === 0) {
        toast.error('Informe IMEI (15 dígitos) e ICCID (19-20 dígitos)')
        return
      }
    } else {
      if (!quantidadeBate) {
        toast.error(`Quantidade não confere: ${imeis.length} IMEIs x ${iccids.length} ICCIDs`)
        return
      }
      if (paresMassa.length === 0) {
        toast.error('Cole as listas de IMEIs e ICCIDs')
        return
      }
    }
    previewMutation.mutate()
  }

  const limparIndividual = () => {
    setImeiIndividual('')
    setIccidIndividual('')
    setPertenceLoteRastreador(false)
    setPertenceLoteSim(false)
    setMarcaRastreador('')
    setModeloRastreador('')
    setOperadoraSim('')
    setLoteRastreadorId('')
    setLoteSimId('')
    setPreview(null)
    lastPreviewAttemptRef.current = null
  }

  const limparMassa = () => {
    setTextImeis('')
    setTextIccids('')
    setPreview(null)
    setLoteRastreadorId('')
    setLoteSimId('')
    setPertenceLoteRastreadorMassa(true)
    setPertenceLoteSimMassa(true)
    setMarcaRastreadorMassa('')
    setModeloRastreadorMassa('')
    setOperadoraSimMassa('')
    setAdicionarKitMassa(false)
    setKitModoMassa('existente')
    setKitIdExistenteMassa('')
    setKitNomeMassa('')
  }

  const subtituloPorModo: Record<ModoPareamento, string> = {
    individual: 'Pareamento individual (rastreador + SIM)',
    massa: 'Cadastro em massa (colagem de IMEIs e ICCIDs)',
    csv: 'Importação via arquivo CSV',
  }

  return (
    <div className="-m-4 min-h-[100dvh] flex flex-col bg-slate-100">
      {/* Header */}
      <header className="sticky -top-4 z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/equipamentos"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon name="link" className="text-blue-600 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                Pareamento de Equipamentos
              </h1>
              <p className="text-xs text-slate-500">{subtituloPorModo[modo]}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModo('individual')}
            className={cn(
              'px-4 py-2 text-[11px] font-bold uppercase rounded-sm border transition-all',
              modo === 'individual'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            )}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setModo('massa')}
            className={cn(
              'px-4 py-2 text-[11px] font-bold uppercase rounded-sm border transition-all',
              modo === 'massa'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            )}
          >
            Em Massa (Colagem)
          </button>
          <button
            type="button"
            onClick={() => setModo('csv')}
            className={cn(
              'px-4 py-2 text-[11px] font-bold uppercase rounded-sm border transition-all opacity-50 cursor-not-allowed',
              'bg-white text-slate-500 border-slate-200'
            )}
            title="Em breve"
          >
            Importação CSV
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mx-auto max-w-[1400px]">
          {modo === 'individual' && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="sensors" className="text-blue-600 text-xl" />
                        <h3 className="text-xs font-bold text-slate-700 uppercase">Rastreador</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">PASSO 01</span>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          IMEI do Equipamento
                        </Label>
                        <div className="relative">
                          <Input
                            value={imeiIndividual}
                            onChange={(e) => setImeiIndividual(e.target.value)}
                            placeholder="Ex: 358942109982341"
                            className="h-9 pr-10 font-mono text-sm"
                          />
                          <MaterialIcon
                            name="barcode_scanner"
                            className="absolute right-2.5 top-2 text-slate-300"
                          />
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pertenceLoteRastreador}
                          onChange={(e) => setPertenceLoteRastreador(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-[11px] font-bold uppercase text-slate-600">
                          Pertence a um lote
                        </span>
                      </label>
                      {pertenceLoteRastreador ? (
                        <div>
                          <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                            Lote
                          </Label>
                          <Select value={loteRastreadorId} onValueChange={setLoteRastreadorId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione o lote..." />
                            </SelectTrigger>
                            <SelectContent>
                              {lotesRastreadores.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)}>
                                  {l.referencia} ({l.quantidadeDisponivelSemId} disp.)
                                </SelectItem>
                              ))}
                              {lotesRastreadores.length === 0 && (
                                <SelectItem value="_" disabled>Nenhum lote disponível</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                              Marca (se criar novo)
                            </Label>
                            <Select value={marcaRastreador} onValueChange={(v) => { setMarcaRastreador(v); setModeloRastreador('') }}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {marcasAtivas.map((m) => (
                                  <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                              Modelo (se criar novo)
                            </Label>
                            <Select value={modeloRastreador} onValueChange={setModeloRastreador} disabled={!marcaRastreador}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder={marcaRastreador ? 'Selecione...' : 'Marca primeiro'} />
                              </SelectTrigger>
                              <SelectContent>
                                {modelosPorMarca.map((m) => (
                                  <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      {preview?.linhas[0]?.tracker_status === 'FOUND_AVAILABLE' && (
                        <div className="grid grid-cols-2 gap-3 rounded-sm bg-slate-50 p-2">
                          <div>
                            <Label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Marca</Label>
                            <span className="text-xs font-medium">{preview.linhas[0].marca ?? '--'}</span>
                          </div>
                          <div>
                            <Label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Modelo</Label>
                            <span className="text-xs font-medium">{preview.linhas[0].modelo ?? '--'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="sim_card" className="text-blue-600 text-xl" />
                        <h3 className="text-xs font-bold text-slate-700 uppercase">SIM Card</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">PASSO 02</span>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          ICCID / Linha
                        </Label>
                        <div className="relative">
                          <Input
                            value={iccidIndividual}
                            onChange={(e) => setIccidIndividual(e.target.value)}
                            placeholder="Ex: 895501100000001"
                            className="h-9 pr-10 font-mono text-sm"
                          />
                          <MaterialIcon name="search" className="absolute right-2.5 top-2 text-slate-300" />
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pertenceLoteSim}
                          onChange={(e) => setPertenceLoteSim(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-[11px] font-bold uppercase text-slate-600">
                          Pertence a um lote
                        </span>
                      </label>
                      {pertenceLoteSim ? (
                        <div>
                          <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                            Lote
                          </Label>
                          <Select value={loteSimId} onValueChange={setLoteSimId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione o lote..." />
                            </SelectTrigger>
                            <SelectContent>
                              {lotesSims.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)}>
                                  {l.referencia} ({l.quantidadeDisponivelSemId} disp.)
                                </SelectItem>
                              ))}
                              {lotesSims.length === 0 && (
                                <SelectItem value="_" disabled>Nenhum lote disponível</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                            Operadora (se criar novo)
                          </Label>
                          <Select value={operadoraSim} onValueChange={setOperadoraSim}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {operadorasAtivas.map((o) => (
                                <SelectItem key={o.id} value={o.nome}>{o.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {preview?.linhas[0]?.sim_status === 'FOUND_AVAILABLE' && (
                        <div className="rounded-sm bg-slate-50 p-2">
                          <Label className="mb-1 block text-[9px] font-bold uppercase text-slate-400">Operadora</Label>
                          <span className="text-xs font-medium">{preview.linhas[0].operadora ?? '--'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-dashed border-blue-200 bg-blue-50/30 p-6">
                  <div className="mb-4 flex items-center gap-2 border-b border-blue-100 pb-3">
                    <MaterialIcon name="lan" className="text-blue-600 text-lg" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-800">
                      Visualização da Unidade Lógica
                    </h3>
                  </div>
                    <div className="flex items-center justify-center gap-8 text-slate-400">
                    <div className="flex flex-col items-center gap-1">
                      <Router className="h-8 w-8" />
                      <span className="text-[10px] font-bold uppercase">
                        {imeiIndividual.trim() || 'Aguardando IMEI'}
                      </span>
                    </div>
                    <Link2 className="h-6 w-6 text-slate-300" />
                    <div className="flex flex-col items-center gap-1">
                      <Smartphone className="h-8 w-8" />
                      <span className="text-[10px] font-bold uppercase">
                        {iccidIndividual.trim() || 'Aguardando ICCID'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <MaterialIcon name="inventory" className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Vinculação a Kit</h3>
                        <p className="text-[10px] font-medium uppercase text-slate-500">
                          Opcional: Associar este par a um kit de instalação
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={adicionarKit}
                        onChange={(e) => setAdicionarKit(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:left-[22px] peer-checked:bg-blue-600 peer-focus:outline-none" />
                      <span className="ml-3 shrink-0 whitespace-nowrap text-[10px] font-bold uppercase text-slate-600">
                        Ativar Vínculo
                      </span>
                    </label>
                  </div>
                  {adicionarKit && (
                    <div className="mt-4 space-y-4 bg-slate-50/30 p-5">
                      <div className="flex gap-4">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="kitModo"
                            checked={kitModo === 'existente'}
                            onChange={() => setKitModo('existente')}
                            className="h-4 w-4 border-slate-300 text-blue-600"
                          />
                          <span className="text-[11px] font-bold uppercase text-slate-600">
                            Selecionar kit existente
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="kitModo"
                            checked={kitModo === 'novo'}
                            onChange={() => setKitModo('novo')}
                            className="h-4 w-4 border-slate-300 text-blue-600"
                          />
                          <span className="text-[11px] font-bold uppercase text-slate-600">
                            Criar novo kit
                          </span>
                        </label>
                      </div>
                      {kitModo === 'existente' ? (
                        <div>
                          <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                            Kit
                          </Label>
                          <Select value={kitIdExistente} onValueChange={setKitIdExistente}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione um kit..." />
                            </SelectTrigger>
                            <SelectContent>
                              {kits.map((k) => (
                                <SelectItem key={k.id} value={String(k.id)}>
                                  {k.nome}
                                </SelectItem>
                              ))}
                              {kits.length === 0 && (
                                <SelectItem value="_" disabled>Nenhum kit cadastrado</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">
                            Nome do novo kit
                          </Label>
                          <Input
                            value={kitNomeNovo}
                            onChange={(e) => setKitNomeNovo(e.target.value)}
                            placeholder="Ex: Kit Padrão Caminhão"
                            className="h-9"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-4">
                <div className="sticky top-24 space-y-4">
                  <div className="overflow-hidden rounded-sm border border-slate-700 bg-slate-900 text-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Resumo da Configuração
                      </h3>
                      {podeConfirmarPareamentoIndividual ? (
                        <span className="rounded-sm bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          PRONTO
                        </span>
                      ) : preview ? (
                        preview.contadores.exigemLote > 0 ? (
                          <span className="rounded-sm bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            CONFIGURE
                          </span>
                        ) : (
                          <span className="rounded-sm bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            ERRO
                          </span>
                        )
                      ) : (
                        <span className="rounded-sm bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          RASCUNHO
                        </span>
                      )}
                    </div>
                    <div className="space-y-6 p-6">
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Rastreador
                        </label>
                        <div className="flex items-center gap-3 rounded-sm border border-slate-800 bg-slate-800/50 p-3">
                          <MaterialIcon name="sensors" className="text-slate-500" />
                          <span className="font-mono text-xs text-slate-300">
                            {imeiIndividual.trim() || '-- PENDENTE --'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          SIM Card
                        </label>
                        <div className="flex items-center gap-3 rounded-sm border border-slate-800 bg-slate-800/50 p-3">
                          <MaterialIcon name="sim_card" className="text-slate-500" />
                          <span className="font-mono text-xs text-slate-300">
                            {iccidIndividual.trim() || '-- PENDENTE --'}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-slate-800 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            Status do Vínculo
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase',
                              podeConfirmarPareamentoIndividual ? 'text-emerald-400' : 'text-amber-400'
                            )}
                          >
                            {podeConfirmarPareamentoIndividual ? 'Completo' : 'Incompleto'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{
                              width: podeConfirmarPareamentoIndividual
                                ? '100%'
                                : `${progressoVinculoIndividual}%`,
                            }}
                          />
                        </div>
                        {!podeConfirmarPareamentoIndividual && !podeConfirmarIndividual &&
                          (imeiIndividual.replace(/\D/g, '').length > 0 || iccidIndividual.replace(/\D/g, '').length > 0) && (
                          <p className="mt-2 text-[10px] text-amber-400">
                            IMEI deve ter 14–16 dígitos. ICCID deve ter 18–21 dígitos.
                          </p>
                        )}
                        {!podeConfirmarPareamentoIndividual && podeConfirmarIndividual && (
                          <div className="mt-2 space-y-1.5">
                            {!preview ? (
                              <p className="text-[10px] text-amber-400">Verificando...</p>
                            ) : preview.contadores.exigemLote > 0 ? (
                              <p className="text-[10px] text-amber-400">
                                Selecione os lotes ou informe marca/modelo e operadora para itens novos.
                              </p>
                            ) : preview.contadores.erros > 0 ? (
                              <>
                                <p className="text-[10px] text-amber-400">
                                  Corrija os erros abaixo:
                                </p>
                                {preview.linhas[0] && (
                                  <div className="flex flex-wrap gap-2">
                                    {preview.linhas[0].tracker_status === 'INVALID_FORMAT' && (
                                      <span
                                        className={cn(
                                          'rounded px-2 py-0.5 text-[10px] font-bold',
                                          TRACKER_STATUS_LABELS.INVALID_FORMAT.className
                                        )}
                                      >
                                        Rastreador: Formato inválido (IMEI deve ter 14-16 dígitos)
                                      </span>
                                    )}
                                    {preview.linhas[0].tracker_status === 'FOUND_ALREADY_LINKED' && (
                                      <span
                                        className={cn(
                                          'rounded px-2 py-0.5 text-[10px] font-bold',
                                          TRACKER_STATUS_LABELS.FOUND_ALREADY_LINKED.className
                                        )}
                                      >
                                        Rastreador: Em uso (já vinculado)
                                      </span>
                                    )}
                                    {preview.linhas[0].sim_status === 'INVALID_FORMAT' && (
                                      <span
                                        className={cn(
                                          'rounded px-2 py-0.5 text-[10px] font-bold',
                                          TRACKER_STATUS_LABELS.INVALID_FORMAT.className
                                        )}
                                      >
                                        SIM: Formato inválido (ICCID deve ter 18-21 dígitos)
                                      </span>
                                    )}
                                    {preview.linhas[0].sim_status === 'FOUND_ALREADY_LINKED' && (
                                      <span
                                        className={cn(
                                          'rounded px-2 py-0.5 text-[10px] font-bold',
                                          TRACKER_STATUS_LABELS.FOUND_ALREADY_LINKED.className
                                        )}
                                      >
                                        SIM: Em uso (já vinculado)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-[10px] text-amber-400">Clique em Verificar para validar os dados.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {quantidadeCriada > 0 && (
                    <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-800">
                        {quantidadeCriada} equipamento(s) criado(s) nesta sessão
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {modo === 'massa' && (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-8 space-y-6">
                <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <MaterialIcon name="edit_note" className="text-slate-600 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                          Entrada de Dados
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                          Cole uma lista de identificadores por linha (vírgula, ponto-vírgula ou quebra de linha)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                          <MaterialIcon name="sensors" className="text-blue-600 text-base" />
                        </div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Lista de IMEIs (Rastreadores)
                        </Label>
                      </div>
                      <textarea
                        value={textImeis}
                        onChange={(e) => setTextImeis(e.target.value)}
                        placeholder={`358942109982341\n358942109982342\n358942109982343...`}
                        className="h-48 w-full resize-none rounded-sm border border-slate-300 p-3 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                          <MaterialIcon name="sim_card" className="text-blue-600 text-base" />
                        </div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Lista de ICCIDs (SIM Cards)
                        </Label>
                      </div>
                      <textarea
                        value={textIccids}
                        onChange={(e) => setTextIccids(e.target.value)}
                        placeholder={`895501100000001\n895501100000002\n895501100000003...`}
                        className="h-48 w-full resize-none rounded-sm border border-slate-300 p-3 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <MaterialIcon name="inventory_2" className="text-slate-600" />
                      </div>
                      <div>
                        <Label className="block text-[10px] font-bold uppercase text-slate-600">
                          Para novos IDs: Lote ou criação manual
                        </Label>
                        <p className="text-[10px] font-medium text-slate-500">
                          Rastreadores e SIMs não encontrados serão criados conforme a configuração abaixo
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200">
                            <MaterialIcon name="sensors" className="text-blue-600 text-lg" />
                          </div>
                          <Label className="text-[10px] font-bold uppercase text-slate-600">Rastreadores</Label>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pertenceLoteRastreadorMassa}
                            onChange={(e) => setPertenceLoteRastreadorMassa(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span className="text-[11px] font-bold uppercase text-slate-600">
                            Pertence a um lote
                          </span>
                        </label>
                        {pertenceLoteRastreadorMassa ? (
                          <Select value={loteRastreadorId} onValueChange={setLoteRastreadorId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione o lote..." />
                            </SelectTrigger>
                            <SelectContent>
                              {lotesRastreadores.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)}>
                                  {l.referencia} ({l.quantidadeDisponivelSemId} disp.)
                                </SelectItem>
                              ))}
                              {lotesRastreadores.length === 0 && (
                                <SelectItem value="_" disabled>Nenhum lote disponível</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="mb-1 block text-[10px] font-bold text-slate-500">Marca</Label>
                              <Select
                                value={marcaRastreadorMassa}
                                onValueChange={(v) => {
                                  setMarcaRastreadorMassa(v)
                                  setModeloRastreadorMassa('')
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {marcasAtivas.map((m) => (
                                    <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-1 block text-[10px] font-bold text-slate-500">Modelo</Label>
                              <Select
                                value={modeloRastreadorMassa}
                                onValueChange={setModeloRastreadorMassa}
                                disabled={!marcaRastreadorMassa}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder={marcaRastreadorMassa ? 'Selecione...' : 'Marca primeiro'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {modelosPorMarcaMassa.map((m) => (
                                    <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200">
                            <MaterialIcon name="sim_card" className="text-blue-600 text-lg" />
                          </div>
                          <Label className="text-[10px] font-bold uppercase text-slate-600">SIM Cards</Label>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pertenceLoteSimMassa}
                            onChange={(e) => setPertenceLoteSimMassa(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span className="text-[11px] font-bold uppercase text-slate-600">
                            Pertence a um lote
                          </span>
                        </label>
                        {pertenceLoteSimMassa ? (
                          <Select value={loteSimId} onValueChange={setLoteSimId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione o lote..." />
                            </SelectTrigger>
                            <SelectContent>
                              {lotesSims.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)}>
                                  {l.referencia} ({l.quantidadeDisponivelSemId} disp.)
                                </SelectItem>
                              ))}
                              {lotesSims.length === 0 && (
                                <SelectItem value="_" disabled>Nenhum lote disponível</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div>
                            <Label className="mb-1 block text-[10px] font-bold text-slate-500">Operadora</Label>
                            <Select value={operadoraSimMassa} onValueChange={setOperadoraSimMassa}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {operadorasAtivas.map((o) => (
                                  <SelectItem key={o.id} value={o.nome}>{o.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-sm border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <MaterialIcon name="inventory" className="text-slate-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Vinculação a Kit</h3>
                          <p className="text-[10px] font-medium uppercase text-slate-500">
                            Opcional: Associar os equipamentos a um kit de instalação
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={adicionarKitMassa}
                          onChange={(e) => setAdicionarKitMassa(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:left-[22px] peer-checked:bg-blue-600 peer-focus:outline-none" />
                        <span className="ml-3 shrink-0 whitespace-nowrap text-[10px] font-bold uppercase text-slate-600">
                          Ativar Vínculo
                        </span>
                      </label>
                    </div>
                    {adicionarKitMassa && (
                      <div className="mt-4 space-y-4 bg-slate-50/30 p-5">
                        <div className="flex gap-4">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              name="kitModoMassa"
                              checked={kitModoMassa === 'existente'}
                              onChange={() => setKitModoMassa('existente')}
                              className="h-4 w-4 border-slate-300 text-blue-600"
                            />
                            <span className="text-[11px] font-bold uppercase text-slate-600">
                              Selecionar kit existente
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              name="kitModoMassa"
                              checked={kitModoMassa === 'novo'}
                              onChange={() => setKitModoMassa('novo')}
                              className="h-4 w-4 border-slate-300 text-blue-600"
                            />
                            <span className="text-[11px] font-bold uppercase text-slate-600">
                              Criar novo kit
                            </span>
                          </label>
                        </div>
                        {kitModoMassa === 'existente' ? (
                          <div>
                            <Label className="mb-1 block text-[10px] font-bold text-slate-500">Kit</Label>
                            <Select value={kitIdExistenteMassa} onValueChange={setKitIdExistenteMassa}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione um kit..." />
                              </SelectTrigger>
                              <SelectContent>
                                {kits.map((k) => (
                                  <SelectItem key={k.id} value={String(k.id)}>
                                    {k.nome}
                                  </SelectItem>
                                ))}
                                {kits.length === 0 && (
                                  <SelectItem value="_" disabled>Nenhum kit cadastrado</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label className="mb-1 block text-[10px] font-bold text-slate-500">Nome do novo kit</Label>
                            <Input
                              value={kitNomeMassa}
                              onChange={(e) => setKitNomeMassa(e.target.value)}
                              placeholder="Ex: Kit Padrão Caminhão"
                              className="h-9"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!quantidadeBate && (imeis.length > 0 || iccids.length > 0) && (
                    <div className="mt-4 flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <p className="text-sm font-bold text-amber-800">
                        Quantidade não confere: {imeis.length} IMEIs x {iccids.length} ICCIDs.
                        {imeis.length > iccids.length
                          ? ` Faltam ${imeis.length - iccids.length} ICCID(s).`
                          : ` Faltam ${iccids.length - imeis.length} IMEI(s).`}
                      </p>
                    </div>
                  )}
                </div>

                {preview && (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="flex-1 rounded-sm border-l-4 border-emerald-500 bg-white p-4 shadow-sm">
                        <Label className="block text-[10px] font-bold uppercase text-slate-400">
                          Válidos
                        </Label>
                        <p className="text-2xl font-bold text-slate-800">{preview.contadores.validos}</p>
                      </div>
                      <div className="flex-1 rounded-sm border-l-4 border-blue-500 bg-white p-4 shadow-sm">
                        <Label className="block text-[10px] font-bold uppercase text-slate-400">
                          Exigem Lote
                        </Label>
                        <p className="text-2xl font-bold text-slate-800">{preview.contadores.exigemLote}</p>
                      </div>
                      <div className="flex-1 rounded-sm border-l-4 border-amber-500 bg-white p-4 shadow-sm">
                        <Label className="block text-[10px] font-bold uppercase text-slate-400">
                          Duplicados
                        </Label>
                        <p className="text-2xl font-bold text-slate-800">0</p>
                      </div>
                      <div className="flex-1 rounded-sm border-l-4 border-red-500 bg-white p-4 shadow-sm">
                        <Label className="block text-[10px] font-bold uppercase text-slate-400">
                          Erros
                        </Label>
                        <p className="text-2xl font-bold text-slate-800">{preview.contadores.erros}</p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Preview de Associação
                        </span>
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[9px] text-slate-600">
                          {preview.linhas.length} itens processados
                        </span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                              IMEI
                            </TableHead>
                            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                              ICCID
                            </TableHead>
                            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                              Status Rastreador
                            </TableHead>
                            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                              Status SIM
                            </TableHead>
                            <TableHead className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                              Resultado
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.linhas.map((linha, idx) => (
                            <TableRow key={idx} className="border-slate-100">
                              <TableCell className="px-4 py-3 font-mono text-xs">
                                {linha.imei}
                              </TableCell>
                              <TableCell className="px-4 py-3 font-mono text-xs">
                                {linha.iccid}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                    TRACKER_STATUS_LABELS[linha.tracker_status].className
                                  )}
                                >
                                  {TRACKER_STATUS_LABELS[linha.tracker_status].label}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                    TRACKER_STATUS_LABELS[linha.sim_status].className
                                  )}
                                >
                                  {TRACKER_STATUS_LABELS[linha.sim_status].label}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-[11px]">
                                <span className={ACTION_LABELS[linha.action_needed].className}>
                                  {ACTION_LABELS[linha.action_needed].label}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>

              <div className="col-span-4">
                <div className="sticky top-8">
                  <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                        Resumo da Montagem
                      </h3>
                      <MaterialIcon name="inventory_2" className="text-slate-400" />
                    </div>
                    <div className="space-y-6 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Total de Itens
                          </label>
                          <p className="mt-0.5 text-2xl font-bold text-slate-800">
                            {paresMassa.length} <span className="text-xs font-normal text-slate-400">Pares</span>
                          </p>
                        </div>
                        {preview && (
                          <div className="text-right">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              A Criar
                            </label>
                            <p className="mt-0.5 text-lg font-bold text-blue-600">
                              +{preview.contadores.validos + preview.contadores.exigemLote}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Parâmetros de Destino
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase text-slate-500">
                              Status Pós-Montagem:
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              Configurado
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/50 p-4">
                      <Info className="h-5 w-5 shrink-0 text-blue-500" />
                      <p className="text-[10px] font-medium uppercase leading-relaxed text-blue-700">
                        Equipamentos serão vinculados logicamente no sistema e marcados como prontos para instalação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - left-60 para não sobrepor a sidebar (240px) */}
      <footer className="fixed bottom-0 left-60 right-0 z-30 flex h-20 items-center justify-end gap-4 border-t border-slate-200 bg-white px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {modo === 'individual' ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={limparIndividual}
              className="h-11 px-6 text-[11px] font-bold uppercase text-slate-500"
            >
              Limpar Campos
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGerarPreview}
              disabled={!podeConfirmarIndividual || previewMutation.isPending}
              className="h-11 px-6 text-[11px] font-bold uppercase"
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verificar'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => pareamentoMutation.mutate()}
              disabled={!podeConfirmarPareamentoIndividual || pareamentoMutation.isPending}
              className="h-11 gap-2 px-8 bg-blue-600 text-[11px] font-bold uppercase hover:bg-blue-700"
            >
              {pareamentoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MaterialIcon name="link" className="text-lg" />
              )}
              Confirmar Pareamento
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={limparMassa}
              className="h-11 px-6 text-[11px] font-bold uppercase text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGerarPreview}
              disabled={!quantidadeBate || paresMassa.length === 0}
              variant="outline"
              className="h-11 px-6 text-[11px] font-bold uppercase"
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Gerar Preview'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => pareamentoMutation.mutate()}
              disabled={!podeConfirmarMassa || pareamentoMutation.isPending}
              className="h-11 gap-2 px-8 bg-blue-600 text-[11px] font-bold uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
            >
              {pareamentoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MaterialIcon name="settings_input_component" className="text-lg" />
              )}
              Criar Equipamentos
            </Button>
          </>
        )}
      </footer>
    </div>
  )
}
