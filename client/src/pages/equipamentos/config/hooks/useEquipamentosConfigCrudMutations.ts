import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-api-error";
import { equipamentosQueryKeys } from "@/lib/query-keys/equipamentos";
import type { EquipamentosConfigModalState } from "./useEquipamentosConfigModalState";

type Closers = Pick<
  EquipamentosConfigModalState,
  | "closeModalMarca"
  | "closeModalModelo"
  | "closeModalOperadora"
  | "closeModalMarcaSimcard"
  | "closeModalPlanoSimcard"
>;

type UseEquipamentosConfigCrudMutationsParams = {
  closers: Closers;
};

/**
 * CRUDs da tela de configuração (invalidação e toasts alinhados ao domínio equipamentos).
 */
export function useEquipamentosConfigCrudMutations(
  params: UseEquipamentosConfigCrudMutationsParams,
) {
  const { closers } = params;
  const queryClient = useQueryClient();

  const {
    closeModalMarca,
    closeModalModelo,
    closeModalOperadora,
    closeModalMarcaSimcard,
    closeModalPlanoSimcard,
  } = closers;

  const createMarcaMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api("/equipamentos/marcas", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcas,
      });
      closeModalMarca();
      toast.success("Marca criada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao criar marca"),
  });

  const updateMarcaMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      ativo?: boolean;
    }) =>
      api(`/equipamentos/marcas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcas,
      });
      closeModalMarca();
      toast.success("Marca atualizada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao atualizar marca"),
  });

  const deleteMarcaMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/marcas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcas,
      });
      toast.success("Marca deletada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao deletar marca"),
  });

  const createModeloMutation = useMutation({
    mutationFn: (data: {
      nome: string;
      marcaId: number;
      minCaracteresImei?: number;
    }) =>
      api("/equipamentos/modelos", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.modelos,
      });
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcas,
      });
      closeModalModelo();
      toast.success("Modelo criado com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao criar modelo"),
  });

  const updateModeloMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      ativo?: boolean;
      minCaracteresImei?: number;
    }) =>
      api(`/equipamentos/modelos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.modelos,
      });
      closeModalModelo();
      toast.success("Modelo atualizado com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao atualizar modelo"),
  });

  const deleteModeloMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/modelos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.modelos,
      });
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcas,
      });
      toast.success("Modelo deletado com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao deletar modelo"),
  });

  const createOperadoraMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api("/equipamentos/operadoras", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.operadoras,
      });
      closeModalOperadora();
      toast.success("Operadora criada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao criar operadora"),
  });

  const updateOperadoraMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      ativo?: boolean;
    }) =>
      api(`/equipamentos/operadoras/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.operadoras,
      });
      closeModalOperadora();
      toast.success("Operadora atualizada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao atualizar operadora"),
  });

  const deleteOperadoraMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/operadoras/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.operadoras,
      });
      toast.success("Operadora deletada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao deletar operadora"),
  });

  const createMarcaSimcardMutation = useMutation({
    mutationFn: (data: {
      nome: string;
      operadoraId: number;
      temPlanos?: boolean;
      minCaracteresIccid?: number;
    }) =>
      api("/equipamentos/marcas-simcard", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcasSimcard,
      });
      closeModalMarcaSimcard();
      toast.success("Marca de simcard criada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao criar marca de simcard"),
  });

  const updateMarcaSimcardMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      operadoraId?: number;
      temPlanos?: boolean;
      ativo?: boolean;
      minCaracteresIccid?: number;
    }) =>
      api(`/equipamentos/marcas-simcard/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcasSimcard,
      });
      closeModalMarcaSimcard();
      toast.success("Marca de simcard atualizada com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao atualizar marca de simcard"),
  });

  const deleteMarcaSimcardMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/marcas-simcard/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcasSimcard,
      });
      toast.success("Marca de simcard excluída com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao excluir marca de simcard"),
  });

  const createPlanoSimcardMutation = useMutation({
    mutationFn: (data: { marcaSimcardId: number; planoMb: number }) =>
      api("/equipamentos/planos-simcard", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcasSimcard,
      });
      closeModalPlanoSimcard();
      toast.success("Plano criado com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao criar plano"),
  });

  const updatePlanoSimcardMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      planoMb?: number;
      ativo?: boolean;
    }) =>
      api(`/equipamentos/planos-simcard/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcasSimcard,
      });
      closeModalPlanoSimcard();
      toast.success("Plano atualizado com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao atualizar plano"),
  });

  const deletePlanoSimcardMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/planos-simcard/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: equipamentosQueryKeys.marcasSimcard,
      });
      toast.success("Plano desativado com sucesso");
    },
    onError: (err) => toastApiError(err, "Erro ao desativar plano"),
  });

  return {
    createMarcaMutation,
    updateMarcaMutation,
    deleteMarcaMutation,
    createModeloMutation,
    updateModeloMutation,
    deleteModeloMutation,
    createOperadoraMutation,
    updateOperadoraMutation,
    deleteOperadoraMutation,
    createMarcaSimcardMutation,
    updateMarcaSimcardMutation,
    deleteMarcaSimcardMutation,
    createPlanoSimcardMutation,
    updatePlanoSimcardMutation,
    deletePlanoSimcardMutation,
  };
}
