import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useCargoModal } from "@/pages/cargos/useCargoModal";
import type { Permission, Setor } from "@/types/cargo";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

const _apiCheck = vi.mocked(api);
void _apiCheck;

const setores: Setor[] = [{ id: 10, code: "ADM", nome: "Admin" }];
const permissoes: Permission[] = [
  { id: 101, code: "ADMINISTRATIVO.CARGO.LISTAR" },
];

describe("useCargoModal minimal", () => {
  it("estado inicial", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function W({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      );
    }
    const { result } = renderHook(
      () =>
        useCargoModal({
          cargo: null,
          isNew: true,
          setores,
          permissoes,
          onClose: vi.fn(),
        }),
      { wrapper: W },
    );
    expect(result.current.nome).toBe("");
  });
});
