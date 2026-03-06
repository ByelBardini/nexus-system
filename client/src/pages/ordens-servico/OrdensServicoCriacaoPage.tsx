import { useCallback, useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, Search } from 'lucide-react'
import { InputPlaca } from '@/components/InputPlaca'
import { placaApenasAlfanumericos, telefoneApenasDigitos } from '@/lib/format'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectTecnicoSearch } from '@/components/SelectTecnicoSearch'
import { InputCEP } from '@/components/InputCEP'
import { InputTelefone } from '@/components/InputTelefone'
import { InputCPFCNPJ } from '@/components/InputCPFCNPJ'
import { SelectUF } from '@/components/SelectUF'
import { SelectCidade } from '@/components/SelectCidade'
import { useUFs, useMunicipios } from '@/hooks/useBrasilAPI'
import type { EnderecoCEP } from '@/hooks/useBrasilAPI'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { MaterialIcon } from '@/components/MaterialIcon'
import { SelectClienteSearch } from '@/components/SelectClienteSearch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const tipoLabels: Record<string, string> = {
  INSTALACAO_COM_BLOQUEIO: 'Instalação c/ bloqueio',
  INSTALACAO_SEM_BLOQUEIO: 'Instalação s/ bloqueio',
  REVISAO: 'Revisão',
  RETIRADA: 'Retirada',
  DESLOCAMENTO: 'Deslocamento',
}

const tipoServicoConfig = {
  INSTALACAO: { label: 'Instalação', icon: 'add_circle' as const },
  REVISAO: { label: 'Revisão', icon: 'build_circle' as const },
  RETIRADA: { label: 'Retirada', icon: 'remove_circle' as const },
}

const cobrancaOptions = [
  { value: 'INFINITY', label: 'Infinity (Padrão)' },
  { value: 'CLIENTE', label: 'Direto Cliente' },
]

const veiculoTipoIconMap: Record<string, string> = {
  AUTO: 'directions_car',
  MOTOCICLETA: 'two_wheeler',
  CAMINHONETE: 'local_shipping',
  UTILITARIO: 'airport_shuttle',
  CAMINHÃO: 'local_shipping',
  MOTONETA: 'two_wheeler',
  CICLOMOTOR: 'two_wheeler',
}

const VEICULO_TIPOS = [
  { value: 'AUTO', label: 'Auto' },
  { value: 'MOTOCICLETA', label: 'Motocicleta' },
  { value: 'MOTONETA', label: 'Motoneta' },
  { value: 'CICLOMOTOR', label: 'Ciclomotor' },
  { value: 'CAMINHONETE', label: 'Caminhonete' },
  { value: 'UTILITARIO', label: 'Utilitário' },
  { value: 'CAMINHÃO', label: 'Caminhão' },
] as const


interface SubclienteAutocompleteItem {
  id: number
  nome: string
  cep?: string | null
  cidade?: string | null
  estado?: string | null
  cpf?: string | null
  email?: string | null
  telefone?: string | null
  cobrancaTipo?: string | null
}

function SubclienteNomeAutocomplete({
  subclientes,
  value,
  subclienteId,
  isNovoSubcliente,
  onSelect,
  onSelectNovo,
  onChange,
  placeholder,
}: {
  subclientes: SubclienteAutocompleteItem[]
  value: string
  subclienteId?: number
  isNovoSubcliente: boolean
  onSelect: (s: SubclienteAutocompleteItem) => void
  onSelectNovo: () => void
  onChange: (nome: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value)

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return subclientes
    const term = searchTerm.toLowerCase()
    return subclientes.filter((s) => s.nome.toLowerCase().includes(term))
  }, [subclientes, searchTerm])

  const displayValue = isOpen ? searchTerm : value

  useEffect(() => {
    if (!isOpen) setSearchTerm(value)
  }, [isOpen, value])

  function handleFocus() {
    setIsOpen(true)
    setSearchTerm(value)
  }

  function handleBlur() {
    setTimeout(() => {
      setIsOpen(false)
      setSearchTerm(value)
    }, 150)
  }

  function handleSelect(s: SubclienteAutocompleteItem) {
    onSelect(s)
    setIsOpen(false)
  }

  function handleInputChange(v: string) {
    setSearchTerm(v)
    onChange(v)
  }

  return (
    <div className="relative">
      <Input
        className="h-9 pr-9"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {isOpen && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <button
                type="button"
                className="w-full cursor-pointer rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 outline-none transition-colors hover:border-erp-blue hover:bg-erp-blue/5 hover:text-erp-blue"
                onMouseDown={() => {
                  onSelectNovo()
                  setIsOpen(false)
                }}
              >
                Novo Subcliente
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                Nenhum subcliente encontrado. Preencha os campos para criar novo.
              </p>
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  'w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  !isNovoSubcliente && subclienteId === s.id && 'bg-accent'
                )}
                onMouseDown={() => handleSelect(s)}
              >
                {s.nome}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function IdAparelhoSearch({
  rastreadores,
  value,
  onChange,
  placeholder,
}: {
  rastreadores: { id: number; identificador?: string | null }[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 })

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onScroll = () => setIsOpen(false)
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [isOpen])

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return rastreadores.slice(0, 20)
    const term = searchTerm.toLowerCase()
    return rastreadores.filter((a) =>
      (a.identificador ?? '').toLowerCase().includes(term)
    )
  }, [rastreadores, searchTerm])

  const displayValue = isOpen ? searchTerm : value

  useEffect(() => {
    if (!isOpen) setSearchTerm(value)
  }, [isOpen, value])

  function handleFocus() {
    setIsOpen(true)
    setSearchTerm(value)
  }

  function handleBlur() {
    setTimeout(() => {
      setIsOpen(false)
      const trimmed = searchTerm.trim()
      if (trimmed) onChange(trimmed)
    }, 150)
  }

  function handleSelect(id: string) {
    setSearchTerm(id)
    onChange(id)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        className="h-9 pr-9"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {isOpen &&
        createPortal(
          <div
            className="fixed z-[100] max-h-60 overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              minWidth: 200,
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {value && (
            <button
              type="button"
              className="w-full cursor-pointer px-3 py-2 text-left text-[11px] text-slate-500 hover:bg-accent"
              onMouseDown={() => {
                onChange('')
                setSearchTerm('')
              }}
            >
              Limpar
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-[11px] text-slate-500">
              Nenhum rastreador instalado na lista. Digite o ID manualmente.
            </div>
          ) : (
            filtered.map((a) => {
              const id = (a.identificador ?? '').trim()
              if (!id) return null
              return (
                <button
                  key={a.id}
                  type="button"
                  className={cn(
                    'w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === id && 'bg-accent'
                  )}
                  onMouseDown={() => handleSelect(id)}
                >
                  {id}
                </button>
              )
            })
          )}
          </div>,
          document.body
        )}
    </div>
  )
}

const schema = z.object({
  ordemInstalacao: z.enum(['INFINITY', 'CLIENTE']),
  clienteOrdemId: z.number().optional(),
  isNovoSubcliente: z.boolean(),
  subclienteId: z.number().optional(),
  // Dados do subcliente (quando novo)
  subclienteNome: z.string().optional(),
  subclienteCep: z.string().optional(),
  subclienteLogradouro: z.string().optional(),
  subclienteNumero: z.string().optional(),
  subclienteComplemento: z.string().optional(),
  subclienteBairro: z.string().optional(),
  subclienteCidade: z.string().optional(),
  subclienteEstado: z.string().optional(),
  subclienteCpf: z.string().optional(),
  subclienteEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  subclienteTelefone: z.string().optional(),
  subclienteCobranca: z.string().optional(),
  tecnicoId: z.number().optional(),
  veiculoPlaca: z.string().optional(),
  veiculoMarca: z.string().optional(),
  veiculoModelo: z.string().optional(),
  veiculoAno: z.string().optional(),
  veiculoCor: z.string().optional(),
  veiculoTipo: z.string().optional(),
  tipo: z.string().min(1, 'Tipo de serviço obrigatório'),
  idAparelho: z.string().optional(),
  localInstalacao: z.string().optional(),
  posChave: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface SubclienteFull {
  id: number
  nome: string
  cep?: string | null
  cidade?: string | null
  estado?: string | null
  cpf?: string | null
  email?: string | null
  telefone?: string | null
  cobrancaTipo?: string | null
}

interface Cliente {
  id: number
  nome: string
  subclientes?: SubclienteFull[]
}

interface PrecoTecnico {
  instalacaoComBloqueio?: number | string
  instalacaoSemBloqueio?: number | string
  revisao?: number | string
  retirada?: number | string
  deslocamento?: number | string
}

interface Tecnico {
  id: number
  nome: string
  cidade?: string | null
  estado?: string | null
  precos?: PrecoTecnico | null
}

const tipoToPrecoKey: Record<string, keyof PrecoTecnico> = {
  INSTALACAO_COM_BLOQUEIO: 'instalacaoComBloqueio',
  INSTALACAO_SEM_BLOQUEIO: 'instalacaoSemBloqueio',
  REVISAO: 'revisao',
  RETIRADA: 'retirada',
  DESLOCAMENTO: 'deslocamento',
}

const defaultValues: FormData = {
  ordemInstalacao: 'INFINITY',
  clienteOrdemId: undefined,
  isNovoSubcliente: true,
  subclienteId: undefined,
  subclienteNome: '',
  subclienteCep: '',
  subclienteLogradouro: '',
  subclienteNumero: '',
  subclienteComplemento: '',
  subclienteBairro: '',
  subclienteCidade: '',
  subclienteEstado: '',
  subclienteCpf: '',
  subclienteEmail: '',
  subclienteTelefone: '',
  subclienteCobranca: 'INFINITY',
  tecnicoId: undefined,
  veiculoPlaca: '',
  veiculoMarca: '',
  veiculoModelo: '',
  veiculoAno: '',
  veiculoCor: '',
  veiculoTipo: '',
  tipo: '',
  idAparelho: '',
  localInstalacao: '',
  posChave: '',
  observacoes: '',
}

export function OrdensServicoCriacaoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, hasPermission } = useAuth()
  const canCreate = hasPermission('AGENDAMENTO.OS.CRIAR')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const ordemInstalacao = form.watch('ordemInstalacao')
  const clienteOrdemId = form.watch('clienteOrdemId')
  const tipo = form.watch('tipo')

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes', 'subclientes'],
    queryFn: () => api('/clientes?subclientes=1'),
  })

  const { data: clienteInfinityData } = useQuery<{ clienteId: number | null }>({
    queryKey: ['ordens-servico', 'cliente-infinity'],
    queryFn: () => api('/ordens-servico/cliente-infinity'),
  })
  const clienteInfinityId = clienteInfinityData?.clienteId ?? null

  const clienteSelecionado =
    ordemInstalacao === 'CLIENTE'
      ? clientes.find((c) => c.id === clienteOrdemId)
      : clienteInfinityId != null
        ? clientes.find((c) => c.id === clienteInfinityId)
        : null
  const subclientes = clienteSelecionado?.subclientes ?? []

  const { data: tecnicos = [] } = useQuery<Tecnico[]>({
    queryKey: ['tecnicos'],
    queryFn: () => api('/tecnicos'),
  })

  const { data: aparelhosRaw = [] } = useQuery<
    { id: number; identificador?: string | null; tipo: string; status: string }[]
  >({
    queryKey: ['aparelhos'],
    queryFn: () => api('/aparelhos'),
  })

  const rastreadoresInstalados = useMemo(() => {
    return aparelhosRaw.filter(
      (a) => a.tipo === 'RASTREADOR' && a.status === 'INSTALADO' && (a.identificador ?? '').trim()
    )
  }, [aparelhosRaw])

  const tecnicoId = form.watch('tecnicoId')
  const tecnicoSelecionado = tecnicos.find((t) => t.id === tecnicoId)

  const [consultaPlacaLoading, setConsultaPlacaLoading] = useState(false)
  const ultimaPlacaConsultadaRef = useRef<string>('')

  const veiculoPlaca = form.watch('veiculoPlaca')
  useEffect(() => {
    const placa = placaApenasAlfanumericos(veiculoPlaca ?? '')
    if (placa.length === 7 && placa !== ultimaPlacaConsultadaRef.current) {
      ultimaPlacaConsultadaRef.current = placa
      setConsultaPlacaLoading(true)
      api<{ marca: string; modelo: string; ano: string; cor: string; tipo?: string }>(
        `/veiculos/consulta-placa/${encodeURIComponent(placa)}`
      )
        .then((dados) => {
          if (dados) {
            form.setValue('veiculoMarca', dados.marca ?? '')
            form.setValue('veiculoModelo', dados.modelo ?? '')
            form.setValue('veiculoAno', dados.ano ?? '')
            form.setValue('veiculoCor', dados.cor ?? '')
            form.setValue('veiculoTipo', dados.tipo ?? '')
            toast.success('Dados do veículo consultados')
          } else {
            toast.error('Placa não encontrada')
          }
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao consultar placa'))
        .finally(() => setConsultaPlacaLoading(false))
    } else if (placa.length < 7) {
      ultimaPlacaConsultadaRef.current = ''
    }
  }, [veiculoPlaca, form])

  const subclienteEstado = form.watch('subclienteEstado')
  const { data: ufs = [] } = useUFs()
  const { data: municipios = [] } = useMunicipios(subclienteEstado || null)

  const handleSubclienteAddressFound = useCallback(
    (endereco: EnderecoCEP) => {
      form.setValue('subclienteLogradouro', endereco.logradouro)
      form.setValue('subclienteBairro', endereco.bairro)
      form.setValue('subclienteComplemento', endereco.complemento)
      form.setValue('subclienteCidade', endereco.localidade)
      form.setValue('subclienteEstado', endereco.uf)
    },
    [form]
  )

  const createMutation = useMutation({
    mutationFn: async (payload: {
      tipo: string
      clienteId: number
      subclienteId?: number
      subclienteCreate?: {
        nome: string
        cep: string
        cidade: string
        estado: string
        cpf?: string
        email?: string
        telefone?: string
        cobrancaTipo?: string
      }
      tecnicoId?: number
      veiculoId?: number
      observacoes?: string
    }) => {
      const res = await api<{ id: number; numero: number }>('/ordens-servico', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return res
    },
    onSuccess: (data: { id: number; numero: number }) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      toast.success(`Ordem de serviço #${data.numero} criada`)
      navigate('/')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar OS'),
  })

  const showDetalhesRevisaoRetirada =
    tipo === 'REVISAO' || tipo === 'RETIRADA'

  const handleSubmit = (data: FormData) => {
    if (!canCreate) return

    const partesObs: string[] = []
    if (data.observacoes) partesObs.push(data.observacoes)
    if (data.veiculoPlaca?.trim()) {
      const veiculoInfo = [data.veiculoPlaca, data.veiculoTipo, data.veiculoMarca, data.veiculoModelo, data.veiculoAno, data.veiculoCor]
        .filter(Boolean)
        .join(' | ')
      if (veiculoInfo) partesObs.push(`Veículo: ${veiculoInfo}`)
    }
    if (data.ordemInstalacao === 'CLIENTE' && data.clienteOrdemId) {
      const c = clientes.find((x) => x.id === data.clienteOrdemId)
      if (c) partesObs.push(`Ordem Instalação Cliente: ${c.nome} (ID: ${c.id})`)
    }
    if (data.ordemInstalacao === 'INFINITY' && clienteInfinityId) {
      const c = clientes.find((x) => x.id === clienteInfinityId)
      if (c) partesObs.push(`Ordem Instalação: ${c.nome} (Infinity)`)
    }
    if (showDetalhesRevisaoRetirada) {
      if (data.idAparelho) partesObs.push(`ID Aparelho: ${data.idAparelho}`)
      if (data.localInstalacao) partesObs.push(`Local: ${data.localInstalacao}`)
      if (data.posChave) partesObs.push(`Pós Chave: ${data.posChave}`)
    }
    const observacoes = partesObs.length > 0 ? partesObs.join('\n') : undefined

    const subclienteId =
      !data.isNovoSubcliente && data.subclienteId && data.subclienteId > 0
        ? data.subclienteId
        : undefined

    const subclienteCreate =
      data.isNovoSubcliente &&
      data.subclienteNome?.trim() &&
      data.subclienteCep?.trim() &&
      data.subclienteCidade?.trim() &&
      data.subclienteEstado?.trim() &&
      telefoneApenasDigitos(data.subclienteTelefone ?? '').length >= 10
        ? {
            nome: data.subclienteNome!.trim(),
            cep: data.subclienteCep!.trim(),
            cidade: data.subclienteCidade!.trim(),
            estado: data.subclienteEstado!.trim(),
            cpf: data.subclienteCpf?.trim() || undefined,
            email: data.subclienteEmail?.trim() || undefined,
            telefone: telefoneApenasDigitos(data.subclienteTelefone ?? ''),
            cobrancaTipo: data.subclienteCobranca || undefined,
          }
        : undefined

    if (data.ordemInstalacao === 'CLIENTE' && (!data.clienteOrdemId || data.clienteOrdemId <= 0)) {
      toast.error('Selecione o cliente para criar a ordem de serviço.')
      return
    }

    if (data.ordemInstalacao === 'INFINITY' && (!clienteInfinityId || clienteInfinityId <= 0)) {
      toast.error('Modo Infinity: não foi possível carregar o cliente do sistema. Tente novamente.')
      return
    }

    const clienteIdFinal =
      data.ordemInstalacao === 'INFINITY' ? clienteInfinityId! : data.clienteOrdemId!

    const runCreate = async () => {
      let veiculoId: number | undefined
      const placa = placaApenasAlfanumericos(data.veiculoPlaca ?? '')
      if (placa.length >= 7 && data.veiculoMarca?.trim() && data.veiculoModelo?.trim()) {
        try {
          const veiculo = await api<{ id: number }>('/veiculos/criar-ou-buscar', {
            method: 'POST',
            body: JSON.stringify({
              placa,
              marca: data.veiculoMarca.trim(),
              modelo: data.veiculoModelo.trim(),
              ano: data.veiculoAno?.trim() || undefined,
              cor: data.veiculoCor?.trim() || undefined,
            }),
          })
          veiculoId = veiculo?.id
        } catch {
          // continua sem veiculoId se falhar
        }
      }

      createMutation.mutate({
        tipo: data.tipo,
        clienteId: clienteIdFinal,
        subclienteId: subclienteCreate ? undefined : subclienteId,
        subclienteCreate,
        tecnicoId: data.tecnicoId && data.tecnicoId > 0 ? data.tecnicoId : undefined,
        veiculoId,
        observacoes,
      })
    }

    runCreate()
  }

  const watched = form.watch()
  const telefoneCompleto =
    (telefoneApenasDigitos(watched.subclienteTelefone ?? '').length >= 10)
  const temDadosSubcliente =
    !!(watched.subclienteNome ?? '').trim() &&
    !!(watched.subclienteCep ?? '').trim() &&
    !!(watched.subclienteLogradouro ?? '').trim() &&
    !!(watched.subclienteNumero ?? '').trim() &&
    !!(watched.subclienteBairro ?? '').trim() &&
    !!(watched.subclienteEstado ?? '').trim() &&
    !!(watched.subclienteCidade ?? '').trim() &&
    telefoneCompleto
  const temCliente =
    temDadosSubcliente &&
    (watched.ordemInstalacao === 'INFINITY'
      ? !!clienteInfinityId && clienteInfinityId > 0
      : watched.ordemInstalacao === 'CLIENTE' &&
        !!watched.clienteOrdemId &&
        watched.clienteOrdemId > 0)
  const temTecnico = !!watched.tecnicoId && watched.tecnicoId > 0
  const temVeiculo = !!(watched.veiculoPlaca ?? '').trim()
  const temTipo = !!watched.tipo

  const isFormValid = temCliente && temTipo

  return (
    <div className="-m-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <header className="sticky -top-4 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon name="assignment" className="text-blue-600 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Nova Ordem de Serviço</h1>
              <p className="text-xs text-slate-500">
                Criado por: {user?.nome ?? '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-[11px] font-bold uppercase"
            onClick={() => navigate('/')}
          >
            Cancelar
          </Button>
          <Button
            className="bg-erp-blue hover:bg-blue-700 text-white text-[11px] font-bold uppercase px-5 gap-2"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={!canCreate || !isFormValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MaterialIcon name="send" className="text-sm" />
            )}
            Emitir Ordem
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 pr-96">
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <form
            id="os-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Cliente / Associação */}
            <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                <MaterialIcon name="corporate_fare" className="text-slate-400 text-lg" />
                <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                  Cliente / Associação
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
                    Ordem de Instalação
                  </Label>
                  <div className="flex justify-center gap-4">
                    <Button
                      type="button"
                      variant={ordemInstalacao === 'INFINITY' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-9 text-[11px] font-bold uppercase',
                        ordemInstalacao === 'INFINITY' && 'bg-erp-blue hover:bg-blue-700'
                      )}
                      onClick={() => {
                        form.setValue('ordemInstalacao', 'INFINITY')
                        form.setValue('clienteOrdemId', undefined)
                        form.setValue('isNovoSubcliente', true)
                        form.setValue('subclienteId', undefined)
                      }}
                    >
                      Infinity
                    </Button>
                    <Button
                      type="button"
                      variant={ordemInstalacao === 'CLIENTE' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-9 text-[11px] font-bold uppercase',
                        ordemInstalacao === 'CLIENTE' && 'bg-erp-blue hover:bg-blue-700'
                      )}
                      onClick={() => {
                        form.setValue('ordemInstalacao', 'CLIENTE')
                        form.setValue('isNovoSubcliente', true)
                        form.setValue('subclienteId', undefined)
                      }}
                    >
                      Cliente
                    </Button>
                  </div>
                  {ordemInstalacao === 'CLIENTE' && (
                    <div className="mt-4">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Cliente
                      </Label>
                      <Controller
                        name="clienteOrdemId"
                        control={form.control}
                        render={({ field }) => (
                          <SelectClienteSearch
                            clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Digite para pesquisar cliente..."
                            className="h-9"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      Dados do Subcliente
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-6">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Nome do Subcliente
                      </Label>
                      <SubclienteNomeAutocomplete
                        subclientes={subclientes}
                        value={form.watch('subclienteNome') ?? ''}
                        subclienteId={form.watch('subclienteId')}
                        isNovoSubcliente={form.watch('isNovoSubcliente')}
                        onSelect={(s) => {
                          form.setValue('isNovoSubcliente', false)
                          form.setValue('subclienteId', s.id)
                          form.setValue('subclienteNome', s.nome)
                          form.setValue('subclienteCep', s.cep ?? '')
                          form.setValue('subclienteCidade', s.cidade ?? '')
                          form.setValue('subclienteEstado', s.estado ?? '')
                          form.setValue('subclienteCpf', s.cpf ?? '')
                          form.setValue('subclienteEmail', s.email ?? '')
                          form.setValue('subclienteTelefone', s.telefone ?? '')
                          form.setValue('subclienteCobranca', (s.cobrancaTipo as 'INFINITY' | 'CLIENTE') ?? 'INFINITY')
                        }}
                        onSelectNovo={() => {
                          form.setValue('isNovoSubcliente', true)
                          form.setValue('subclienteId', undefined)
                          form.setValue('subclienteNome', '')
                          form.setValue('subclienteCep', '')
                          form.setValue('subclienteLogradouro', '')
                          form.setValue('subclienteNumero', '')
                          form.setValue('subclienteComplemento', '')
                          form.setValue('subclienteBairro', '')
                          form.setValue('subclienteCidade', '')
                          form.setValue('subclienteEstado', '')
                          form.setValue('subclienteCpf', '')
                          form.setValue('subclienteEmail', '')
                          form.setValue('subclienteTelefone', '')
                        }}
                        onChange={(nome) => {
                          form.setValue('subclienteNome', nome)
                          if (form.watch('subclienteId')) {
                            form.setValue('subclienteId', undefined)
                            form.setValue('isNovoSubcliente', true)
                          }
                        }}
                        placeholder="Digite para buscar ou criar novo..."
                      />
                    </div>

                    <div className="col-span-6">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        CEP
                      </Label>
                      <Controller
                        name="subclienteCep"
                        control={form.control}
                        render={({ field }) => (
                          <InputCEP
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            onAddressFound={handleSubclienteAddressFound}
                            placeholder="00000-000"
                            className="h-9"
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Logradouro
                      </Label>
                      <Input
                        {...form.register('subclienteLogradouro')}
                        placeholder="Rua, Av., etc."
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Nº
                      </Label>
                      <Input
                        {...form.register('subclienteNumero')}
                        placeholder="Nº"
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Compl.
                      </Label>
                      <Input
                        {...form.register('subclienteComplemento')}
                        placeholder="Sala, etc."
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Bairro
                      </Label>
                      <Input
                        {...form.register('subclienteBairro')}
                        placeholder="Bairro"
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Estado
                      </Label>
                      <Controller
                        name="subclienteEstado"
                        control={form.control}
                        render={({ field }) => (
                          <SelectUF
                            ufs={ufs}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="UF"
                            className="h-9"
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Cidade
                      </Label>
                      <Controller
                        name="subclienteCidade"
                        control={form.control}
                        render={({ field }) => (
                          <SelectCidade
                            municipios={municipios}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="Cidade"
                            className="h-9"
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        CPF/CNPJ (opcional)
                      </Label>
                      <Controller
                        name="subclienteCpf"
                        control={form.control}
                        render={({ field }) => (
                          <InputCPFCNPJ
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            className="h-9"
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        E-mail (opcional)
                      </Label>
                      <Input
                        {...form.register('subclienteEmail')}
                        type="email"
                        placeholder="email@exemplo.com"
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Telefone
                      </Label>
                      <Controller
                        name="subclienteTelefone"
                        control={form.control}
                        render={({ field }) => (
                          <InputTelefone
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            className="h-9"
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-6">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
                        Cobrança
                      </Label>
                      <Controller
                        name="subclienteCobranca"
                        control={form.control}
                        render={({ field }) => (
                          <div className="flex justify-center gap-4">
                            {cobrancaOptions.map((opt) => (
                              <Button
                                key={opt.value}
                                type="button"
                                variant={field.value === opt.value ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                  'h-9 text-[11px] font-bold uppercase',
                                  field.value === opt.value && 'bg-erp-blue hover:bg-blue-700'
                                )}
                                onClick={() => field.onChange(opt.value)}
                              >
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Técnico */}
            <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                <MaterialIcon name="engineering" className="text-slate-400 text-lg" />
                <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                  Técnico Responsável
                </h2>
              </div>
              <div className="p-4">
                <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
                  Selecionar Técnico
                </Label>
                <Controller
                  name="tecnicoId"
                  control={form.control}
                  render={({ field }) => (
                    <SelectTecnicoSearch
                      tecnicos={tecnicos}
                      value={field.value}
                      onChange={field.onChange}
                      subclienteCidade={form.watch('subclienteCidade')}
                      subclienteEstado={form.watch('subclienteEstado')}
                      placeholder="Digite para pesquisar técnico (nome, cidade ou estado)..."
                    />
                  )}
                />
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { key: 'instalacaoComBloqueio', label: 'Instalação c/ bloqueio' },
                    { key: 'instalacaoSemBloqueio', label: 'Instalação s/ bloqueio' },
                    { key: 'revisao', label: 'Revisão' },
                    { key: 'retirada', label: 'Retirada' },
                    { key: 'deslocamento', label: 'Deslocamento' },
                  ].map(({ key, label }) => {
                    const valor = tecnicoSelecionado?.precos?.[key as keyof PrecoTecnico]
                    const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor ?? 0)
                    const temValor = !Number.isNaN(num) && num > 0
                    return (
                      <div
                        key={key}
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <p className="text-[9px] font-bold uppercase text-slate-500">{label}</p>
                        <p className="text-sm font-bold text-slate-800">
                          {temValor ? num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Veículo */}
            <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                <MaterialIcon name="local_shipping" className="text-slate-400 text-lg" />
                <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                  Veículo
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-2 relative">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                      Placa
                    </Label>
                    <Controller
                      name="veiculoPlaca"
                      control={form.control}
                      render={({ field }) => (
                        <InputPlaca
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="ABC-1D23"
                        />
                      )}
                    />
                    {consultaPlacaLoading && (
                      <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-slate-400" />
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                      Marca
                    </Label>
                    <Input
                      {...form.register('veiculoMarca')}
                      placeholder="Marca"
                      className="h-9"
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                      Modelo
                    </Label>
                    <Input
                      {...form.register('veiculoModelo')}
                      placeholder="Modelo"
                      className="h-9"
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                      Ano
                    </Label>
                    <Input
                      {...form.register('veiculoAno')}
                      placeholder="Ano"
                      className="h-9"
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                      Cor
                    </Label>
                    <Input
                      {...form.register('veiculoCor')}
                      placeholder="Cor"
                      className="h-9"
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                      Tipo
                    </Label>
                    <Controller
                      name="veiculoTipo"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={(v) => field.onChange(v || '')}
                        >
                          <SelectTrigger className="h-9 flex items-center gap-2">
                            {field.value && (
                              <MaterialIcon
                                name={veiculoTipoIconMap[field.value.toUpperCase()] ?? 'directions_car'}
                                className="text-slate-500 text-lg shrink-0"
                              />
                            )}
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {VEICULO_TIPOS.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Tipo de Serviço */}
            <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                <MaterialIcon name="build" className="text-slate-400 text-lg" />
                <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                  Detalhes do Serviço
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
                    Tipo de Serviço
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['INSTALACAO', 'REVISAO', 'RETIRADA'] as const).map((cat) => {
                      const isActive =
                        cat === 'INSTALACAO'
                          ? tipo?.startsWith('INSTALACAO_')
                          : tipo === cat
                      return (
                        <Button
                          key={cat}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          size="lg"
                          className={cn(
                            'h-14 w-full text-sm font-bold uppercase gap-2',
                            isActive && 'bg-erp-blue hover:bg-blue-700'
                          )}
                          onClick={() => {
                            if (cat === 'INSTALACAO') {
                              form.setValue('tipo', 'INSTALACAO_COM_BLOQUEIO')
                            } else {
                              form.setValue('tipo', cat)
                            }
                          }}
                        >
                          <MaterialIcon name={tipoServicoConfig[cat].icon} className="text-xl" />
                          {tipoServicoConfig[cat].label}
                        </Button>
                      )
                    })}
                  </div>
                  {tipo?.startsWith('INSTALACAO_') && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={tipo === 'INSTALACAO_COM_BLOQUEIO' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-9 w-full text-[11px] font-bold uppercase',
                          tipo === 'INSTALACAO_COM_BLOQUEIO' && 'bg-erp-blue hover:bg-blue-700'
                        )}
                        onClick={() => form.setValue('tipo', 'INSTALACAO_COM_BLOQUEIO')}
                      >
                        Com bloqueio
                      </Button>
                      <Button
                        type="button"
                        variant={tipo === 'INSTALACAO_SEM_BLOQUEIO' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-9 w-full text-[11px] font-bold uppercase',
                          tipo === 'INSTALACAO_SEM_BLOQUEIO' && 'bg-erp-blue hover:bg-blue-700'
                        )}
                        onClick={() => form.setValue('tipo', 'INSTALACAO_SEM_BLOQUEIO')}
                      >
                        Sem bloqueio
                      </Button>
                    </div>
                  )}
                  {form.formState.errors.tipo && (
                    <p className="text-xs text-destructive mt-1">
                      {form.formState.errors.tipo.message}
                    </p>
                  )}
                </div>

                {showDetalhesRevisaoRetirada && (
                  <div className="grid grid-cols-12 gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded">
                    <div className="col-span-4">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        ID Instalado
                      </Label>
                      <IdAparelhoSearch
                        rastreadores={rastreadoresInstalados}
                        value={form.watch('idAparelho') ?? ''}
                        onChange={(v) => form.setValue('idAparelho', v)}
                        placeholder="Buscar ou digitar ID..."
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Local de Instalação
                      </Label>
                      <Input
                        {...form.register('localInstalacao')}
                        placeholder="Ex: PAINEL FRONTAL"
                        className="h-9"
                        autoComplete="off"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Pós Chave
                      </Label>
                      <Controller
                        name="posChave"
                        control={form.control}
                        render={({ field }) => {
                          const isSim = field.value === 'SIM'
                          return (
                            <Button
                              type="button"
                              variant={isSim ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'h-9 w-full text-[11px] font-bold uppercase',
                                isSim && 'bg-erp-blue hover:bg-blue-700'
                              )}
                              onClick={() => field.onChange(isSim ? 'NAO' : 'SIM')}
                            >
                              {isSim ? 'Sim' : 'Não'}
                            </Button>
                          )
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Observações */}
            <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                <MaterialIcon name="chat_bubble" className="text-slate-400 text-lg" />
                <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
                  Observações Internas
                </h2>
              </div>
              <div className="p-4">
                <textarea
                  {...form.register('observacoes')}
                  className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Detalhes técnicos adicionais para o serviço em campo..."
                  autoComplete="off"
                />
              </div>
            </section>
          </form>
        </div>

        {/* Sidebar Resumo - fixed, começa logo abaixo do header */}
        <aside className="fixed top-20 right-0 z-10 h-[calc(100vh-5rem)] w-96 bg-white border-l border-slate-300 flex flex-col overflow-hidden shadow-lg">
          <div className="p-5 border-b border-slate-200 shrink-0">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-4 font-condensed uppercase">
              <MaterialIcon name="analytics" className="text-erp-blue" />
              Resumo da Ordem
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  Cliente Selecionado
                </span>
                <p className="text-xs font-black text-slate-800 truncate">
                  {ordemInstalacao === 'INFINITY'
                    ? 'Infinity'
                    : ordemInstalacao === 'CLIENTE' && clienteSelecionado
                      ? clienteSelecionado.nome
                      : '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  Técnico Atribuído
                </span>
                <p className="text-xs font-black text-slate-800 uppercase">
                  {tecnicoSelecionado?.nome ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  Veículo
                </span>
                <p className="text-xs font-black text-slate-800 uppercase">
                  {watched.veiculoPlaca
                    ? [watched.veiculoPlaca, watched.veiculoMarca, watched.veiculoModelo]
                        .filter(Boolean)
                        .join(' • ') || '—'
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                  Tipo de Serviço
                </span>
                <p className="text-xs font-black text-erp-blue uppercase">
                  {tipo ? tipoLabels[tipo] ?? tipo : '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 flex-1 min-h-0 overflow-y-auto">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-4 font-condensed uppercase">
              <MaterialIcon name="fact_check" className="text-slate-400" />
              Checklist de Validação
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Dados do Cliente', ok: temCliente },
                { label: 'Técnico Selecionado', ok: temTecnico },
                { label: 'Dados do Veículo', ok: temVeiculo },
                { label: 'Tipo de Serviço', ok: temTipo },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">{label}</span>
                  <MaterialIcon
                    name={ok ? 'check_circle' : 'radio_button_unchecked'}
                    className={cn('text-lg', ok ? 'text-erp-green' : 'text-slate-300')}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 border-t border-slate-200 shrink-0 space-y-2">
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                Valor aproximado
              </span>
              <p className="text-2xl font-black text-slate-800">
                {(() => {
                  const key = tipo && tipoToPrecoKey[tipo]
                  const valor = key ? tecnicoSelecionado?.precos?.[key] : null
                  const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor ?? 0)
                  return !Number.isNaN(num) && num > 0
                    ? num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'
                })()}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase block mb-1">
                Deslocamento
              </span>
              <p className="text-base font-bold text-slate-600">
                +{' '}
                {(() => {
                  const valor = tecnicoSelecionado?.precos?.deslocamento
                  const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor ?? 0)
                  return !Number.isNaN(num) && num > 0
                    ? num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' por KM'
                    : '—'
                })()}
              </p>
            </div>
          </div>
          <div className="p-5 bg-slate-50 border-t border-slate-200 shrink-0">
            <Button
              className="w-full bg-erp-blue hover:bg-blue-700 text-white py-3 text-xs font-black uppercase gap-2"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={!canCreate || !isFormValid || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MaterialIcon name="send" className="text-sm" />
              )}
              Emitir Ordem
            </Button>
            <p className="text-[9px] text-slate-500 text-center mt-3 font-bold uppercase">
              {isFormValid ? 'Pronto para emitir' : 'Preencha os campos obrigatórios'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
