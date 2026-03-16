import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { MaterialIcon } from '@/components/MaterialIcon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TesteBancada } from './TesteBancada'
import { TesteFilaSidebar } from './TesteFilaSidebar'
import { api } from '@/lib/api'
import {
  type ComunicacaoResult,
  type OsTeste,
  type RastreadorParaTeste,
} from './testes-types'

export function TestesPage() {
  const queryClient = useQueryClient()
  const [selectedOsId, setSelectedOsId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [imeiSearch, setImeiSearch] = useState('')
  const [comunicacaoResult, setComunicacaoResult] = useState<ComunicacaoResult | null>('AGUARDANDO')
  const [novoLocalInstalacao, setNovoLocalInstalacao] = useState('')
  const [posChave, setPosChave] = useState<'SIM' | 'NAO'>('NAO')
  const [observacoes, setObservacoes] = useState('')
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  const [showRetiradaModal, setShowRetiradaModal] = useState(false)
  const pendingLinkRef = useRef<{ osId: number; imei: string } | null>(null)

  const { data: listaTestando = [] } = useQuery<OsTeste[]>({
    queryKey: ['ordens-servico', 'testando', search],
    queryFn: () => api(`/ordens-servico/testando?${search ? `search=${encodeURIComponent(search)}` : ''}`),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const selectedOs = listaTestando.find((o) => o.id === selectedOsId) ?? null

  const { data: rastreadores = [] } = useQuery<RastreadorParaTeste[]>({
    queryKey: [
      'aparelhos',
      'para-testes',
      selectedOs?.clienteId,
      selectedOs?.tecnicoId ?? 'null',
      selectedOs?.id,
    ],
    queryFn: () => {
      if (!selectedOs) return []
      const params = new URLSearchParams({ clienteId: String(selectedOs.clienteId) })
      if (selectedOs.tecnicoId != null) params.set('tecnicoId', String(selectedOs.tecnicoId))
      if (selectedOs.id != null) params.set('ordemServicoId', String(selectedOs.id))
      return api(`/aparelhos/para-testes?${params}`)
    },
    enabled: !!selectedOs && selectedOs.tipo !== 'RETIRADA',
  })

  const aparelhoSelecionado = imeiSearch.trim()
    ? rastreadores.find(
        (r) => (r.identificador ?? '').toLowerCase() === imeiSearch.trim().toLowerCase()
      ) ?? null
    : null

  const updateStatusOsMutation = useMutation({
    mutationFn: ({
      id,
      status,
      observacao,
      localInstalacao,
      posChave,
    }: {
      id: number
      status: string
      observacao?: string
      localInstalacao?: string
      posChave?: 'SIM' | 'NAO'
    }) =>
      api(`/ordens-servico/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          observacao: observacao || undefined,
          localInstalacao: localInstalacao || undefined,
          posChave: posChave || undefined,
        }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      const msg =
        variables.status === 'AGENDADO'
          ? 'OS reagendada com sucesso'
          : variables.status === 'CANCELADO'
            ? 'OS cancelada com sucesso'
            : variables.status === 'AGUARDANDO_CADASTRO'
              ? 'Retirada registrada com sucesso'
              : 'OS finalizada com sucesso'
      toast.success(msg)
      setSelectedOsId(null)
      setImeiSearch('')
      setComunicacaoResult('AGUARDANDO')
      setNovoLocalInstalacao('')
      setPosChave('NAO')
      setObservacoes('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const vincularAparelhoMutation = useMutation({
    mutationFn: ({ ordemServicoId, idAparelho }: { ordemServicoId: number; idAparelho: string }) =>
      api(`/ordens-servico/${ordemServicoId}/aparelho`, {
        method: 'PATCH',
        body: JSON.stringify({ idAparelho }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      queryClient.invalidateQueries({ queryKey: ['aparelhos', 'para-testes'] })
    },
    onError: () => toast.error('Erro ao vincular rastreador. Tente novamente.'),
  })

  const updateStatusAparelhoMutation = useMutation({
    mutationFn: ({
      id,
      status,
      observacao,
    }: {
      id: number
      status: string
      observacao: string
    }) =>
      api(`/aparelhos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, observacao }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aparelhos'] })
      queryClient.invalidateQueries({ queryKey: ['aparelhos', 'para-testes'] })
    },
  })

  const vincularOuLimparAparelho = useCallback(
    (idAparelho: string) => {
      if (!selectedOs) return
      vincularAparelhoMutation.mutate({
        ordemServicoId: selectedOs.id,
        idAparelho: idAparelho.trim(),
      })
    },
    [selectedOs, vincularAparelhoMutation],
  )

  useEffect(() => {
    if (!selectedOs || !imeiSearch.trim()) {
      pendingLinkRef.current = null
      return
    }
    const id = imeiSearch.trim()
    if (selectedOs.idAparelho === id) {
      pendingLinkRef.current = null
      return
    }
    // Evita chamar a mutation repetidamente enquanto o servidor ainda não confirmou o vínculo
    if (pendingLinkRef.current?.osId === selectedOs.id && pendingLinkRef.current?.imei === id) return
    const match = rastreadores.find((r) => (r.identificador ?? '').trim().toLowerCase() === id.toLowerCase())
    if (match) {
      pendingLinkRef.current = { osId: selectedOs.id, imei: id }
      vincularOuLimparAparelho(id)
    }
  }, [imeiSearch, selectedOs, rastreadores, vincularOuLimparAparelho])

  const handleTrocarAparelho = useCallback(() => {
    if (selectedOs) {
      vincularAparelhoMutation.mutate({
        ordemServicoId: selectedOs.id,
        idAparelho: '',
      })
    }
    setImeiSearch('')
    setComunicacaoResult('AGUARDANDO')
    setNovoLocalInstalacao('')
  }, [selectedOs, vincularAparelhoMutation])

  const handleComunicacaoChange = useCallback(
    (v: ComunicacaoResult) => {
      if (v === 'NAO_COMUNICOU' && aparelhoSelecionado && selectedOs) {
        const obs = `OS #${selectedOs.numero} - Não comunicou em teste${observacoes ? ` | ${observacoes}` : ''}`
        updateStatusAparelhoMutation.mutate({
          id: aparelhoSelecionado.id,
          status: aparelhoSelecionado.status,
          observacao: obs,
        })
        vincularAparelhoMutation.mutate({
          ordemServicoId: selectedOs.id,
          idAparelho: '',
        })
        setImeiSearch('')
        setComunicacaoResult('AGUARDANDO')
        toast.info('Observação registrada no rastreador. Selecione outro aparelho.')
      } else {
        setComunicacaoResult(v)
      }
    },
    [aparelhoSelecionado, selectedOs, observacoes, vincularAparelhoMutation]
  )

  const handleCancelarClick = useCallback(() => {
    setShowCancelarModal(true)
  }, [])

  const handleReagendar = useCallback(() => {
    if (!selectedOs) return
    setShowCancelarModal(false)
    updateStatusOsMutation.mutate({ id: selectedOs.id, status: 'AGENDADO' })
  }, [selectedOs, updateStatusOsMutation])

  const handleCancelarOs = useCallback(() => {
    if (!selectedOs) return
    setShowCancelarModal(false)
    updateStatusOsMutation.mutate({ id: selectedOs.id, status: 'CANCELADO' })
  }, [selectedOs, updateStatusOsMutation])

  const handleRetiradaRealizada = useCallback(() => {
    setShowRetiradaModal(true)
  }, [])

  const handleRetiradaConfirmar = useCallback(
    (aparelhoEncontrado: boolean) => {
      if (!selectedOs) return
      setShowRetiradaModal(false)
      const hoje = new Date().toLocaleDateString('pt-BR')
      const obs = `Data retirada: ${hoje} | Aparelho encontrado: ${aparelhoEncontrado ? 'Sim' : 'Não'}`
      updateStatusOsMutation.mutate({
        id: selectedOs.id,
        status: 'AGUARDANDO_CADASTRO',
        observacao: obs,
      })
    },
    [selectedOs, updateStatusOsMutation],
  )

  const canFinalizar =
    !!selectedOs?.idAparelho?.trim() &&
    comunicacaoResult === 'COMUNICANDO' &&
    !!novoLocalInstalacao.trim()

  const handleFinalizar = useCallback(() => {
    if (!selectedOs) {
      toast.error('Selecione uma OS na fila')
      return
    }
    if (!selectedOs.idAparelho?.trim()) {
      toast.error('Selecione e vincule um aparelho para finalizar')
      return
    }
    if (comunicacaoResult !== 'COMUNICANDO') {
      toast.error('Selecione "Comunicando" para finalizar o teste')
      return
    }
    if (!novoLocalInstalacao.trim()) {
      toast.error('Informe o novo local de instalação')
      return
    }
    const obs = observacoes.trim() ? observacoes : undefined
    updateStatusOsMutation.mutate({
      id: selectedOs.id,
      status: 'TESTES_REALIZADOS',
      observacao: obs,
      localInstalacao: novoLocalInstalacao.trim(),
      posChave,
    })
  }, [selectedOs, comunicacaoResult, observacoes, novoLocalInstalacao, posChave, updateStatusOsMutation])

  useEffect(() => {
    if (selectedOsId !== null && listaTestando.length > 0 && !listaTestando.find((o) => o.id === selectedOsId)) {
      setSelectedOsId(null)
    }
  }, [listaTestando, selectedOsId])

  useEffect(() => {
    if (!selectedOsId && listaTestando.length > 0) {
      setSelectedOsId(listaTestando[0].id)
    }
  }, [listaTestando, selectedOsId])

  useEffect(() => {
    setImeiSearch(selectedOs?.idAparelho ?? '')
  }, [selectedOs?.id, selectedOs?.idAparelho])

  return (
    <div className="-m-4 flex flex-1 min-h-0 overflow-hidden">
      <TesteBancada
        selectedOs={selectedOs ?? null}
        rastreadores={rastreadores}
        imeiSearch={imeiSearch}
        onImeiSearchChange={setImeiSearch}
        aparelhoSelecionado={aparelhoSelecionado ?? null}
        onTrocarAparelho={handleTrocarAparelho}
        comunicacaoResult={comunicacaoResult}
        onComunicacaoChange={handleComunicacaoChange}
        novoLocalInstalacao={novoLocalInstalacao}
        onNovoLocalInstalacaoChange={setNovoLocalInstalacao}
        posChave={posChave}
        onPosChaveChange={setPosChave}
        observacoes={observacoes}
        onObservacoesChange={setObservacoes}
        onCancelar={handleCancelarClick}
        onFinalizar={handleFinalizar}
        onRetiradaRealizada={handleRetiradaRealizada}
        canFinalizar={canFinalizar}
        isRetirada={selectedOs?.tipo === 'RETIRADA'}
      />
      <TesteFilaSidebar
        items={listaTestando}
        selectedId={selectedOsId}
        search={search}
        onSearchChange={setSearch}
        onSelect={setSelectedOsId}
      />

      <Dialog open={showRetiradaModal} onOpenChange={(o) => !o && setShowRetiradaModal(false)}>
        <DialogContent
          hideClose
          className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
          ariaTitle="Retirada realizada"
        >
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="remove_circle" className="text-erp-blue" />
              <h2 className="text-lg font-bold text-slate-800">Retirada realizada</h2>
            </div>
            <button
              onClick={() => setShowRetiradaModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">
              O aparelho foi encontrado no local?
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleRetiradaConfirmar(true)}
                disabled={updateStatusOsMutation.isPending}
              >
                Sim
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => handleRetiradaConfirmar(false)}
                disabled={updateStatusOsMutation.isPending}
              >
                Não
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelarModal} onOpenChange={(o) => !o && setShowCancelarModal(false)}>
        <DialogContent
          hideClose
          className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
          ariaTitle="Cancelar operação"
        >
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="help" className="text-erp-blue" />
              <h2 className="text-lg font-bold text-slate-800">Cancelar operação</h2>
            </div>
            <button
              onClick={() => setShowCancelarModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <p className="text-sm text-slate-600">
              O que deseja fazer com esta ordem de serviço?
            </p>
          </div>
          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCancelarModal(false)}>
              Voltar
            </Button>
            <Button
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
              onClick={handleReagendar}
              disabled={!selectedOs || updateStatusOsMutation.isPending}
            >
              Reagendar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelarOs}
              disabled={!selectedOs || updateStatusOsMutation.isPending}
            >
              Cancelar OS
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  )
}
