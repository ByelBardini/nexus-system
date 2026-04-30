import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ClienteLista } from "@/pages/aparelhos/shared/catalog.types";
import {
  type FormDataCadastroIndividual,
  cadastroIndividualDefaultValues,
} from "./schema";

export function useCadastroIndividualAparelhoMutation(
  form: UseFormReturn<FormDataCadastroIndividual>,
  clientes: ClienteLista[],
) {
  const queryClient = useQueryClient();
  const [quantidadeCadastrada, setQuantidadeCadastrada] = useState(0);

  const createAparelhoMutation = useMutation({
    mutationFn: async (data: FormDataCadastroIndividual) => {
      const cleanId = data.identificador.replace(/\D/g, "");
      const clienteSel = clientes.find((c) => c.id === data.clienteId);

      const responsavelEntrega = (() => {
        if (data.origem === "RETIRADA_CLIENTE")
          return data.proprietario === "CLIENTE"
            ? (clienteSel?.nome ?? null)
            : "Infinity";
        if (data.origem === "COMPRA_AVULSA") return data.notaFiscal || null;
        return null;
      })();

      const obsPartes: string[] = [];
      if (data.observacoes?.trim()) obsPartes.push(data.observacoes.trim());

      const payload = {
        identificador: cleanId,
        tipo: data.tipo,
        marca: data.tipo === "RASTREADOR" ? data.marca : null,
        modelo: data.tipo === "RASTREADOR" ? data.modelo : null,
        operadora: data.tipo === "SIM" ? data.operadora : null,
        marcaSimcardId:
          data.tipo === "SIM" && data.marcaSimcardId
            ? Number(data.marcaSimcardId)
            : undefined,
        planoSimcardId:
          data.tipo === "SIM" && data.planoSimcardId
            ? Number(data.planoSimcardId)
            : undefined,
        origem: data.origem,
        responsavelEntrega,
        proprietario: data.proprietario,
        clienteId: data.clienteId,
        notaFiscal:
          data.origem === "COMPRA_AVULSA" ? data.notaFiscal || null : null,
        observacoes: obsPartes.length > 0 ? obsPartes.join(" | ") : null,
        statusEntrada: data.status,
        categoriaFalha:
          data.status === "CANCELADO_DEFEITO" ? data.categoriaFalha : null,
        destinoDefeito:
          data.status === "CANCELADO_DEFEITO" ? data.destinoDefeito : null,
        motivoDefeito:
          data.status === "CANCELADO_DEFEITO" &&
          data.categoriaFalha === "OUTRO"
            ? (data.motivoDefeito ?? null)
            : null,
      };
      return api("/aparelhos/individual", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          abaterDebitoId: data.abaterDivida ? data.abaterDebitoId : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos"] });
      queryClient.invalidateQueries({ queryKey: ["aparelhos-ids"] });
      queryClient.invalidateQueries({ queryKey: ["debitos-rastreadores"] });
      setQuantidadeCadastrada((prev) => prev + 1);
      toast.success("Equipamento cadastrado com sucesso!");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Erro ao cadastrar equipamento",
      );
    },
  });

  const limparFormulario = (manterConfiguracao: boolean = false) => {
    form.reset(
      manterConfiguracao
        ? { ...form.getValues(), identificador: "" }
        : cadastroIndividualDefaultValues,
    );
  };

  return {
    createAparelhoMutation,
    quantidadeCadastrada,
    limparFormulario,
  };
}
