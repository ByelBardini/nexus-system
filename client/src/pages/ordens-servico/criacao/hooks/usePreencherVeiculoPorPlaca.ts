import { useEffect } from "react";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { useConsultaPlaca } from "@/hooks/useConsultaPlaca";
import type { CriacaoOsFormData } from "../ordens-servico-criacao.schema";

/**
 * Sincroniza a consulta de placa com o formulário (marca, modelo, ano, cor, tipo)
 * e exibe toasts de feedback.
 */
export function usePreencherVeiculoPorPlaca(
  form: UseFormReturn<CriacaoOsFormData>,
  veiculoPlaca: string | undefined,
) {
  const placa = veiculoPlaca ?? "";
  const {
    data: dadosVeiculo,
    isFetching: consultaPlacaLoading,
    isSuccess: consultaPlacaSuccess,
    isError: consultaPlacaError,
    error: consultaPlacaErrorObj,
  } = useConsultaPlaca(placa);

  useEffect(() => {
    if (consultaPlacaSuccess && dadosVeiculo) {
      form.setValue("veiculoMarca", dadosVeiculo.marca ?? "");
      form.setValue("veiculoModelo", dadosVeiculo.modelo ?? "");
      form.setValue("veiculoAno", dadosVeiculo.ano ?? "");
      form.setValue("veiculoCor", dadosVeiculo.cor ?? "");
      form.setValue("veiculoTipo", dadosVeiculo.tipo ?? "");
      toast.success("Dados do veículo consultados");
    } else if (consultaPlacaSuccess && !dadosVeiculo) {
      toast.error("Placa não encontrada");
    }
  }, [consultaPlacaSuccess, dadosVeiculo, form]);

  useEffect(() => {
    if (consultaPlacaError) {
      toast.error(
        consultaPlacaErrorObj instanceof Error
          ? consultaPlacaErrorObj.message
          : "Erro ao consultar placa",
      );
    }
  }, [consultaPlacaError, consultaPlacaErrorObj]);

  return { consultaPlacaLoading };
}
