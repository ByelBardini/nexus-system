import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api-error";

export type CategoriaFalha = {
  id: number;
  nome: string;
  ativo: boolean;
  motivaTexto: boolean;
  criadoEm: string;
};

type ModalState =
  | { open: false }
  | { open: true; modo: "criar" }
  | { open: true; modo: "editar"; item: CategoriaFalha };

const QUERY_KEY = ["tabelas-config", "categorias-falha"] as const;

export function useCategoriasFalhaConfig() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ open: false });

  const { data: categorias = [], isLoading } = useQuery<CategoriaFalha[]>({
    queryKey: QUERY_KEY,
    queryFn: () => api("/tabelas-config/categorias-falha"),
  });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const criarMutation = useMutation({
    mutationFn: (dto: { nome: string; motivaTexto?: boolean }) =>
      api("/tabelas-config/categorias-falha", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({
        queryKey: ["tabelas-config", "categorias-falha", "ativas"],
      });
      toast.success("Categoria criada com sucesso!");
      setModal({ open: false });
    },
    onError: (err) => toastApiError(err, "Erro ao criar categoria"),
  });

  const atualizarMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: { nome?: string; motivaTexto?: boolean };
    }) =>
      api(`/tabelas-config/categorias-falha/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({
        queryKey: ["tabelas-config", "categorias-falha", "ativas"],
      });
      toast.success("Categoria atualizada!");
      setModal({ open: false });
    },
    onError: (err) => toastApiError(err, "Erro ao atualizar categoria"),
  });

  const desativarMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/tabelas-config/categorias-falha/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({
        queryKey: ["tabelas-config", "categorias-falha", "ativas"],
      });
      toast.success("Categoria desativada!");
    },
    onError: (err) => toastApiError(err, "Erro ao desativar categoria"),
  });

  return {
    categorias,
    isLoading,
    modal,
    abrirCriar: () => setModal({ open: true, modo: "criar" }),
    abrirEditar: (item: CategoriaFalha) =>
      setModal({ open: true, modo: "editar", item }),
    fecharModal: () => setModal({ open: false }),
    criarMutation,
    atualizarMutation,
    desativarMutation,
  };
}
