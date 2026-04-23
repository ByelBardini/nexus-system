import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKitComAparelhosQuery } from "@/pages/pedidos/side-panel/hooks/useKitComAparelhosQuery";
import { buildKitComAparelhos } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

function wrap(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useKitComAparelhosQuery", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("não chama a api quando enabled é false (painel fechado)", async () => {
    apiMock.mockResolvedValue(buildKitComAparelhos());
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderHook(() => useKitComAparelhosQuery(1, false), { wrapper: wrap(qc) });
    await new Promise((r) => setTimeout(r, 30));
    expect(
      apiMock.mock.calls.some((c) => c[0] === "/aparelhos/pareamento/kits/1"),
    ).toBe(false);
  });

  it("não chama a api quando kitId é null", async () => {
    apiMock.mockResolvedValue(buildKitComAparelhos());
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderHook(() => useKitComAparelhosQuery(null, true), {
      wrapper: wrap(qc),
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("quando habilitado busca o kit e compartilha query key com o modal", async () => {
    const data = buildKitComAparelhos({ id: 5, aparelhos: [] });
    apiMock.mockResolvedValue(data);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useKitComAparelhosQuery(5, true), {
      wrapper: wrap(qc),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
    expect(apiMock).toHaveBeenCalledWith("/aparelhos/pareamento/kits/5");
  });
});
