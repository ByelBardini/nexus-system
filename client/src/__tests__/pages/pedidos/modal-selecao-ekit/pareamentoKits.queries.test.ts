import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KitDetalhe } from "@/pages/pedidos/shared/pedidos-config-types";
import {
  KITS_DETALHES_QUERY_KEY,
  fetchKitComAparelhos,
  fetchKitsDetalhes,
  kitComAparelhosQueryKey,
} from "@/pages/pedidos/modal-selecao-ekit/hooks/pareamento-kits.queries";
import { buildKitDetalhe } from "./modal-selecao-ekit.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

describe("pareamentoKits.queries", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("KITS_DETALHES_QUERY_KEY é estável e alinhado ao cache do React Query", () => {
    expect(KITS_DETALHES_QUERY_KEY).toEqual([
      "aparelhos",
      "pareamento",
      "kits",
      "detalhes",
    ]);
  });

  it("fetchKitsDetalhes chama o endpoint de detalhes sem query string", async () => {
    const kits: KitDetalhe[] = [buildKitDetalhe({ id: 42 })];
    apiMock.mockResolvedValueOnce(kits);
    await expect(fetchKitsDetalhes()).resolves.toEqual(kits);
    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock).toHaveBeenCalledWith("/aparelhos/pareamento/kits/detalhes");
  });

  it("propaga erro da api", async () => {
    apiMock.mockRejectedValueOnce(new Error("network"));
    await expect(fetchKitsDetalhes()).rejects.toThrow("network");
  });

  it("kitComAparelhosQueryKey alinha com o cache de kit por id", () => {
    expect(kitComAparelhosQueryKey(7)).toEqual(["kit", 7]);
  });

  it("fetchKitComAparelhos chama o endpoint do kit com aparelhos", async () => {
    const body = { id: 1, nome: "K", criadoEm: "", aparelhos: [] };
    apiMock.mockResolvedValueOnce(body);
    await expect(fetchKitComAparelhos(1)).resolves.toEqual(body);
    expect(apiMock).toHaveBeenCalledWith("/aparelhos/pareamento/kits/1");
  });
});
