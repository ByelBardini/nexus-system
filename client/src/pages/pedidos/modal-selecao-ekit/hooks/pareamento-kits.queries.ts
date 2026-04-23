import { api } from "@/lib/api";
import type {
  KitComAparelhos,
  KitDetalhe,
} from "../../shared/pedidos-config-types";

export const KITS_DETALHES_QUERY_KEY = [
  "aparelhos",
  "pareamento",
  "kits",
  "detalhes",
] as const;

export function fetchKitsDetalhes(): Promise<KitDetalhe[]> {
  return api("/aparelhos/pareamento/kits/detalhes");
}

/** Chave alinhada ao cache do React Query para GET do kit com aparelhos. */
export function kitComAparelhosQueryKey(kitId: number) {
  return ["kit", kitId] as const;
}

export function fetchKitComAparelhos(kitId: number): Promise<KitComAparelhos> {
  return api(`/aparelhos/pareamento/kits/${kitId}`);
}
