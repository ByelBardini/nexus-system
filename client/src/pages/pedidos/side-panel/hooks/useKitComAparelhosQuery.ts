import { useQuery } from "@tanstack/react-query";
import type { KitComAparelhos } from "../shared/pedidos-config-types";
import {
  fetchKitComAparelhos,
  kitComAparelhosQueryKey,
} from "../../modal-selecao-ekit/hooks/pareamento-kits.queries";

/**
 * Detalhe de kit com aparelhos — mesma chave/cache que o modal de seleção de e-Kit.
 * @param enabled — ex.: painel aberto, para não buscar com UI fechada.
 */
export function useKitComAparelhosQuery(
  kitId: number | null,
  enabled: boolean,
) {
  return useQuery<KitComAparelhos>({
    queryKey: kitId != null ? kitComAparelhosQueryKey(kitId) : ["kit", null],
    queryFn: () => fetchKitComAparelhos(kitId!),
    enabled: enabled && kitId != null,
  });
}
