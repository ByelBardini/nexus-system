import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useAparelhoCadastroCatalogs } from "@/pages/aparelhos/shared/useAparelhoCadastroCatalogs";
import {
  filtrarMarcasSimcardPorOperadoraId,
  getModelosDisponiveisPorMarcaId,
  resolveMarcaModeloFiltroLote,
} from "@/pages/aparelhos/shared/catalog.helpers";
import { filterDebitosRastreadores } from "@/pages/aparelhos/shared/debito-rastreador";
import { buildLotePostBody } from "./build-lote-post-body";
import {
  loteFormDefaultValues,
  loteFormSchema,
  type LoteFormValues,
} from "./schema";
import { validateLoteIds } from "./validate-lote-ids";

export function useCadastroLote() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CONFIGURACAO.APARELHO.CRIAR");

  const form = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: loteFormDefaultValues,
  });

  const watchReferencia = form.watch("referencia");
  const watchNotaFiscal = form.watch("notaFiscal");
  const watchTipo = form.watch("tipo");
  const watchProprietario = form.watch("proprietarioTipo");
  const watchMarca = form.watch("marca");
  const watchModelo = form.watch("modelo");
  const watchOperadora = form.watch("operadora");
  const watchClienteId = form.watch("clienteId");
  const watchMarcaSimcard = form.watch("marcaSimcard");
  const watchDefinirIds = form.watch("definirIds");
  const watchIdsTexto = form.watch("idsTexto") ?? "";
  const watchQuantidade = form.watch("quantidade");
  const watchValorUnitario = form.watch("valorUnitario");
  const watchAbaterDivida = form.watch("abaterDivida");
  const watchAbaterDebitoId = form.watch("abaterDebitoId");

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
    marcasSimcardQueryEnabled: true,
    operadora: { value: watchOperadora, idMode: "id" },
    debitosQueryEnabled: watchTipo === "RASTREADOR",
  });

  const marcasSimcardFiltradas = useMemo(
    () =>
      filtrarMarcasSimcardPorOperadoraId(
        marcasSimcard,
        operadoraIdParaMarcasSimcard,
      ),
    [marcasSimcard, operadoraIdParaMarcasSimcard],
  );

  const existingIds = useMemo(
    () =>
      aparelhosExistentes
        .map((a) => a.identificador)
        .filter(Boolean) as string[],
    [aparelhosExistentes],
  );

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === watchClienteId),
    [clientes, watchClienteId],
  );

  const debitosFiltrados = useMemo(() => {
    const todos = debitosData?.data ?? [];
    return filterDebitosRastreadores(todos, {
      proprietario: watchProprietario,
      clienteId: watchClienteId,
      marcaModelo: resolveMarcaModeloFiltroLote(watchMarca, watchModelo),
    });
  }, [debitosData, watchProprietario, watchClienteId, watchMarca, watchModelo]);

  const selectedDebito = useMemo(
    () => debitosFiltrados.find((d) => d.id === watchAbaterDebitoId) ?? null,
    [debitosFiltrados, watchAbaterDebitoId],
  );

  useEffect(() => {
    if (debitosFiltrados.length === 0 && form.getValues("abaterDivida")) {
      form.setValue("abaterDivida", false);
      form.setValue("abaterDebitoId", null);
      form.setValue("abaterQuantidade", null);
    }
  }, [debitosFiltrados.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const idValidation = useMemo(() => {
    if (!watchDefinirIds || !watchIdsTexto.trim()) {
      return { validos: [], duplicados: [], invalidos: [], jaExistentes: [] };
    }
    return validateLoteIds(watchIdsTexto, watchTipo, existingIds);
  }, [watchIdsTexto, watchTipo, watchDefinirIds, existingIds]);

  const modelosDisponiveis = useMemo(
    () => getModelosDisponiveisPorMarcaId(modelos, watchMarca),
    [modelos, watchMarca],
  );

  const valorTotal = useMemo(() => {
    const qtd =
      watchDefinirIds && idValidation.validos.length > 0
        ? idValidation.validos.length
        : watchQuantidade;
    return (watchValorUnitario / 100) * qtd;
  }, [
    watchValorUnitario,
    watchQuantidade,
    watchDefinirIds,
    idValidation.validos.length,
  ]);

  const quantidadeFinal = useMemo(
    () =>
      watchDefinirIds && idValidation.validos.length > 0
        ? idValidation.validos.length
        : watchQuantidade,
    [watchDefinirIds, idValidation.validos.length, watchQuantidade],
  );

  const erroQuantidade = useMemo(() => {
    if (!watchDefinirIds) return null;
    if (watchQuantidade > 0 && idValidation.validos.length > 0) {
      if (watchQuantidade !== idValidation.validos.length) {
        return `Quantidade informada (${watchQuantidade}) não corresponde aos IDs válidos (${idValidation.validos.length})`;
      }
    }
    return null;
  }, [watchDefinirIds, watchQuantidade, idValidation.validos.length]);

  const podeSalvar = useMemo(() => {
    if (!watchReferencia.trim()) return false;
    if (watchProprietario === "CLIENTE" && !watchClienteId) return false;
    if (watchTipo === "RASTREADOR" && (!watchMarca || !watchModelo))
      return false;
    if (watchTipo === "SIM" && !watchOperadora) return false;
    if (watchValorUnitario <= 0) return false;
    if (watchDefinirIds) {
      if (idValidation.validos.length === 0) return false;
      if (erroQuantidade) return false;
    } else {
      if (watchQuantidade <= 0) return false;
    }
    return true;
  }, [
    watchReferencia,
    watchProprietario,
    watchClienteId,
    watchTipo,
    watchMarca,
    watchModelo,
    watchOperadora,
    watchValorUnitario,
    watchDefinirIds,
    watchQuantidade,
    idValidation.validos.length,
    erroQuantidade,
  ]);

  const createLoteMutation = useMutation({
    mutationFn: async (data: LoteFormValues) => {
      const body = buildLotePostBody(data, {
        marcasAtivas,
        modelosDisponiveis,
        operadorasAtivas,
        idValidos: idValidation.validos,
        quantidadeFinal,
      });
      return api("/aparelhos/lote", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos"] });
      queryClient.invalidateQueries({ queryKey: ["debitos-rastreadores"] });
      toast.success("Lote registrado com sucesso!");
      navigate("/aparelhos");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Erro ao registrar lote",
      );
    },
  });

  const onSubmit = (data: LoteFormValues) => {
    if (!podeSalvar) return;
    createLoteMutation.mutate(data);
  };

  return {
    form,
    canCreate,
    watchReferencia,
    watchNotaFiscal,
    watchTipo,
    watchProprietario,
    watchMarca,
    watchModelo,
    watchOperadora,
    watchClienteId,
    watchMarcaSimcard,
    watchDefinirIds,
    watchIdsTexto,
    watchQuantidade,
    watchValorUnitario,
    watchAbaterDivida,
    watchAbaterDebitoId,
    clientes,
    marcasAtivas,
    operadorasAtivas,
    modelosDisponiveis,
    marcasSimcardFiltradas,
    marcasSimcard,
    debitosFiltrados,
    selectedDebito,
    clienteSelecionado,
    idValidation,
    valorTotal,
    quantidadeFinal,
    erroQuantidade,
    podeSalvar,
    createLoteMutation,
    onSubmit,
  };
}
