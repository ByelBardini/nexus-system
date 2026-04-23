import { useMemo, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAparelhoCadastroCatalogs } from "@/pages/aparelhos/shared/useAparelhoCadastroCatalogs";
import {
  filtrarMarcasSimcardPorOperadoraId,
  getModelosDisponiveisPorMarcaNome,
  resolveMarcaModeloIdsPorNome,
} from "@/pages/aparelhos/shared/catalog.helpers";
import { filterDebitosRastreadores } from "@/pages/aparelhos/shared/debito-rastreador";
import {
  cadastroIndividualDefaultValues,
  cadastroIndividualSchema,
  type FormDataCadastroIndividual,
} from "@/pages/aparelhos/cadastro-individual/schema";
import type { StatusAparelho } from "@/pages/aparelhos/cadastro-individual/constants";
import { AbaterDividaSection } from "@/pages/aparelhos/cadastro-individual/AbaterDividaSection";
import { CadastroIndividualFooter } from "@/pages/aparelhos/cadastro-individual/CadastroIndividualFooter";
import { CadastroIndividualHeader } from "@/pages/aparelhos/cadastro-individual/CadastroIndividualHeader";
import { CadastroResumoEntradaPanel } from "@/pages/aparelhos/cadastro-individual/CadastroResumoEntradaPanel";
import { DefinicaoStatusSection } from "@/pages/aparelhos/cadastro-individual/DefinicaoStatusSection";
import { IdentificacaoTecnicaSection } from "@/pages/aparelhos/cadastro-individual/IdentificacaoTecnicaSection";
import { OrigemRastreabilidadeSection } from "@/pages/aparelhos/cadastro-individual/OrigemRastreabilidadeSection";
import { useCadastroIndividualAparelhoMutation } from "@/pages/aparelhos/cadastro-individual/useCadastroIndividualAparelhoMutation";

export function CadastroIndividualPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CONFIGURACAO.APARELHO.CRIAR");

  const form = useForm<FormDataCadastroIndividual>({
    resolver: zodResolver(
      cadastroIndividualSchema,
    ) as Resolver<FormDataCadastroIndividual>,
    defaultValues: cadastroIndividualDefaultValues,
  });

  const watchTipo = form.watch("tipo");
  const watchMarca = form.watch("marca");
  const watchModelo = form.watch("modelo");
  const watchOperadora = form.watch("operadora");
  const watchOrigem = form.watch("origem");
  const watchStatus = form.watch("status");
  const watchIdentificador = form.watch("identificador");
  const watchProprietario = form.watch("proprietario");
  const watchClienteId = form.watch("clienteId");
  const watchAbaterDivida = form.watch("abaterDivida");
  const watchAbaterDebitoId = form.watch("abaterDebitoId");
  const watchMarcaSimcardId = form.watch("marcaSimcardId");

  const {
    clientes,
    modelos,
    marcasSimcard,
    debitosData,
    aparelhosExistentes,
    marcasAtivas,
    operadorasAtivas,
    operadoraIdParaMarcasSimcard,
  } = useAparelhoCadastroCatalogs({
    marcasSimcardQueryEnabled: watchTipo === "SIM",
    operadora: { value: watchOperadora, idMode: "nome" },
    debitosQueryEnabled: watchTipo === "RASTREADOR",
  });

  const { createAparelhoMutation, quantidadeCadastrada, limparFormulario } =
    useCadastroIndividualAparelhoMutation(form, clientes);

  const modelosDisponiveis = useMemo(
    () => getModelosDisponiveisPorMarcaNome(modelos, marcasAtivas, watchMarca),
    [modelos, marcasAtivas, watchMarca],
  );

  const idJaExiste = useMemo(() => {
    if (!watchIdentificador.trim()) return null;
    const cleanId = watchIdentificador.replace(/\D/g, "");
    const found = aparelhosExistentes.find((a) => a.identificador === cleanId);
    return found || null;
  }, [watchIdentificador, aparelhosExistentes]);

  const marcasSimcardFiltradas = useMemo(
    () =>
      filtrarMarcasSimcardPorOperadoraId(
        marcasSimcard,
        operadoraIdParaMarcasSimcard,
      ),
    [marcasSimcard, operadoraIdParaMarcasSimcard],
  );

  const minCaracteresId = useMemo(() => {
    if (watchTipo === "RASTREADOR") {
      const modeloSelecionado = modelosDisponiveis.find(
        (m) => m.nome === form.getValues("modelo"),
      );
      return modeloSelecionado?.minCaracteresImei ?? null;
    }
    const marcaSim = (marcasSimcard ?? []).find(
      (m) => m.id === Number(watchMarcaSimcardId),
    );
    return marcaSim?.minCaracteresIccid ?? null;
  }, [watchTipo, watchMarcaSimcardId, modelosDisponiveis, marcasSimcard, form]);

  const idValido = useMemo(() => {
    if (!watchIdentificador.trim()) return false;
    const cleanId = watchIdentificador.replace(/\D/g, "");
    if (cleanId.length < 1) return false;
    if (minCaracteresId !== null && cleanId.length < minCaracteresId)
      return false;
    return true;
  }, [watchIdentificador, minCaracteresId]);

  const debitosFiltrados = useMemo(() => {
    const todos = debitosData?.data ?? [];
    const marcaModeloFiltro = resolveMarcaModeloIdsPorNome(
      marcasAtivas,
      modelosDisponiveis,
      watchMarca,
      watchModelo,
    );
    return filterDebitosRastreadores(todos, {
      proprietario: watchProprietario,
      clienteId: watchClienteId,
      marcaModelo: marcaModeloFiltro,
    });
  }, [
    debitosData,
    watchProprietario,
    watchClienteId,
    watchMarca,
    watchModelo,
    marcasAtivas,
    modelosDisponiveis,
  ]);

  const selectedDebito = useMemo(
    () => debitosFiltrados.find((d) => d.id === watchAbaterDebitoId) ?? null,
    [debitosFiltrados, watchAbaterDebitoId],
  );

  useEffect(() => {
    if (debitosFiltrados.length === 0 && form.getValues("abaterDivida")) {
      form.setValue("abaterDivida", false);
      form.setValue("abaterDebitoId", null);
    }
  }, [debitosFiltrados.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusDisponiveis = useMemo((): StatusAparelho[] => {
    if (watchOrigem === "COMPRA_AVULSA") return ["NOVO_OK"];
    return ["EM_MANUTENCAO", "CANCELADO_DEFEITO"];
  }, [watchOrigem]);

  const podeSalvar = useMemo(() => {
    if (!watchIdentificador.trim() || !idValido) return false;
    if (watchTipo === "RASTREADOR" && (!watchMarca || !watchModelo))
      return false;
    if (watchTipo === "SIM" && !watchOperadora) return false;
    if (watchProprietario === "CLIENTE" && !watchClienteId) return false;
    return true;
  }, [
    watchIdentificador,
    idValido,
    watchTipo,
    watchMarca,
    watchModelo,
    watchOperadora,
    watchProprietario,
    watchClienteId,
  ]);

  const handleCadastrarEFinalizar = () => {
    form.handleSubmit(
      (data) => {
        createAparelhoMutation.mutate(data, {
          onSuccess: () => navigate("/aparelhos"),
        });
      },
      (errors) => {
        const firstError = Object.values(errors)[0]?.message;
        toast.error(firstError ?? "Verifique os campos do formulário");
      },
    )();
  };

  const handleCadastrarOutro = () => {
    form.handleSubmit(
      (data) => {
        createAparelhoMutation.mutate(data, {
          onSuccess: () => limparFormulario(true),
        });
      },
      (errors) => {
        const firstError = Object.values(errors)[0]?.message;
        toast.error(firstError ?? "Verifique os campos do formulário");
      },
    )();
  };

  const statusRevisao = useMemo(() => {
    if (idJaExiste) return "DUPLICADO";
    if (!idValido && watchIdentificador.trim()) return "ID_INVALIDO";
    if (!podeSalvar) return "INCOMPLETO";
    return "OK";
  }, [idJaExiste, idValido, watchIdentificador, podeSalvar]);

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <CadastroIndividualHeader quantidadeCadastrada={quantidadeCadastrada} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex gap-6 p-6">
          <div className="flex-1 space-y-6">
            <IdentificacaoTecnicaSection
              form={form}
              watchTipo={watchTipo}
              watchMarca={watchMarca}
              watchOperadora={watchOperadora}
              watchIdentificador={watchIdentificador}
              idJaExiste={idJaExiste}
              idValido={idValido}
              marcasAtivas={marcasAtivas}
              modelosDisponiveis={modelosDisponiveis}
              operadorasAtivas={operadorasAtivas}
              marcasSimcardFiltradas={marcasSimcardFiltradas}
            />

            <OrigemRastreabilidadeSection
              form={form}
              clientes={clientes}
              watchOrigem={watchOrigem}
              watchTipo={watchTipo}
              watchProprietario={watchProprietario}
            />

            <DefinicaoStatusSection
              form={form}
              statusDisponiveis={statusDisponiveis}
              watchStatus={watchStatus}
            />

            {watchTipo === "RASTREADOR" && (
              <AbaterDividaSection
                form={form}
                debitosFiltrados={debitosFiltrados}
                watchAbaterDivida={watchAbaterDivida}
                selectedDebito={selectedDebito}
              />
            )}
          </div>

          <CadastroResumoEntradaPanel
            statusRevisao={statusRevisao}
            watchTipo={watchTipo}
            watchMarca={watchMarca}
            watchModelo={watchModelo}
            watchOperadora={watchOperadora}
            watchIdentificador={watchIdentificador}
            idJaExiste={idJaExiste}
            watchOrigem={watchOrigem}
            notaFiscal={form.watch("notaFiscal") ?? ""}
            watchProprietario={watchProprietario}
            watchClienteId={watchClienteId}
            clientes={clientes}
            watchStatus={watchStatus}
          />
        </div>
      </div>

      <CadastroIndividualFooter
        canCreate={canCreate}
        podeSalvar={podeSalvar}
        isPending={createAparelhoMutation.isPending}
        onLimpar={() => limparFormulario(false)}
        onCadastrarOutro={handleCadastrarOutro}
        onFinalizar={handleCadastrarEFinalizar}
      />
    </div>
  );
}
