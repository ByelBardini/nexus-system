import { useRef, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api-error";
import { buildPareamentoPostBody } from "../domain/payload";
import type { ModoPareamento } from "../domain/types";

type PostBodyInput = Parameters<typeof buildPareamentoPostBody>[0];

type SubmitMutationOptions = {
  getModo: () => ModoPareamento;
  getPostBodyInput: () => PostBodyInput;
  onIndividualSuccess: () => void;
  onMassaSuccess: () => void;
  setQuantidadeCriada: Dispatch<SetStateAction<number>>;
  queryClient?: QueryClient;
};

export function usePareamentoSubmitMutation(options: SubmitMutationOptions) {
  const qc = useQueryClient();
  const client = options.queryClient ?? qc;
  const optsRef = useRef(options);
  optsRef.current = options;

  return useMutation({
    mutationFn: async () => {
      const body = buildPareamentoPostBody(optsRef.current.getPostBodyInput());
      return api<{ criados: number }>("/aparelhos/pareamento", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["aparelhos"] });
      optsRef.current.setQuantidadeCriada(
        (prev) => prev + (data?.criados ?? 0),
      );
      toast.success(
        `${data?.criados ?? 0} equipamento(s) criado(s) com sucesso!`,
      );
      const m = optsRef.current.getModo();
      if (m === "individual") optsRef.current.onIndividualSuccess();
      else optsRef.current.onMassaSuccess();
    },
    onError: (err) => toastApiError(err, "Erro ao criar equipamentos"),
  });
}

export type { PostBodyInput };
