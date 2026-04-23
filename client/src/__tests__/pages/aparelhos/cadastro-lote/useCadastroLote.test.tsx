import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClienteLista } from "@/pages/aparelhos/shared/catalog.types";
import type { DebitoRastreadorApi } from "@/types/aparelhos-debito-rastreador";
import { useCadastroLote } from "@/pages/aparelhos/cadastro-lote/useCadastroLote";

const apiMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
const authPermissionMock = vi.hoisted(() =>
  vi.fn((_permission: string) => true),
);

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) => authPermissionMock(p),
  }),
}));

/** IMEI já presente na lista mockada de /aparelhos (15 dígitos). */
const IMEI_JA_CADASTRADO = "999999999999999";
const IMEI_NOVO_A = "111111111111111";
const IMEI_NOVO_B = "222222222222222";

const debitoInfinityM1X1: DebitoRastreadorApi = {
  id: 1,
  devedorTipo: "INFINITY",
  devedorClienteId: null,
  devedorCliente: null,
  credorTipo: "INFINITY",
  credorClienteId: null,
  credorCliente: null,
  marcaId: 1,
  marca: { id: 1, nome: "M1" },
  modeloId: 10,
  modelo: { id: 10, nome: "X1" },
  quantidade: 1,
};

const debitoClienteM1X1: DebitoRastreadorApi = {
  id: 2,
  devedorTipo: "CLIENTE",
  devedorClienteId: 7,
  devedorCliente: { id: 7, nome: "Cliente Lote" },
  credorTipo: "INFINITY",
  credorClienteId: null,
  credorCliente: null,
  marcaId: 1,
  marca: { id: 1, nome: "M1" },
  modeloId: 10,
  modelo: { id: 10, nome: "X1" },
  quantidade: 3,
};

const clientesFixture: ClienteLista[] = [
  { id: 7, nome: "Cliente Lote" },
];

type PostLoteBehavior =
  | "success"
  | { reject: unknown }
  | ((url: string, init?: RequestInit) => Promise<unknown>);

type BuildApiOptions = {
  clientes?: ClienteLista[];
  debitos?: DebitoRastreadorApi[];
  identificadoresExistentes?: string[];
  postLote?: PostLoteBehavior;
};

/**
 * Handler único de API: evita divergência entre testes e garante que rotas
 * esquecidas falhem de forma explícita (return null).
 */
function buildApiHandler(options: BuildApiOptions = {}) {
  const {
    clientes = [],
    debitos = [],
    identificadoresExistentes = [IMEI_JA_CADASTRADO],
    postLote = "success",
  } = options;

  return (url: string, init?: RequestInit) => {
    if (url === "/clientes") return Promise.resolve(clientes);
    if (url === "/equipamentos/marcas")
      return Promise.resolve([{ id: 1, nome: "M1", ativo: true }]);
    if (url === "/equipamentos/modelos")
      return Promise.resolve([
        {
          id: 10,
          nome: "X1",
          ativo: true,
          marca: { id: 1, nome: "M1" },
          minCaracteresImei: 15,
        },
      ]);
    if (url === "/equipamentos/operadoras")
      return Promise.resolve([{ id: 2, nome: "Op", ativo: true }]);
    if (url === "/equipamentos/marcas-simcard" || url.includes("marcas-simcard"))
      return Promise.resolve([
        {
          id: 3,
          nome: "SC",
          operadoraId: 2,
          temPlanos: false,
          operadora: { id: 2, nome: "Op" },
        },
      ]);
    if (url.startsWith("/debitos-rastreadores"))
      return Promise.resolve({ data: debitos });
    if (url === "/aparelhos")
      return Promise.resolve(
        identificadoresExistentes.map((identificador) => ({
          identificador,
          lote: null,
        })),
      );
    if (url === "/aparelhos/lote" && init?.method === "POST") {
      if (postLote === "success") return Promise.resolve({});
      if (typeof postLote === "function") return postLote(url, init);
      return Promise.reject(postLote.reject);
    }
    return Promise.resolve(null);
  };
}

function setupApi(opts?: BuildApiOptions) {
  apiMock.mockImplementation(buildApiHandler(opts));
}

function createWrapper(client?: QueryClient) {
  const queryClient =
    client ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function fillRastreadorValid(
  form: ReturnType<typeof useCadastroLote>["form"],
  opts: {
    referencia?: string;
    idsTexto?: string;
    valorUnitario?: number;
    definirIds?: boolean;
    quantidade?: number;
  } = {},
) {
  const {
    referencia = "LOTE-REF",
    idsTexto = IMEI_NOVO_A,
    valorUnitario = 1000,
    definirIds = true,
    quantidade = 0,
  } = opts;
  form.setValue("referencia", referencia);
  form.setValue("tipo", "RASTREADOR");
  form.setValue("marca", "1");
  form.setValue("modelo", "10");
  form.setValue("definirIds", definirIds);
  form.setValue("quantidade", quantidade);
  form.setValue("idsTexto", idsTexto);
  form.setValue("valorUnitario", valorUnitario);
}

describe("useCadastroLote", () => {
  beforeEach(() => {
    apiMock.mockReset();
    navigateMock.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    authPermissionMock.mockImplementation(() => true);
    setupApi();
  });

  describe("estado derivado e regras de negócio (sem submeter)", () => {
    it("estado inicial: sem IDs ativos, totais zerados e catálogos coerentes com a API", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.marcasAtivas).toEqual([
          expect.objectContaining({ id: 1, nome: "M1", ativo: true }),
        ]);
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.idValidation).toEqual({
        validos: [],
        duplicados: [],
        invalidos: [],
        jaExistentes: [],
      });
      expect(result.current.valorTotal).toBe(0);
      expect(result.current.quantidadeFinal).toBe(0);
      expect(result.current.modelosDisponiveis).toEqual([]);
      expect(result.current.podeSalvar).toBe(false);
      expect(result.current.erroQuantidade).toBeNull();
    });

    it("canCreate false quando falta permissão CONFIGURACAO.APARELHO.CRIAR", async () => {
      authPermissionMock.mockImplementation(
        (p) => p !== "CONFIGURACAO.APARELHO.CRIAR",
      );

      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));
      expect(result.current.canCreate).toBe(false);
    });

    it("referência só com espaços não permite salvar (trim)", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form);
        result.current.form.setValue("referencia", "   \t  ");
      });

      expect(result.current.podeSalvar).toBe(false);
    });

    it("proprietário CLIENTE exige clienteId mesmo com restante válido", async () => {
      setupApi({ clientes: clientesFixture });
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.clientes.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form);
        result.current.form.setValue("proprietarioTipo", "CLIENTE");
        result.current.form.setValue("clienteId", null);
      });

      await waitFor(() =>
        expect(result.current.idValidation.validos.length).toBe(1),
      );
      expect(result.current.podeSalvar).toBe(false);

      act(() => {
        result.current.form.setValue("clienteId", 7);
      });
      expect(result.current.podeSalvar).toBe(true);
      expect(result.current.clienteSelecionado).toEqual(
        clientesFixture[0],
      );
    });

    it("valorUnitário zero bloqueia salvar; um centavo acima de zero libera (com demais campos ok)", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, { valorUnitario: 0 });
      });
      await waitFor(() =>
        expect(result.current.idValidation.validos.length).toBe(1),
      );
      expect(result.current.podeSalvar).toBe(false);

      act(() => {
        result.current.form.setValue("valorUnitario", 1);
      });
      expect(result.current.podeSalvar).toBe(true);
    });

    it("valorTotal e quantidadeFinal usam quantidade manual quando definirIds é false", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, {
          definirIds: false,
          quantidade: 4,
          idsTexto: "",
          valorUnitario: 500,
        });
      });

      expect(result.current.quantidadeFinal).toBe(4);
      // (500/100) * 4 = 20
      expect(result.current.valorTotal).toBe(20);
      expect(result.current.idValidation.validos).toEqual([]);
    });

    it("parseia vários IMEIs (newline, vírgula, ponto-e-vírgula) e exige quantidade alinhada aos válidos", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      const texto = `${IMEI_NOVO_A}\n${IMEI_NOVO_B},${IMEI_NOVO_A};${IMEI_NOVO_B}`;

      act(() => {
        fillRastreadorValid(result.current.form, {
          idsTexto: texto,
          quantidade: 2,
        });
      });

      await waitFor(() => {
        expect(result.current.idValidation.validos).toEqual([
          IMEI_NOVO_A,
          IMEI_NOVO_B,
        ]);
        expect(result.current.idValidation.duplicados).toEqual([
          IMEI_NOVO_A,
          IMEI_NOVO_B,
        ]);
      });

      expect(result.current.erroQuantidade).toBeNull();
      expect(result.current.quantidadeFinal).toBe(2);
      expect(result.current.valorTotal).toBe(20); // (1000/100)*2

      act(() => {
        result.current.form.setValue("quantidade", 99);
      });
      expect(result.current.erroQuantidade).toContain("99");
      expect(result.current.erroQuantidade).toContain("2");
      expect(result.current.podeSalvar).toBe(false);
    });

    it("IMEI já cadastrado vai para jaExistentes e não entra em válidos", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, {
          idsTexto: IMEI_JA_CADASTRADO,
        });
      });

      await waitFor(() => {
        expect(result.current.idValidation.jaExistentes).toEqual([
          IMEI_JA_CADASTRADO,
        ]);
        expect(result.current.idValidation.validos).toEqual([]);
      });
      expect(result.current.podeSalvar).toBe(false);
    });

    it("com definirIds, quantidade 0 não gera erro de divergência (só não exige match numérico)", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, {
          quantidade: 0,
        });
      });

      await waitFor(() =>
        expect(result.current.idValidation.validos.length).toBe(1),
      );
      expect(result.current.erroQuantidade).toBeNull();
      expect(result.current.podeSalvar).toBe(true);
    });

    it("modo SIM exige ICCID ~19 dígitos: mesmo dígito válido para rastreador vira inválido para SIM", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.operadorasAtivas.length).toBe(1));

      act(() => {
        result.current.form.setValue("referencia", "SIM-1");
        result.current.form.setValue("tipo", "SIM");
        result.current.form.setValue("operadora", "2");
        result.current.form.setValue("definirIds", true);
        result.current.form.setValue("valorUnitario", 1000);
        result.current.form.setValue("idsTexto", IMEI_NOVO_A);
      });

      await waitFor(() => {
        expect(result.current.idValidation.invalidos.length).toBeGreaterThan(0);
        expect(result.current.idValidation.validos).toEqual([]);
      });
      expect(result.current.podeSalvar).toBe(false);

      act(() => {
        result.current.form.setValue(
          "idsTexto",
          "1234567890123456789",
        );
      });
      await waitFor(() => {
        expect(result.current.idValidation.validos).toEqual([
          "1234567890123456789",
        ]);
      });
      expect(result.current.podeSalvar).toBe(true);
    });

    it("filtra débitos por cliente devedor e expõe selectedDebito quando o id bate", async () => {
      setupApi({ debitos: [debitoClienteM1X1], clientes: clientesFixture });
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.clientes.length).toBe(1));

      act(() => {
        result.current.form.setValue("proprietarioTipo", "CLIENTE");
        result.current.form.setValue("clienteId", 7);
        result.current.form.setValue("marca", "1");
        result.current.form.setValue("modelo", "10");
      });

      await waitFor(() => {
        expect(result.current.debitosFiltrados).toHaveLength(1);
        expect(result.current.debitosFiltrados[0].id).toBe(2);
      });

      act(() => {
        result.current.form.setValue("abaterDebitoId", 2);
      });
      expect(result.current.selectedDebito).toEqual(
        expect.objectContaining({ id: 2, devedorClienteId: 7 }),
      );

      act(() => {
        result.current.form.setValue("clienteId", 999);
      });
      await waitFor(() => {
        expect(result.current.debitosFiltrados).toHaveLength(0);
      });
      expect(result.current.selectedDebito).toBeNull();
    });
  });

  describe("efeito colateral: abater dívida", () => {
    it("limpa flags de abatimento quando a lista filtrada fica vazia e abater estava ativo", async () => {
      setupApi({ debitos: [debitoInfinityM1X1] });
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        result.current.form.setValue("referencia", "L-débito");
        result.current.form.setValue("marca", "1");
        result.current.form.setValue("modelo", "10");
        result.current.form.setValue("abaterDivida", true);
        result.current.form.setValue("abaterDebitoId", 1);
        result.current.form.setValue("abaterQuantidade", 1);
      });

      await waitFor(() => {
        expect(result.current.debitosFiltrados).toHaveLength(1);
      });

      act(() => {
        result.current.form.setValue("modelo", "999");
      });

      await waitFor(() => {
        expect(result.current.debitosFiltrados).toHaveLength(0);
        expect(result.current.form.getValues("abaterDivida")).toBe(false);
        expect(result.current.form.getValues("abaterDebitoId")).toBeNull();
        expect(result.current.form.getValues("abaterQuantidade")).toBeNull();
      });
    });

    it("com abaterDivida false, o efeito não zera abaterDebitoId só porque a lista de débitos está vazia", async () => {
      setupApi({ debitos: [] });
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => {
        expect(result.current.debitosFiltrados).toHaveLength(0);
      });

      act(() => {
        result.current.form.setValue("abaterDivida", false);
        result.current.form.setValue("abaterDebitoId", 42);
        result.current.form.setValue("abaterQuantidade", 3);
      });

      expect(result.current.form.getValues("abaterDebitoId")).toBe(42);
      expect(result.current.form.getValues("abaterQuantidade")).toBe(3);
    });
  });

  describe("submissão e contrato HTTP", () => {
    it("onSubmit não dispara POST quando podeSalvar é false (guard explícito)", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));
      apiMock.mockClear();

      act(() => {
        result.current.onSubmit(result.current.form.getValues());
      });

      const loteCalls = apiMock.mock.calls.filter((c) => c[0] === "/aparelhos/lote");
      expect(loteCalls).toHaveLength(0);
    });

    it("POST envia nomes de marca/modelo e valor em reais (centavos/100), com IMEIs válidos", async () => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(client),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, {
          referencia: "L-ok",
          idsTexto: IMEI_NOVO_A,
        });
      });
      await waitFor(() => expect(result.current.podeSalvar).toBe(true));

      act(() => {
        result.current.onSubmit(result.current.form.getValues());
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith("/aparelhos");
      });

      expect(toastSuccess).toHaveBeenCalledTimes(1);
      expect(toastSuccess).toHaveBeenCalledWith("Lote registrado com sucesso!");
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aparelhos"] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["debitos-rastreadores"],
      });

      const loteCall = apiMock.mock.calls.find((c) => c[0] === "/aparelhos/lote");
      expect(loteCall?.[1]).toMatchObject({ method: "POST" });
      const body = JSON.parse((loteCall?.[1] as RequestInit).body as string);

      expect(body).toMatchObject({
        referencia: "L-ok",
        tipo: "RASTREADOR",
        marca: "M1",
        modelo: "X1",
        operadora: null,
        quantidade: 1,
        valorUnitario: 10,
        identificadores: [IMEI_NOVO_A],
        proprietarioTipo: "INFINITY",
        clienteId: null,
      });
      expect(body.dataChegada).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      await waitFor(() => {
        expect(result.current.createLoteMutation.isSuccess).toBe(true);
      });
      expect(result.current.createLoteMutation.isPending).toBe(false);
    });

    it("modo quantidade manual: identificadores vazios e quantidade do corpo igual ao campo", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, {
          definirIds: false,
          quantidade: 5,
          idsTexto: "",
          referencia: "LOTE-QTD",
        });
      });
      await waitFor(() => expect(result.current.podeSalvar).toBe(true));

      act(() => {
        result.current.onSubmit(result.current.form.getValues());
      });

      await waitFor(() => expect(navigateMock).toHaveBeenCalled());

      const loteCall = apiMock.mock.calls.find((c) => c[0] === "/aparelhos/lote");
      const body = JSON.parse((loteCall?.[1] as RequestInit).body as string);
      expect(body.identificadores).toEqual([]);
      expect(body.quantidade).toBe(5);
    });

    it("modo SIM: envia nome da operadora e zera marca/modelo no JSON", async () => {
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.operadorasAtivas.length).toBe(1));

      act(() => {
        result.current.form.setValue("referencia", "SIM-LOTE");
        result.current.form.setValue("tipo", "SIM");
        result.current.form.setValue("operadora", "2");
        result.current.form.setValue("definirIds", true);
        result.current.form.setValue("valorUnitario", 2500);
        result.current.form.setValue(
          "idsTexto",
          "1234567890123456789",
        );
      });

      await waitFor(() => expect(result.current.podeSalvar).toBe(true));

      act(() => {
        result.current.onSubmit(result.current.form.getValues());
      });

      await waitFor(() => expect(navigateMock).toHaveBeenCalled());

      const loteCall = apiMock.mock.calls.find((c) => c[0] === "/aparelhos/lote");
      const body = JSON.parse((loteCall?.[1] as RequestInit).body as string);
      expect(body).toMatchObject({
        tipo: "SIM",
        operadora: "Op",
        marca: null,
        modelo: null,
        valorUnitario: 25,
        identificadores: ["1234567890123456789"],
      });
    });

    it("inclui abaterDebitoId e abaterQuantidade no corpo quando abaterDivida é true", async () => {
      setupApi({ debitos: [debitoInfinityM1X1] });
      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, { referencia: "LOTE-ABATE" });
        result.current.form.setValue("abaterDivida", true);
        result.current.form.setValue("abaterDebitoId", 1);
        result.current.form.setValue("abaterQuantidade", 2);
      });
      await waitFor(() => expect(result.current.podeSalvar).toBe(true));

      act(() => {
        result.current.onSubmit(result.current.form.getValues());
      });

      await waitFor(() => expect(navigateMock).toHaveBeenCalled());

      const loteCall = apiMock.mock.calls.find((c) => c[0] === "/aparelhos/lote");
      const body = JSON.parse((loteCall?.[1] as RequestInit).body as string);
      expect(body.abaterDebitoId).toBe(1);
      expect(body.abaterQuantidade).toBe(2);
    });

    it("onError: propaga mensagem de Error e não navega", async () => {
      setupApi({
        postLote: { reject: new Error("Falha no servidor") },
      });

      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, { referencia: "L-erro" });
      });
      await waitFor(() => expect(result.current.podeSalvar).toBe(true));

      act(() => {
        result.current.onSubmit(result.current.form.getValues());
      });

      await waitFor(() => {
        expect(toastError).toHaveBeenCalledTimes(1);
        expect(toastError).toHaveBeenCalledWith("Falha no servidor");
      });
      expect(navigateMock).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.createLoteMutation.isError).toBe(true);
      });
    });

    it("onError: valor não-Error cai na mensagem genérica", async () => {
      setupApi({ postLote: { reject: "falha-opaca" } });

      const { result } = renderHook(() => useCadastroLote(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.marcasAtivas.length).toBe(1));

      act(() => {
        fillRastreadorValid(result.current.form, { referencia: "L-erro2" });
      });
      await waitFor(() => expect(result.current.podeSalvar).toBe(true));

      act(() => {
        result.current.onSubmit(result.current.form.getValues());
      });

      await waitFor(() => {
        expect(toastError).toHaveBeenCalledWith("Erro ao registrar lote");
      });
    });
  });
});
