import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUFs, useMunicipios } from "@/hooks/useBrasilAPI";
import type { EnderecoCEP } from "@/hooks/useBrasilAPI";
import {
  buildCriarOrdemServicoPayload,
  buildSubclienteCreate,
  buildSubclienteUpdate,
  buscarOuCriarVeiculoId,
  precheckCriacaoOs,
  resolveSubclienteIdFromForm,
  trimObservacoes,
} from "./criacao/ordens-servico-criacao.payload";
import {
  criacaoOsDefaultValues,
  criacaoOsFormSchema,
  type CriacaoOsFormData,
} from "./criacao/ordens-servico-criacao.schema";
import { useOrdensServicoCriacaoCatalogs } from "./criacao/hooks/useOrdensServicoCriacaoCatalogs";
import { usePreencherVeiculoPorPlaca } from "./criacao/hooks/usePreencherVeiculoPorPlaca";
import {
  useCriacaoOsWatchedForSidebar,
  useOrdensServicoCriacaoDerivedState,
} from "./criacao/hooks/useOrdensServicoCriacaoDerivedState";
import { useCriarOrdemServicoMutation } from "./criacao/hooks/useCriarOrdemServicoMutation";
import { OrdensServicoCriacaoHeader } from "./criacao/components/OrdensServicoCriacaoHeader";
import { OrdensServicoCriacaoClienteSection } from "./criacao/components/OrdensServicoCriacaoClienteSection";
import { OrdensServicoCriacaoTecnicoSection } from "./criacao/components/OrdensServicoCriacaoTecnicoSection";
import { OrdensServicoCriacaoVeiculoSection } from "./criacao/components/OrdensServicoCriacaoVeiculoSection";
import { OrdensServicoCriacaoServicoSection } from "./criacao/components/OrdensServicoCriacaoServicoSection";
import { OrdensServicoCriacaoObservacoesSection } from "./criacao/components/OrdensServicoCriacaoObservacoesSection";
import { OrdensServicoCriacaoSidebar } from "./criacao/components/OrdensServicoCriacaoSidebar";

export function OrdensServicoCriacaoPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission("AGENDAMENTO.OS.CRIAR");

  const form = useForm<CriacaoOsFormData>({
    resolver: zodResolver(criacaoOsFormSchema),
    defaultValues: criacaoOsDefaultValues,
  });

  const ordemInstalacao = form.watch("ordemInstalacao");
  const clienteOrdemId = form.watch("clienteOrdemId");
  const tipo = form.watch("tipo");
  const veiculoPlaca = form.watch("veiculoPlaca");
  const subclienteEstado = form.watch("subclienteEstado");
  const tecnicoId = form.watch("tecnicoId");

  const {
    clientes,
    clienteInfinityId,
    subclientes,
    clienteSelecionado,
    tecnicos,
    rastreadoresInstalados,
  } = useOrdensServicoCriacaoCatalogs(ordemInstalacao, clienteOrdemId);

  const { data: ufs = [] } = useUFs();
  const { data: municipios = [] } = useMunicipios(subclienteEstado || null);

  const { consultaPlacaLoading } = usePreencherVeiculoPorPlaca(
    form,
    veiculoPlaca,
  );

  const createMutation = useCriarOrdemServicoMutation();
  const derived = useOrdensServicoCriacaoDerivedState(
    form.control,
    clienteInfinityId,
  );
  const watched = useCriacaoOsWatchedForSidebar(form.control);

  const tecnicoSelecionado = tecnicos.find((t) => t.id === tecnicoId);

  const handleSubclienteAddressFound = useCallback(
    (endereco: EnderecoCEP) => {
      form.setValue("subclienteLogradouro", endereco.logradouro);
      form.setValue("subclienteBairro", endereco.bairro);
      form.setValue("subclienteComplemento", endereco.complemento);
      form.setValue("subclienteCidade", endereco.localidade);
      form.setValue("subclienteEstado", endereco.uf);
    },
    [form],
  );

  const showDetalhesRevisaoRetirada = tipo === "REVISAO" || tipo === "RETIRADA";

  const handleSubmit = async (data: CriacaoOsFormData) => {
    if (!canCreate) return;

    const pre = precheckCriacaoOs(data, clienteInfinityId);
    if (!pre.ok) {
      toast.error(pre.errorMessage);
      return;
    }

    const subclienteId = resolveSubclienteIdFromForm(data);
    const subclienteCreate = buildSubclienteCreate(data);
    const subclienteUpdate = buildSubclienteUpdate(data, subclienteId);
    const observacoes = trimObservacoes(data.observacoes);

    const veiculoId = await buscarOuCriarVeiculoId(data, (body) =>
      api<{ id: number }>("/veiculos/criar-ou-buscar", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );

    const payload = buildCriarOrdemServicoPayload(data, {
      clienteIdFinal: pre.clienteIdFinal,
      subclienteId,
      subclienteCreate,
      subclienteUpdate,
      veiculoId,
      observacoes,
    });

    createMutation.mutate(payload);
  };

  return (
    <div className="-m-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
      <OrdensServicoCriacaoHeader
        userName={user?.nome}
        canCreate={canCreate}
        isFormValid={derived.isFormValid}
        isPending={createMutation.isPending}
        onCancel={() => navigate("/")}
        onEmitir={() => void form.handleSubmit(handleSubmit)()}
      />

      <div className="flex-1 flex min-h-0 pr-96">
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <form
            id="os-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <OrdensServicoCriacaoClienteSection
              form={form}
              ordemInstalacao={ordemInstalacao}
              clientes={clientes}
              subclientes={subclientes}
              ufs={ufs}
              municipios={municipios}
              onSubclienteAddressFound={handleSubclienteAddressFound}
            />
            <OrdensServicoCriacaoTecnicoSection
              form={form}
              tecnicos={tecnicos}
              tecnicoSelecionado={tecnicoSelecionado}
            />
            <OrdensServicoCriacaoVeiculoSection
              form={form}
              consultaPlacaLoading={consultaPlacaLoading}
            />
            <OrdensServicoCriacaoServicoSection
              form={form}
              tipo={tipo}
              showDetalhesRevisaoRetirada={showDetalhesRevisaoRetirada}
              rastreadoresInstalados={rastreadoresInstalados}
            />
            <OrdensServicoCriacaoObservacoesSection form={form} />
          </form>
        </div>

        <OrdensServicoCriacaoSidebar
          ordemInstalacao={ordemInstalacao}
          clienteSelecionado={clienteSelecionado}
          tecnicoSelecionado={tecnicoSelecionado}
          watched={watched}
          tipo={tipo}
          derived={derived}
          canCreate={canCreate}
          isPending={createMutation.isPending}
          onEmitir={() => void form.handleSubmit(handleSubmit)()}
        />
      </div>
    </div>
  );
}
