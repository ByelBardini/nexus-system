import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNovoPedidoRastreadorForm } from "@/pages/pedidos/novo-pedido/hooks/useNovoPedidoRastreadorForm";

const api = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));
vi.mock("sonner", () => ({
  toast,
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  api.mockReset();
  api.mockImplementation((url: string, opt?: { method?: string; body?: string }) => {
    if (String(url) === "/pedidos-rastreadores" && opt?.method === "POST")
      return Promise.resolve({});
    if (url === "/tecnicos")
      return Promise.resolve([{ id: 1, nome: "T" }]);
    if (url === "/clientes?subclientes=1")
      return Promise.resolve([{ id: 2, nome: "C" }]);
    if (url === "/equipamentos/marcas") return Promise.resolve([]);
    if (url === "/equipamentos/modelos") return Promise.resolve([]);
    if (url === "/equipamentos/operadoras") return Promise.resolve([]);
    return Promise.resolve(null);
  });
});

describe("useNovoPedidoRastreadorForm", () => {
  it("ao abrir o modal, dataSolicitacao passa a ser a data de hoje (formato ISO)", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result, rerender } = renderHook(
      (props: { open: boolean }) =>
        useNovoPedidoRastreadorForm({
          open: props.open,
          onOpenChange: vi.fn(),
          onSuccess: vi.fn(),
        }),
      {
        wrapper: wrapper(qc),
        initialProps: { open: false },
      },
    );
    result.current.form.setValue("dataSolicitacao", "1990-01-01");
    rerender({ open: true });
    await waitFor(() => {
      const d = result.current.form.getValues("dataSolicitacao");
      expect(d).not.toBe("1990-01-01");
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("onSubmit: POST com payload TECNICO válido", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    api.mockImplementation((url: string, opts?: { method?: string; body?: string }) => {
      if (url === "/pedidos-rastreadores" && opts?.method === "POST")
        return Promise.resolve({});
      if (url === "/tecnicos")
        return Promise.resolve([{ id: 1, nome: "T" }]);
      if (url === "/clientes?subclientes=1")
        return Promise.resolve([{ id: 2, nome: "C" }]);
      if (url.startsWith("/equipamentos")) return Promise.resolve([]);
      return Promise.resolve(null);
    });
    const { result } = renderHook(
      () =>
        useNovoPedidoRastreadorForm({
          open: true,
          onOpenChange: vi.fn(),
          onSuccess: vi.fn(),
        }),
      { wrapper: wrapper(qc) },
    );
    result.current.form.setValue("tipoDestino", "TECNICO");
    result.current.form.setValue("tecnicoId", 1);
    result.current.form.setValue("dataSolicitacao", "2026-02-01");
    result.current.form.setValue("quantidade", 3);
    const data = result.current.form.getValues();
    await act(async () => {
      result.current.onSubmit(data as never);
      await new Promise<void>((r) => {
        queueMicrotask(r);
      });
    });
    await waitFor(
      () => {
        const post = api.mock.calls.find(
          (c) =>
            c[0] === "/pedidos-rastreadores" &&
            (c[1] as { method?: string })?.method === "POST",
        );
        expect(post).toBeDefined();
      },
      { timeout: 3000 },
    );
    const post = api.mock.calls.find(
      (c) =>
        c[0] === "/pedidos-rastreadores" &&
        (c[1] as { method?: string })?.method === "POST",
    )!;
    const body = JSON.parse(
      (post[1] as { body: string }).body,
    ) as { tipoDestino: string; tecnicoId: number };
    expect(body.tipoDestino).toBe("TECNICO");
    expect(body.tecnicoId).toBe(1);
  });
});
