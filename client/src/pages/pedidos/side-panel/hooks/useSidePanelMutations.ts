import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { StatusPedidoRastreador } from "../shared/pedidos-rastreador.types";

export function useSidePanelMutations(onStatusUpdated: () => void) {
  const queryClient = useQueryClient();

  const kitIdsMutation = useMutation({
    mutationFn: ({ id, kitIds }: { id: number; kitIds: number[] }) =>
      api(`/pedidos-rastreadores/${id}/kits`, {
        method: "PATCH",
        body: JSON.stringify({ kitIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos-rastreadores"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao salvar kit"),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      kitIds,
    }: {
      id: number;
      status: StatusPedidoRastreador;
      kitIds?: number[];
    }) =>
      api(`/pedidos-rastreadores/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, kitIds }),
      }),
    onSuccess: (_, variables) => {
      const status = variables.status;
      queryClient.invalidateQueries({ queryKey: ["pedidos-rastreadores"] });
      if (
        status === "DESPACHADO" ||
        status === "ENTREGUE" ||
        status === "CONFIGURADO" ||
        status === "EM_CONFIGURACAO" ||
        status === "SOLICITADO"
      ) {
        queryClient.invalidateQueries({ queryKey: ["aparelhos"] });
        queryClient.invalidateQueries({ queryKey: ["kit"] });
        queryClient.invalidateQueries({ queryKey: ["kits"] });
      }
      onStatusUpdated();
      toast.success("Status atualizado");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar status",
      ),
  });

  return { kitIdsMutation, statusMutation };
}
