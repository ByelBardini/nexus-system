import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useUsuariosPaginatedQuery,
  usePermissionsQuery,
  useCargosComPermissoesQuery,
} from "@/pages/usuarios/hooks/useUsuariosQueries";
import { paginatedUsuariosFixture, usuarioListItemFixture } from "../fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  apiMock.mockReset();
});

describe("useUsuariosPaginatedQuery", () => {
  it("monta query string com busca, filtro e página", async () => {
    const u = usuarioListItemFixture();
    apiMock.mockResolvedValue(
      paginatedUsuariosFixture([u], { total: 1, page: 2, totalPages: 1 }),
    );

    const { result } = renderHook(
      () => useUsuariosPaginatedQuery("ana", "ATIVOS", 2),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/users\/paginated\?search=ana&ativo=true&page=2&limit=15/,
      ),
    );
  });

  it("TODOS não envia ativo", async () => {
    apiMock.mockResolvedValue(
      paginatedUsuariosFixture([], { total: 0, page: 1, totalPages: 0 }),
    );
    const { result } = renderHook(
      () => useUsuariosPaginatedQuery("", "TODOS", 1),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const call = String(apiMock.mock.calls[0]?.[0]);
    expect(call).toContain("page=1");
    expect(call).not.toContain("ativo=");
  });
});

describe("usePermissionsQuery", () => {
  it("chama /roles/permissions", async () => {
    apiMock.mockResolvedValue([{ id: 1, code: "A.B.C" }]);
    const { result } = renderHook(() => usePermissionsQuery(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledWith("/roles/permissions");
  });
});

describe("useCargosComPermissoesQuery", () => {
  it("não dispara com enabled false", () => {
    renderHook(() => useCargosComPermissoesQuery(false), {
      wrapper: createWrapper(),
    });
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("dispara com enabled true", async () => {
    apiMock.mockResolvedValue([]);
    const { result } = renderHook(() => useCargosComPermissoesQuery(true), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMock).toHaveBeenCalledWith("/roles?includePermissions=true");
  });
});
