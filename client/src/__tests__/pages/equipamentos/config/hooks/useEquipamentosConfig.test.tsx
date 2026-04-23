import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useEquipamentosConfig } from "@/pages/equipamentos/config/hooks/useEquipamentosConfig";

const apiMock = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({ canEditConfigAparelho: true }));
const toastApiErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) =>
      p === "CONFIGURACAO.APARELHO.EDITAR"
        ? authState.canEditConfigAparelho
        : false,
  }),
}));

vi.mock("@/lib/toast-api-error", () => ({
  toastApiError: (...a: unknown[]) => toastApiErrorMock(...a),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function mutationCalls() {
  return apiMock.mock.calls.filter((c) => c.length > 1);
}

function findApiCall(
  url: string,
  method: string,
  body?: string,
): unknown[] | undefined {
  return apiMock.mock.calls.find((c) => {
    if (c[0] !== url) return false;
    const init = c[1] as { method?: string; body?: string } | undefined;
    if (!init || init.method !== method) return false;
    if (body !== undefined && init.body !== body) return false;
    return true;
  });
}

function expectParsedBody(call: unknown[] | undefined, expected: object) {
  expect(call).toBeDefined();
  const init = call![1] as { body: string };
  expect(JSON.parse(init.body)).toEqual(expected);
}

const marcaApi = (id: number, nome?: string, ativo = true) => ({
  id,
  nome: nome ?? `Marca${id}`,
  ativo,
  _count: { modelos: 0 },
});

const modeloApi = (
  id: number,
  opts?: Partial<{
    nome: string;
    marcaId: number;
    minCaracteresImei: number | null;
  }>,
) => ({
  id,
  nome: opts?.nome ?? `Modelo${id}`,
  ativo: true,
  minCaracteresImei: opts?.minCaracteresImei ?? 15,
  marca: {
    id: opts?.marcaId ?? 1,
    nome: `Marca${opts?.marcaId ?? 1}`,
    ativo: true,
  },
});

function setupDefaultCatalogMock() {
  apiMock.mockImplementation((url: string, init?: { method?: string }) => {
    if (url === "/equipamentos/marcas")
      return Promise.resolve([
        marcaApi(1, "MarcaAlpha"),
        marcaApi(2, "MarcaBeta", false),
      ]);
    if (url === "/equipamentos/modelos")
      return Promise.resolve([
        modeloApi(100, {
          nome: "RastreadorFalcon",
          marcaId: 1,
          minCaracteresImei: 15,
        }),
      ]);
    if (url === "/equipamentos/operadoras")
      return Promise.resolve([
        { id: 1, nome: "Vivo Norte", ativo: true },
        { id: 2, nome: "Tim Sul", ativo: false },
      ]);
    if (url === "/equipamentos/marcas-simcard")
      return Promise.resolve([
        {
          id: 10,
          nome: "ChipClaro",
          operadoraId: 1,
          temPlanos: false,
          ativo: true,
          minCaracteresIccid: null,
          operadora: { id: 1, nome: "Vivo Norte" },
          planos: [{ id: 20, marcaSimcardId: 10, planoMb: 5, ativo: true }],
        },
      ]);
    if (
      init?.method === "POST" ||
      init?.method === "PATCH" ||
      init?.method === "DELETE"
    )
      return Promise.resolve({});
    return Promise.resolve(null);
  });
}

describe("useEquipamentosConfig", () => {
  beforeEach(() => {
    authState.canEditConfigAparelho = true;
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
    toastApiErrorMock.mockClear();
    apiMock.mockReset();
    setupDefaultCatalogMock();
  });

  it("canEdit reflete permissão CONFIGURACAO.APARELHO.EDITAR", async () => {
    authState.canEditConfigAparelho = false;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canEdit).toBe(false);
  });

  it("carrega listagens: marcas inativas entram em filteredMarcas mas não em marcasAtivas", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filteredMarcas).toHaveLength(2);
    expect(result.current.marcasAtivas.map((m) => m.id)).toEqual([1]);
    expect(result.current.operadorasAtivas.map((o) => o.id)).toEqual([1]);
  });

  it("filtragem: busca por nome de modelo associa a marca correta (não só pelo nome da marca)", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setSearchMarcas("falcon"));
    expect(result.current.filteredMarcas.map((m) => m.id)).toEqual([1]);
    act(() => result.current.setSearchMarcas("   "));
    expect(result.current.filteredMarcas).toHaveLength(2);
  });

  it("filtragem: operadoras e marcas simcard respondem à busca por nome (e operadora)", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setSearchOperadoras("vivo"));
    expect(result.current.filteredOperadoras).toHaveLength(1);
    expect(result.current.filteredOperadoras[0].nome).toBe("Vivo Norte");
    act(() => result.current.setSearchMarcasSimcard("claro"));
    expect(result.current.filteredMarcasSimcard).toHaveLength(1);
    act(() => result.current.setSearchMarcasSimcard("norte"));
    expect(result.current.filteredMarcasSimcard[0].nome).toBe("ChipClaro");
  });

  it("toggleMarca mantém expansões independentes entre IDs", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.toggleMarca(1);
      result.current.toggleMarca(2);
    });
    expect(result.current.expandedMarcaIds.has(1)).toBe(true);
    expect(result.current.expandedMarcaIds.has(2)).toBe(true);
    act(() => result.current.toggleMarca(1));
    expect(result.current.expandedMarcaIds.has(1)).toBe(false);
    expect(result.current.expandedMarcaIds.has(2)).toBe(true);
  });

  it("toggleMarcaSimcard remove ID ao segundo clique", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.toggleMarcaSimcard(10));
    expect(result.current.expandedMarcasSimcardIds.has(10)).toBe(true);
    act(() => result.current.toggleMarcaSimcard(10));
    expect(result.current.expandedMarcasSimcardIds.has(10)).toBe(false);
  });

  it("expõe modelosByMarca e totalModelos consistentes com o catálogo", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalModelos).toBe(1);
    expect(result.current.modelosByMarca.get(1)?.[0].nome).toBe(
      "RastreadorFalcon",
    );
    expect(result.current.modelosByMarca.get(2)).toBeUndefined();
  });

  it("openCreateMarca / openEditMarca preenchem estado do modal", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.openCreateMarca());
    expect(result.current.editingMarca).toBeNull();
    expect(result.current.nomeMarca).toBe("");
    expect(result.current.modalMarcaOpen).toBe(true);
    act(() =>
      result.current.openEditMarca({
        id: 1,
        nome: "X",
        ativo: true,
        _count: { modelos: 0 },
      }),
    );
    expect(result.current.editingMarca?.nome).toBe("X");
    expect(result.current.nomeMarca).toBe("X");
  });

  it("handleSaveMarca: trim — só espaços bloqueia; texto com espaços laterais envia o valor completo (não normaliza)", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.setNomeMarca("   ");
      result.current.handleSaveMarca();
    });
    expect(toast.error).toHaveBeenCalledWith("Nome é obrigatório");
    expect(mutationCalls()).toHaveLength(0);

    act(() => result.current.setNomeMarca("  Alfa  "));
    act(() => result.current.handleSaveMarca());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/marcas", "POST"), {
        nome: "  Alfa  ",
      }),
    );
  });

  it("handleSaveMarca: sucesso fecha o modal; falha na API mantém modal aberto e usa toastApiError", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openCreateMarca());
    act(() => result.current.setNomeMarca("Ok"));
    act(() => result.current.handleSaveMarca());
    await waitFor(() => expect(result.current.modalMarcaOpen).toBe(false));

    apiMock.mockImplementation((url: string, init?: { method?: string }) => {
      if (url === "/equipamentos/marcas" && init?.method === "POST")
        return Promise.reject(new Error("conflito"));
      if (url === "/equipamentos/marcas" && !init?.method)
        return Promise.resolve([
          marcaApi(1, "MarcaAlpha"),
          marcaApi(2, "MarcaBeta", false),
        ]);
      if (url === "/equipamentos/modelos" && !init?.method)
        return Promise.resolve([
          modeloApi(100, {
            nome: "RastreadorFalcon",
            marcaId: 1,
            minCaracteresImei: 15,
          }),
        ]);
      if (url === "/equipamentos/operadoras" && !init?.method)
        return Promise.resolve([
          { id: 1, nome: "Vivo Norte", ativo: true },
          { id: 2, nome: "Tim Sul", ativo: false },
        ]);
      if (url === "/equipamentos/marcas-simcard" && !init?.method)
        return Promise.resolve([
          {
            id: 10,
            nome: "ChipClaro",
            operadoraId: 1,
            temPlanos: false,
            ativo: true,
            minCaracteresIccid: null,
            operadora: { id: 1, nome: "Vivo Norte" },
            planos: [],
          },
        ]);
      if (
        init?.method === "POST" ||
        init?.method === "PATCH" ||
        init?.method === "DELETE"
      )
        return Promise.resolve({});
      return Promise.resolve(null);
    });

    act(() => result.current.openCreateMarca());
    act(() => result.current.setNomeMarca("Dup"));
    act(() => result.current.handleSaveMarca());
    await waitFor(() =>
      expect(toastApiErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao criar marca",
      ),
    );
    expect(result.current.modalMarcaOpen).toBe(true);
  });

  it("handleSaveMarca: atualização envia PATCH só com campos esperados", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.openEditMarca({
        id: 7,
        nome: "Old",
        ativo: true,
        _count: { modelos: 0 },
      }),
    );
    act(() => result.current.setNomeMarca("Renomeada"));
    act(() => result.current.handleSaveMarca());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/marcas/7", "PATCH"), {
        nome: "Renomeada",
      }),
    );
  });

  it("toggleAtivoMarca envia PATCH com ativo invertido", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.toggleAtivoMarca({
        id: 3,
        nome: "M",
        ativo: true,
        _count: { modelos: 0 },
      }),
    );
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/marcas/3", "PATCH"), {
        ativo: false,
      }),
    );
  });

  it("handleSaveModelo: cria sem minCaracteresImei quando campo vazio; edição omite chave ao limpar", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openCreateModelo());
    act(() => result.current.setNomeModelo("SemImei"));
    act(() => result.current.setMarcaIdForModelo("1"));
    act(() => result.current.setMinCaracteresImeiModelo(""));
    act(() => result.current.handleSaveModelo());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/modelos", "POST"), {
        nome: "SemImei",
        marcaId: 1,
      }),
    );

    act(() =>
      result.current.openEditModelo(
        modeloApi(100, {
          nome: "RastreadorFalcon",
          marcaId: 1,
          minCaracteresImei: 15,
        }),
      ),
    );
    act(() => result.current.setNomeModelo("SóNome"));
    act(() => result.current.setMinCaracteresImeiModelo(""));
    act(() => result.current.handleSaveModelo());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/modelos/100", "PATCH"), {
        nome: "SóNome",
      }),
    );
  });

  it("handleSaveModelo: validações de nome e marca na criação", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.setNomeModelo("");
      result.current.handleSaveModelo();
    });
    expect(toast.error).toHaveBeenCalledWith("Nome é obrigatório");
    act(() => result.current.openCreateModelo());
    act(() => result.current.setNomeModelo("Mod"));
    act(() => result.current.handleSaveModelo());
    expect(toast.error).toHaveBeenCalledWith("Selecione uma marca");
    act(() => result.current.setMarcaIdForModelo("1"));
    act(() => result.current.setMinCaracteresImeiModelo("12"));
    act(() => result.current.handleSaveModelo());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/modelos", "POST"), {
        nome: "Mod",
        marcaId: 1,
        minCaracteresImei: 12,
      }),
    );
  });

  it("openCreateModelo com marcaId pré-preenche o select de marca", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.openCreateModelo(42));
    expect(result.current.marcaIdForModelo).toBe("42");
    expect(result.current.modalModeloOpen).toBe(true);
  });

  it("openEditModelo com minCaracteresImei nulo limpa o campo", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.openEditModelo({
        id: 5,
        nome: "M",
        ativo: true,
        minCaracteresImei: null,
        marca: { id: 2, nome: "Marca2", ativo: true },
      }),
    );
    expect(result.current.minCaracteresImeiModelo).toBe("");
  });

  it("toggleAtivoModelo envia PATCH", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.toggleAtivoModelo({
        id: 9,
        nome: "M",
        ativo: false,
        marca: { id: 1, nome: "A", ativo: true },
      }),
    );
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/modelos/9", "PATCH"), {
        ativo: true,
      }),
    );
  });

  it("handleSaveOperadora: validação e create/update", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.setNomeOperadora("  ");
      result.current.handleSaveOperadora();
    });
    expect(toast.error).toHaveBeenCalledWith("Nome é obrigatório");
    expect(mutationCalls()).toHaveLength(0);
    act(() => result.current.setNomeOperadora("OpX"));
    act(() => result.current.handleSaveOperadora());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/operadoras", "POST"), {
        nome: "OpX",
      }),
    );
    act(() =>
      result.current.openEditOperadora({ id: 4, nome: "Old", ativo: true }),
    );
    act(() => result.current.setNomeOperadora("New"));
    act(() => result.current.handleSaveOperadora());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/operadoras/4", "PATCH"), {
        nome: "New",
      }),
    );
  });

  it("toggleAtivoOperadora envia PATCH", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.toggleAtivoOperadora({ id: 2, nome: "O", ativo: true }),
    );
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/operadoras/2", "PATCH"), {
        ativo: false,
      }),
    );
  });

  it("handleSaveMarcaSimcard: validações; create omite minCaracteresIccid se vazio", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.setNomeMarcaSimcard("");
      result.current.handleSaveMarcaSimcard();
    });
    expect(toast.error).toHaveBeenCalledWith("Nome é obrigatório");
    act(() => result.current.openCreateMarcaSimcard());
    act(() => result.current.setNomeMarcaSimcard("Chip"));
    act(() => result.current.handleSaveMarcaSimcard());
    expect(toast.error).toHaveBeenCalledWith("Selecione uma operadora");
    act(() => result.current.setOperadoraIdMarcaSimcard("1"));
    act(() => result.current.setTemPlanosMarcaSimcard(false));
    act(() => result.current.setMinCaracteresIccidMarcaSimcard(""));
    act(() => result.current.handleSaveMarcaSimcard());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/marcas-simcard", "POST"), {
        nome: "Chip",
        operadoraId: 1,
        temPlanos: false,
      }),
    );
    act(() =>
      result.current.openEditMarcaSimcard({
        id: 11,
        nome: "E",
        operadoraId: 1,
        temPlanos: false,
        ativo: true,
        operadora: { id: 1, nome: "Op" },
      }),
    );
    act(() => result.current.setNomeMarcaSimcard("E2"));
    act(() => result.current.handleSaveMarcaSimcard());
    await waitFor(() =>
      expectParsedBody(
        findApiCall("/equipamentos/marcas-simcard/11", "PATCH"),
        {
          nome: "E2",
          operadoraId: 1,
          temPlanos: false,
        },
      ),
    );
  });

  it("edição marca simcard: operadora desmarcada envia operadoraId undefined (omitido no JSON)", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.openEditMarcaSimcard({
        id: 50,
        nome: "Z",
        operadoraId: 3,
        temPlanos: true,
        ativo: true,
        operadora: { id: 3, nome: "Op" },
      }),
    );
    act(() => result.current.setOperadoraIdMarcaSimcard(""));
    act(() => result.current.setNomeMarcaSimcard("Z2"));
    act(() => result.current.handleSaveMarcaSimcard());
    await waitFor(() => {
      const call = findApiCall("/equipamentos/marcas-simcard/50", "PATCH");
      expectParsedBody(call, { nome: "Z2", temPlanos: true });
    });
  });

  it("openEditMarcaSimcard com minCaracteresIccid nulo limpa campo", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.openEditMarcaSimcard({
        id: 1,
        nome: "M",
        operadoraId: 2,
        temPlanos: true,
        ativo: true,
        minCaracteresIccid: null,
        operadora: { id: 2, nome: "Op" },
      }),
    );
    expect(result.current.minCaracteresIccidMarcaSimcard).toBe("");
  });

  it("toggleAtivoMarcaSimcard envia PATCH", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.toggleAtivoMarcaSimcard({
        id: 8,
        nome: "S",
        operadoraId: 1,
        temPlanos: false,
        ativo: true,
        operadora: { id: 1, nome: "Op" },
      }),
    );
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/marcas-simcard/8", "PATCH"), {
        ativo: false,
      }),
    );
  });

  it("handleSavePlanoSimcard: MB vazio, zero, negativo e decimal válido", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.openCreatePlanoSimcard(10));
    act(() => result.current.setPlanoMbPlanoSimcard(""));
    act(() => result.current.handleSavePlanoSimcard());
    expect(toast.error).toHaveBeenCalledWith("Informe o valor em MB");
    act(() => result.current.setPlanoMbPlanoSimcard("0"));
    act(() => result.current.handleSavePlanoSimcard());
    expect(toast.error).toHaveBeenCalledWith("Informe o valor em MB");
    act(() => result.current.setPlanoMbPlanoSimcard("-2"));
    act(() => result.current.handleSavePlanoSimcard());
    expect(toast.error).toHaveBeenCalledWith("Informe o valor em MB");

    const nErr = vi.mocked(toast.error).mock.calls.length;
    act(() => result.current.setPlanoMbPlanoSimcard("1.5"));
    act(() => result.current.handleSavePlanoSimcard());
    await waitFor(() =>
      expectParsedBody(findApiCall("/equipamentos/planos-simcard", "POST"), {
        marcaSimcardId: 10,
        planoMb: 1.5,
      }),
    );
    expect(vi.mocked(toast.error).mock.calls.length).toBe(nErr);
  });

  it("handleSavePlanoSimcard: valor não numérico passa pela validação atual e serializa planoMb como null no JSON", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.openCreatePlanoSimcard(10));
    act(() => result.current.setPlanoMbPlanoSimcard("não-é-número"));
    act(() => result.current.handleSavePlanoSimcard());
    await waitFor(() => {
      const call = findApiCall("/equipamentos/planos-simcard", "POST");
      expect(call).toBeDefined();
      const init = call![1] as { body: string };
      expect(JSON.parse(init.body)).toEqual({
        marcaSimcardId: 10,
        planoMb: null,
      });
    });
  });

  it("handleSavePlanoSimcard: edição envia PATCH só com planoMb", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() =>
      result.current.openEditPlanoSimcard({
        id: 20,
        marcaSimcardId: 10,
        planoMb: 5,
        ativo: true,
      }),
    );
    act(() => result.current.setPlanoMbPlanoSimcard("12"));
    act(() => result.current.handleSavePlanoSimcard());
    await waitFor(() =>
      expectParsedBody(
        findApiCall("/equipamentos/planos-simcard/20", "PATCH"),
        { planoMb: 12 },
      ),
    );
  });

  it("handleSavePlanoSimcard: sem marcaSimcardId não enfileira mutação (nenhuma chamada mutation à API)", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { result } = renderHook(() => useEquipamentosConfig(), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = mutationCalls().length;
    act(() => result.current.setPlanoMbPlanoSimcard("10"));
    act(() => result.current.handleSavePlanoSimcard());
    expect(mutationCalls().length).toBe(before);
  });
});
