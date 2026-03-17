import { useMemo, useState } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Loader2,
  Search,
  ArrowLeft,
  X,
  CheckCircle,
  AlertTriangle,
  Copy,
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
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type StatusAparelho = 'NOVO_OK' | 'EM_MANUTENCAO' | 'CANCELADO_DEFEITO'
type OrigemItem = 'RETIRADA_CLIENTE' | 'DEVOLUCAO_TECNICO' | 'COMPRA_AVULSA'
type CategoriaFalha = 'FALHA_COMUNICACAO' | 'PROBLEMA_ALIMENTACAO' | 'DANO_FISICO' | 'CURTO_CIRCUITO' | 'OUTRO'
type DestinoDefeito = 'SUCATA' | 'GARANTIA' | 'LABORATORIO'

interface Tecnico {
  id: number
  nome: string
}

interface Marca {
  id: number
  nome: string
  ativo: boolean
}

interface Modelo {
  id: number
  nome: string
  ativo: boolean
  marca: { id: number; nome: string }
  minCaracteresImei?: number | null
}

interface Operadora {
  id: number
  nome: string
  ativo: boolean
}

interface ExistingId {
  identificador: string
  lote?: { referencia: string } | null
}

const ORIGENS: { value: OrigemItem; label: string }[] = [
  { value: 'RETIRADA_CLIENTE', label: 'Retirada de Cliente' },
  { value: 'DEVOLUCAO_TECNICO', label: 'Devolução de Técnico' },
  { value: 'COMPRA_AVULSA', label: 'Compra Avulsa' },
]

const CATEGORIAS_FALHA: { value: CategoriaFalha; label: string }[] = [
  { value: 'FALHA_COMUNICACAO', label: 'Falha de Comunicação (GPRS)' },
  { value: 'PROBLEMA_ALIMENTACAO', label: 'Problema de Alimentação' },
  { value: 'DANO_FISICO', label: 'Dano Físico / Carcaça' },
  { value: 'CURTO_CIRCUITO', label: 'Curto-circuito Interno' },
  { value: 'OUTRO', label: 'Outro' },
]

const DESTINOS_DEFEITO: { value: DestinoDefeito; label: string }[] = [
  { value: 'SUCATA', label: 'Sucata / Descarte' },
  { value: 'GARANTIA', label: 'Envio para Garantia' },
  { value: 'LABORATORIO', label: 'Laboratório Interno' },
]

const STATUS_CONFIG: Record<
  StatusAparelho,
  { label: string; icon: string; color: string; bgColor: string; borderColor: string }
> = {
  NOVO_OK: {
    label: 'Novo / OK',
    icon: 'check_circle',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
  },
  EM_MANUTENCAO: {
    label: 'Em Manutenção',
    icon: 'build',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  CANCELADO_DEFEITO: {
    label: 'Cancelado / Defeito',
    icon: 'cancel',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
  },
}

const schema = z
  .object({
    identificador: z.preprocess((v) => v ?? '', z.string().refine((s) => s.length >= 1, 'Identificador obrigatório')),
    tipo: z.enum(['RASTREADOR', 'SIM']),
    marca: z.preprocess((v) => v ?? '', z.string()),
    modelo: z.preprocess((v) => v ?? '', z.string()),
    operadora: z.preprocess((v) => v ?? '', z.string()),
    marcaSimcardId: z.preprocess((v) => v ?? '', z.string().optional()),
    planoSimcardId: z.preprocess((v) => v ?? '', z.string().optional()),
    origem: z.enum(['RETIRADA_CLIENTE', 'DEVOLUCAO_TECNICO', 'COMPRA_AVULSA']),
    responsavelEntrega: z.preprocess((v) => v ?? '', z.string().optional()),
    tecnicoId: z.number().nullable(),
    observacoes: z.preprocess((v) => v ?? '', z.string().optional()),
    status: z.enum(['NOVO_OK', 'EM_MANUTENCAO', 'CANCELADO_DEFEITO']),
    categoriaFalha: z.enum(['FALHA_COMUNICACAO', 'PROBLEMA_ALIMENTACAO', 'DANO_FISICO', 'CURTO_CIRCUITO', 'OUTRO']),
    destinoDefeito: z.enum(['SUCATA', 'GARANTIA', 'LABORATORIO']),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'RASTREADOR') {
      if (!data.marca) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Marca obrigatória', path: ['marca'] })
      if (!data.modelo) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Modelo obrigatório', path: ['modelo'] })
    }
    if (data.tipo === 'SIM' && !data.operadora) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Operadora obrigatória', path: ['operadora'] })
    }
    if (data.origem === 'DEVOLUCAO_TECNICO') {
      if (!data.tecnicoId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione o técnico', path: ['tecnicoId'] })
    } else {
      if (!data.responsavelEntrega?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Responsável obrigatório', path: ['responsavelEntrega'] })
      }
    }
  })

type FormData = z.infer<typeof schema>

const defaultValues: FormData = {
  identificador: '',
  tipo: 'RASTREADOR',
  marca: '',
  modelo: '',
  operadora: '',
  marcaSimcardId: '',
  planoSimcardId: '',
  origem: 'DEVOLUCAO_TECNICO',
  responsavelEntrega: '',
  tecnicoId: null,
  observacoes: '',
  status: 'NOVO_OK',
  categoriaFalha: 'FALHA_COMUNICACAO',
  destinoDefeito: 'LABORATORIO',
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function CadastroIndividualPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('CONFIGURACAO.APARELHO.CRIAR')

  const [quantidadeCadastrada, setQuantidadeCadastrada] = useState(0)
  const [buscaResponsavel, setBuscaResponsavel] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues,
  })

  const watchTipo = form.watch('tipo')
  const watchMarca = form.watch('marca')
  const watchOperadora = form.watch('operadora')
  const watchOrigem = form.watch('origem')
  const watchTecnicoId = form.watch('tecnicoId')
  const watchStatus = form.watch('status')
  const watchIdentificador = form.watch('identificador')

  const { data: tecnicos = [] } = useQuery<Tecnico[]>({
    queryKey: ['tecnicos-lista'],
    queryFn: () => api('/tecnicos'),
    enabled: watchOrigem === 'DEVOLUCAO_TECNICO',
  })

  const { data: marcas = [] } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: () => api('/equipamentos/marcas'),
  })

  const { data: modelos = [] } = useQuery<Modelo[]>({
    queryKey: ['modelos'],
    queryFn: () => api('/equipamentos/modelos'),
  })

  const { data: operadoras = [] } = useQuery<Operadora[]>({
    queryKey: ['operadoras'],
    queryFn: () => api('/equipamentos/operadoras'),
  })

  const operadoraIdParaMarca = useMemo(
    () => operadoras.find((o) => o.nome === watchOperadora)?.id ?? null,
    [operadoras, watchOperadora]
  )

  const { data: marcasSimcard = [] } = useQuery<
    {
      id: number
      nome: string
      operadoraId: number
      temPlanos: boolean
      minCaracteresIccid?: number | null
      operadora: { id: number; nome: string }
      planos?: { id: number; planoMb: number; ativo: boolean }[]
    }[]
  >({
    queryKey: ['marcas-simcard', operadoraIdParaMarca ?? 'all'],
    queryFn: () =>
      operadoraIdParaMarca
        ? api(`/equipamentos/marcas-simcard?operadoraId=${operadoraIdParaMarca}`)
        : api('/equipamentos/marcas-simcard'),
    enabled: watchTipo === 'SIM',
  })

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas])
  const operadorasAtivas = useMemo(() => operadoras.filter((o) => o.ativo), [operadoras])

  const modelosDisponiveis = useMemo(() => {
    if (!watchMarca) return []
    const marcaEncontrada = marcasAtivas.find((m) => m.nome === watchMarca)
    if (!marcaEncontrada) return []
    return modelos.filter((m) => m.marca.id === marcaEncontrada.id && m.ativo)
  }, [watchMarca, marcasAtivas, modelos])

  const { data: aparelhosExistentes = [] } = useQuery<ExistingId[]>({
    queryKey: ['aparelhos-ids'],
    queryFn: () => api('/aparelhos'),
    select: (data) =>
      (data as { identificador?: string; lote?: { referencia: string } | null }[])
        .filter((a) => a.identificador)
        .map((a) => ({ identificador: a.identificador!, lote: a.lote })),
  })

  const idJaExiste = useMemo(() => {
    if (!watchIdentificador.trim()) return null
    const cleanId = watchIdentificador.replace(/\D/g, '')
    const found = aparelhosExistentes.find((a) => a.identificador === cleanId)
    return found || null
  }, [watchIdentificador, aparelhosExistentes])

  const tecnicosFiltrados = useMemo(() => {
    if (!buscaResponsavel.trim()) return tecnicos.slice(0, 10)
    return tecnicos.filter((t) => t.nome.toLowerCase().includes(buscaResponsavel.toLowerCase())).slice(0, 10)
  }, [tecnicos, buscaResponsavel])

  const tecnicoSelecionado = useMemo(
    () => tecnicos.find((t) => t.id === watchTecnicoId),
    [tecnicos, watchTecnicoId]
  )

  const marcasSimcardFiltradas = useMemo(
    () => marcasSimcard.filter((m) => !operadoraIdParaMarca || m.operadoraId === operadoraIdParaMarca),
    [marcasSimcard, operadoraIdParaMarca]
  )

  const watchMarcaSimcardId = form.watch('marcaSimcardId')

  const minCaracteresId = useMemo(() => {
    if (watchTipo === 'RASTREADOR') {
      const modeloSelecionado = modelosDisponiveis.find((m) => m.nome === form.getValues('modelo'))
      return modeloSelecionado?.minCaracteresImei ?? null
    } else {
      const marcaSim = marcasSimcard.find((m) => m.id === Number(watchMarcaSimcardId))
      return marcaSim?.minCaracteresIccid ?? null
    }
  }, [watchTipo, watchMarcaSimcardId, modelosDisponiveis, marcasSimcard, form])

  const idValido = useMemo(() => {
    if (!watchIdentificador.trim()) return false
    const cleanId = watchIdentificador.replace(/\D/g, '')
    if (cleanId.length < 1) return false
    if (minCaracteresId !== null && cleanId.length < minCaracteresId) return false
    return true
  }, [watchIdentificador, minCaracteresId])

  const watchModelo = form.watch('modelo')
  const watchResponsavel = form.watch('responsavelEntrega')
  const podeSalvar = useMemo(() => {
    if (!watchIdentificador.trim() || !idValido) return false
    if (watchTipo === 'RASTREADOR' && (!watchMarca || !watchModelo)) return false
    if (watchTipo === 'SIM' && !watchOperadora) return false
    if (watchOrigem === 'DEVOLUCAO_TECNICO' && !watchTecnicoId) return false
    if (watchOrigem !== 'DEVOLUCAO_TECNICO' && !watchResponsavel?.trim()) return false
    return true
  }, [watchIdentificador, idValido, watchTipo, watchMarca, watchModelo, watchOperadora, watchOrigem, watchTecnicoId, watchResponsavel])

  const limparFormulario = (manterConfiguracao: boolean = false) => {
    form.reset(manterConfiguracao ? { ...form.getValues(), identificador: '' } : defaultValues)
  }

  const createAparelhoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const cleanId = data.identificador.replace(/\D/g, '')
      const tecnicoSel = tecnicos.find((t) => t.id === data.tecnicoId)
      const payload = {
        identificador: cleanId,
        tipo: data.tipo,
        marca: data.tipo === 'RASTREADOR' ? data.marca : null,
        modelo: data.tipo === 'RASTREADOR' ? data.modelo : null,
        operadora: data.tipo === 'SIM' ? data.operadora : null,
        marcaSimcardId: data.tipo === 'SIM' && data.marcaSimcardId ? Number(data.marcaSimcardId) : undefined,
        planoSimcardId: data.tipo === 'SIM' && data.planoSimcardId ? Number(data.planoSimcardId) : undefined,
        origem: data.origem,
        responsavelEntrega:
          data.origem === 'DEVOLUCAO_TECNICO' ? tecnicoSel?.nome : data.responsavelEntrega,
        tecnicoId: data.origem === 'DEVOLUCAO_TECNICO' ? data.tecnicoId : null,
        observacoes: data.observacoes || null,
        statusEntrada: data.status,
        categoriaFalha: data.status === 'CANCELADO_DEFEITO' ? data.categoriaFalha : null,
        destinoDefeito: data.status === 'CANCELADO_DEFEITO' ? data.destinoDefeito : null,
      }
      return api('/aparelhos/individual', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aparelhos'] })
      queryClient.invalidateQueries({ queryKey: ['aparelhos-ids'] })
      setQuantidadeCadastrada((prev) => prev + 1)
      toast.success('Equipamento cadastrado com sucesso!')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar equipamento')
    },
  })

  const handleCadastrarEFinalizar = () => {
    form.handleSubmit(
      (data) => {
        createAparelhoMutation.mutate(data, { onSuccess: () => navigate('/aparelhos') })
      },
      (errors) => {
        const firstError = Object.values(errors)[0]?.message
        toast.error(firstError ?? 'Verifique os campos do formulário')
      }
    )()
  }

  const handleCadastrarOutro = () => {
    form.handleSubmit(
      (data) => {
        createAparelhoMutation.mutate(data, {
          onSuccess: () => limparFormulario(true),
        })
      },
      (errors) => {
        const firstError = Object.values(errors)[0]?.message
        toast.error(firstError ?? 'Verifique os campos do formulário')
      }
    )()
  }

  const statusRevisao = useMemo(() => {
    if (idJaExiste) return 'DUPLICADO'
    if (!idValido && watchIdentificador.trim()) return 'ID_INVALIDO'
    if (!podeSalvar) return 'INCOMPLETO'
    return 'OK'
  }, [idJaExiste, idValido, watchIdentificador, podeSalvar])

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <header className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/aparelhos"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon name="qr_code_scanner" className="text-erp-blue text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Cadastro Manual de Rastreador/Simcard</h1>
              <p className="text-xs text-slate-500">Entrada individual de equipamentos</p>
            </div>
          </div>
        </div>
        {quantidadeCadastrada > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-800">
              {quantidadeCadastrada} equipamento{quantidadeCadastrada > 1 ? 's' : ''} cadastrado
              {quantidadeCadastrada > 1 ? 's' : ''} nesta sessão
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex gap-6 p-6">
          <div className="flex-1 space-y-6">
            {/* Bloco 1 - Identificação Técnica */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
                <MaterialIcon name="qr_code_scanner" className="text-erp-blue" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Identificação Técnica
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    {watchTipo === 'RASTREADOR' ? 'IMEI' : 'ICCID'} / Número de Série{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="identificador"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Digite o identificador único..."
                          className={cn(
                            'h-9 pr-10 font-mono',
                            idJaExiste && 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500',
                            !idJaExiste &&
                              idValido &&
                              watchIdentificador.trim() &&
                              'border-emerald-500 bg-emerald-50 focus:ring-emerald-500 focus:border-emerald-500'
                          )}
                        />
                        {idJaExiste && <MaterialIcon name="error" className="absolute right-3 top-2.5 text-red-500" />}
                        {!idJaExiste && idValido && watchIdentificador.trim() && (
                          <MaterialIcon name="check_circle" className="absolute right-3 top-2.5 text-emerald-500" />
                        )}
                      </div>
                    )}
                  />
                  {idJaExiste && (
                    <p className="text-[10px] text-red-600 mt-1 font-bold uppercase">
                      Atenção: Este {watchTipo === 'RASTREADOR' ? 'IMEI' : 'ICCID'} já consta no sistema
                      {idJaExiste.lote && ` (Vinculado ao Lote ${idJaExiste.lote.referencia})`}
                    </p>
                  )}
                  {!idJaExiste && !idValido && watchIdentificador.trim() && (
                    <p className="text-[10px] text-amber-600 mt-1 font-bold uppercase">
                      O {watchTipo === 'RASTREADOR' ? 'IMEI deve ter 15 dígitos' : 'ICCID deve ter 19-20 dígitos'}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Tipo de Equipamento
                  </Label>
                  <Controller
                    name="tipo"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v)
                          if (v === 'SIM') {
                            form.setValue('marca', '')
                            form.setValue('modelo', '')
                          } else {
                            form.setValue('operadora', '')
                            form.setValue('marcaSimcardId', '')
                            form.setValue('planoSimcardId', '')
                          }
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RASTREADOR">Rastreador</SelectItem>
                          <SelectItem value="SIM">Simcard</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {watchTipo === 'RASTREADOR' ? (
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                      Marca e Modelo <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Controller
                        name="marca"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v)
                              form.setValue('modelo', '')
                            }}
                          >
                            <SelectTrigger className={cn('h-9', fieldState.error && 'border-red-500')}>
                              <SelectValue placeholder="Marca..." />
                            </SelectTrigger>
                            <SelectContent>
                              {marcasAtivas.map((m) => (
                                <SelectItem key={m.id} value={m.nome}>
                                  {m.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Controller
                        name="modelo"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={!watchMarca}>
                            <SelectTrigger className={cn('h-9', fieldState.error && 'border-red-500')}>
                              <SelectValue placeholder={watchMarca ? 'Modelo...' : 'Selecione marca'} />
                            </SelectTrigger>
                            <SelectContent>
                              {modelosDisponiveis.map((m) => (
                                <SelectItem key={m.id} value={m.nome}>
                                  {m.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Operadora <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="operadora"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v)
                              form.setValue('marcaSimcardId', '')
                              form.setValue('planoSimcardId', '')
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {operadorasAtivas.map((o) => (
                                <SelectItem key={o.id} value={o.nome}>
                                  {o.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Marca do Simcard
                      </Label>
                      <Controller
                        name="marcaSimcardId"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value ?? ''}
                            onValueChange={(v) => {
                              field.onChange(v)
                              form.setValue('planoSimcardId', '')
                            }}
                            disabled={!watchOperadora}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={watchOperadora ? 'Ex: Getrak, 1nce...' : 'Selecione operadora'} />
                            </SelectTrigger>
                            <SelectContent>
                              {marcasSimcardFiltradas.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  {m.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {form.watch('marcaSimcardId') &&
                      (() => {
                        const marcaSel = marcasSimcardFiltradas.find(
                          (m) => String(m.id) === form.watch('marcaSimcardId')
                        )
                        const planos = (marcaSel?.planos ?? []).filter((p) => p.ativo)
                        return marcaSel?.temPlanos && planos.length > 0 ? (
                          <div>
                            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                              Plano
                            </Label>
                            <Controller
                              name="planoSimcardId"
                              control={form.control}
                              render={({ field }) => (
                                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione o plano..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {planos.map((p) => (
                                      <SelectItem key={p.id} value={String(p.id)}>
                                        {p.planoMb} MB
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        ) : null
                      })()}
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2 - Origem e Rastreabilidade */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
                <MaterialIcon name="history_edu" className="text-erp-blue" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Origem e Rastreabilidade
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Origem do Item <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="origem"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORIGENS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Responsável pela Entrega <span className="text-red-500">*</span>
                  </Label>
                  {watchOrigem === 'DEVOLUCAO_TECNICO' ? (
                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          value={buscaResponsavel}
                          onChange={(e) => setBuscaResponsavel(e.target.value)}
                          placeholder="Buscar técnico..."
                          className="h-9 pl-10"
                        />
                      </div>
                      {tecnicosFiltrados.length > 0 && buscaResponsavel && !watchTecnicoId && (
                        <div className="mt-2 border border-slate-200 rounded-sm max-h-40 overflow-y-auto">
                          {tecnicosFiltrados.map((tecnico) => (
                            <button
                              key={tecnico.id}
                              type="button"
                              onClick={() => {
                                form.setValue('tecnicoId', tecnico.id)
                                setBuscaResponsavel('')
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                            >
                              <span className="font-medium">{tecnico.nome}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {watchTecnicoId && tecnicoSelecionado && (
                        <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-sm px-3 py-2">
                          <MaterialIcon name="engineering" className="text-erp-blue text-sm" />
                          <span className="text-sm font-medium text-blue-800">{tecnicoSelecionado.nome}</span>
                          <button
                            type="button"
                            onClick={() => form.setValue('tecnicoId', null)}
                            className="ml-auto text-erp-blue hover:text-blue-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {form.formState.errors.tecnicoId && (
                        <p className="text-[10px] text-red-600 mt-1">{form.formState.errors.tecnicoId.message}</p>
                      )}
                    </div>
                  ) : (
                    <Controller
                      name="responsavelEntrega"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <div className="relative">
                          <MaterialIcon name="person_search" className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            placeholder="Nome do responsável..."
                            className={cn('h-9 pl-10', fieldState.error && 'border-red-500')}
                          />
                          {fieldState.error && (
                            <p className="text-[10px] text-red-600 mt-1">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                  )}
                </div>

                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Observações de Recebimento
                  </Label>
                  <Controller
                    name="observacoes"
                    control={form.control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Detalhes adicionais sobre o estado físico ou motivo da entrada..."
                        className="w-full h-20 p-3 bg-slate-50 border border-slate-300 rounded-sm text-sm focus:bg-white focus:ring-2 focus:ring-erp-blue focus:border-erp-blue transition-all resize-none"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3 - Definição de Status */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
                <MaterialIcon name="settings_suggest" className="text-erp-blue" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Definição de Status
                </h3>
              </div>
              <div className="space-y-6">
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      {(Object.keys(STATUS_CONFIG) as StatusAparelho[]).map((s) => {
                        const config = STATUS_CONFIG[s]
                        const isSelected = field.value === s
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => field.onChange(s)}
                            className={cn(
                              'flex-1 py-3 px-2 border rounded-sm flex flex-col items-center gap-1 transition-all cursor-pointer',
                              isSelected
                                ? cn(config.borderColor, config.bgColor, 'ring-1', config.borderColor.replace('border-', 'ring-'))
                                : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-80'
                            )}
                          >
                            <MaterialIcon name={config.icon} className={config.color} />
                            <span
                              className={cn(
                                'text-[10px] font-bold uppercase',
                                isSelected ? config.color.replace('text-', 'text-').replace('600', '700') : 'text-slate-600'
                              )}
                            >
                              {config.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                />

                {watchStatus === 'CANCELADO_DEFEITO' && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-sm grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-red-800 uppercase mb-3 flex items-center gap-2">
                        <MaterialIcon name="report_problem" className="text-sm" />
                        Detalhamento de Defeito Requerido
                      </p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Categoria de Falha
                      </Label>
                      <Controller
                        name="categoriaFalha"
                        control={form.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9 border-red-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIAS_FALHA.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Destino Imediato
                      </Label>
                      <Controller
                        name="destinoDefeito"
                        control={form.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9 border-red-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DESTINOS_DEFEITO.map((d) => (
                                <SelectItem key={d.value} value={d.value}>
                                  {d.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-80 shrink-0">
            <div className="sticky top-24">
              <div className="bg-slate-800 text-white rounded-sm shadow-xl overflow-hidden border border-slate-700">
                <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Resumo da Entrada</h3>
                  {statusRevisao === 'DUPLICADO' && (
                    <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold">DUPLICADO</span>
                  )}
                  {statusRevisao === 'ID_INVALIDO' && (
                    <span className="bg-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold">ID INVÁLIDO</span>
                  )}
                  {statusRevisao === 'INCOMPLETO' && (
                    <span className="bg-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">INCOMPLETO</span>
                  )}
                  {statusRevisao === 'OK' && (
                    <span className="bg-emerald-500 text-[10px] px-2 py-0.5 rounded-full font-bold">PRONTO</span>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Equipamento
                    </label>
                    <p className="text-sm font-medium mt-1">
                      {watchTipo === 'RASTREADOR' ? '📡' : '📶'} {watchTipo === 'RASTREADOR' ? 'Rastreador' : 'Simcard'}{' '}
                      {watchTipo === 'RASTREADOR' && watchMarca && watchModelo && `${watchMarca} ${watchModelo}`}
                      {watchTipo === 'SIM' && watchOperadora}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Identificador
                      </label>
                      <p
                        className={cn(
                          'text-sm font-mono',
                          idJaExiste ? 'text-red-400' : watchIdentificador.trim() ? 'text-white' : 'text-slate-500'
                        )}
                      >
                        {watchIdentificador.trim() || '--- não definido ---'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Responsável Origem
                      </label>
                      <p className="text-sm font-medium">
                        {watchOrigem === 'DEVOLUCAO_TECNICO'
                          ? tecnicoSelecionado?.nome ?? '--- não definido ---'
                          : form.watch('responsavelEntrega')?.trim() || '--- não definido ---'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Status Definido
                      </label>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-tighter',
                          watchStatus === 'NOVO_OK' &&
                            'bg-emerald-600/20 text-emerald-400 border border-emerald-600/50',
                          watchStatus === 'EM_MANUTENCAO' && 'bg-erp-blue/20 text-blue-400 border border-erp-blue/50',
                          watchStatus === 'CANCELADO_DEFEITO' && 'bg-red-600/20 text-red-400 border border-red-600/50'
                        )}
                      >
                        {STATUS_CONFIG[watchStatus].label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Data Entrada
                      </label>
                      <span className="text-sm font-bold">{formatDate(new Date())}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-700/30 border-t border-slate-700">
                  <div className="flex items-start gap-3">
                    <MaterialIcon name="verified_user" className="text-blue-400 text-lg shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-300 uppercase">Trilha de Auditoria</p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Este registro será vinculado à sua conta e gerará um log de entrada individual para fins de
                        rastreabilidade patrimonial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {idJaExiste && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-800 font-medium">
                      O {watchTipo === 'RASTREADOR' ? 'IMEI' : 'ICCID'} informado já possui um registro ativo.
                      Registrar novamente criará um histórico de duplicidade.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 flex h-20 shrink-0 items-center justify-end gap-4 border-t border-slate-200 bg-white px-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => limparFormulario(false)}
          className="h-11 px-6 text-[11px] font-bold text-slate-500 uppercase"
        >
          Limpar Campos
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCadastrarOutro}
          disabled={!canCreate || !podeSalvar || createAparelhoMutation.isPending}
          className="h-11 px-6 text-[11px] font-bold uppercase gap-2 border-blue-200 text-erp-blue hover:bg-blue-50"
        >
          {createAparelhoMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Cadastrar Outro Equipamento
        </Button>
        <Button
          type="button"
          onClick={handleCadastrarEFinalizar}
          disabled={!canCreate || !podeSalvar || createAparelhoMutation.isPending}
          className="h-11 px-8 bg-erp-blue hover:bg-blue-700 text-white text-[11px] font-bold uppercase gap-2"
        >
          {createAparelhoMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cadastrando...
            </>
          ) : (
            <>
              <MaterialIcon name="save" className="text-lg" />
              Finalizar Cadastro
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
