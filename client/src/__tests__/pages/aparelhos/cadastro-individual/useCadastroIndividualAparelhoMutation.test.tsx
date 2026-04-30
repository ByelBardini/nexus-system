import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useCadastroIndividualAparelhoMutation } from "@/pages/aparelhos/cadastro-individual/useCadastroIndividualAparelhoMutation";
import {
  cadastroIndividualDefaultValues,
  type FormDataCadastroIndividual,
} from "@/pages/aparelhos/cadastro-individual/schema";
import type { ClienteLista } from "@/pages/aparelhos/shared/catalog.types";

type ApiFetchOptions = { method?: string; body: string };
type ParsedMutationBody = Record<string, unknown>;
type CadastroIndividualForm = UseFormReturn<FormDataCadastroIndividual>;

const api = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const clientes: ClienteLista[] = [{ id: 10, nome: "Cliente Dez" }];

function baseRastreador(
  overrides: Partial<FormDataCadastroIndividual> = {},
): FormDataCadastroIndividual {
  return {
    ...cadastroIndividualDefaultValues,
    identificador: "123456789012345",
    marca: "MarcaX",
    modelo: "ModY",
    ...overrides,
  };
}

function mockForm() {
  const getValues = vi.fn(() => baseRastreador());
  const reset = vi.fn();
  return {
    getValues,
    reset,
  } as unknown as CadastroIndividualForm;
}

/** Última chamada POST /aparelhos/individual — documenta o contrato com a API. */
function assertLastIndividualPost(): ParsedMutationBody {
  expect(api).toHaveBeenCalled();
  const last = api.mock.calls[api.mock.calls.length - 1]!;
  expect(last[0]).toBe("/aparelhos/individual");
  const init = last[1] as ApiFetchOptions;
  expect(init.method).toBe("POST");
  expect(init.body).toBeTypeOf("string");
  return JSON.parse(init.body) as ParsedMutationBody;
}

function newMutationClient() {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
}

beforeEach(() => {
  api.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  api.mockResolvedValue({});
});

describe("useCadastroIndividualAparelhoMutation", () => {
  describe("fluxo HTTP e React Query", () => {
    it("em sucesso chama POST no endpoint certo, invalida 3 query keys na ordem e incrementa contador a cada sucesso", async () => {
      const qc = newMutationClient();
      const inv = vi.spyOn(qc, "invalidateQueries");
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(baseRastreador());
      });
      await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1));

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({ identificador: "987" }),
        );
      });
      await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(2));

      expect(api).toHaveBeenCalledTimes(2);
      expect(inv).toHaveBeenCalledTimes(6);
      expect(inv.mock.calls.map((c) => c[0])).toEqual([
        { queryKey: ["aparelhos"] },
        { queryKey: ["aparelhos-ids"] },
        { queryKey: ["debitos-rastreadores"] },
        { queryKey: ["aparelhos"] },
        { queryKey: ["aparelhos-ids"] },
        { queryKey: ["debitos-rastreadores"] },
      ]);
      expect(result.current.quantidadeCadastrada).toBe(2);
      expect(toastError).not.toHaveBeenCalled();
    });

    it("em erro não invalida cache, não incrementa contador, não toasta sucesso e exibe falha", async () => {
      api.mockRejectedValueOnce(new Error("rede indisponível"));
      const qc = newMutationClient();
      const inv = vi.spyOn(qc, "invalidateQueries");
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(baseRastreador());
      });

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("rede indisponível"),
      );
      expect(inv).not.toHaveBeenCalled();
      expect(toastSuccess).not.toHaveBeenCalled();
      expect(result.current.quantidadeCadastrada).toBe(0);
    });

    it("após um sucesso, falha seguinte não altera quantidadeCadastrada", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(baseRastreador());
      });
      await waitFor(() => expect(result.current.quantidadeCadastrada).toBe(1));

      api.mockRejectedValueOnce(new Error("segunda falha"));
      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({ identificador: "2" }),
        );
      });
      await waitFor(() => expect(toastError).toHaveBeenCalled());

      expect(result.current.quantidadeCadastrada).toBe(1);
      expect(toastSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe("montagem do payload (regras de negócio)", () => {
    it("contrato mínimo RASTREADOR + DEVOLUCAO: espelha statusEntrada, clienteId e zera campos de SIM/defeito quando não aplicável", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      const data = baseRastreador({
        origem: "DEVOLUCAO_TECNICO",
        proprietario: "CLIENTE",
        clienteId: 10,
        status: "EM_MANUTENCAO",
        observacoes: "",
        notaFiscal: "não deve ir",
        operadora: "Tim",
        marcaSimcardId: "99",
        planoSimcardId: "88",
      });

      act(() => result.current.createAparelhoMutation.mutate(data));
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body).toMatchObject({
        identificador: "123456789012345",
        tipo: "RASTREADOR",
        marca: "MarcaX",
        modelo: "ModY",
        operadora: null,
        origem: "DEVOLUCAO_TECNICO",
        responsavelEntrega: null,
        proprietario: "CLIENTE",
        clienteId: 10,
        notaFiscal: null,
        observacoes: null,
        statusEntrada: "EM_MANUTENCAO",
        categoriaFalha: null,
        destinoDefeito: null,
      });
      expect(body).not.toHaveProperty("marcaSimcardId");
      expect(body).not.toHaveProperty("planoSimcardId");
    });

    it("identificador: remove não-dígitos; só letras vira string vazia (comportamento atual do hook)", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({ identificador: "IMEI-ABC\n\t" }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      expect(assertLastIndividualPost().identificador).toBe("");
    });

    it("observações só com espaços não entram no payload (null)", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({ observacoes: "   \n\t  " }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      expect(assertLastIndividualPost().observacoes).toBeNull();
    });

    it("SIM: sem marca/plano de simcard não envia as chaves (undefined omitido no JSON)", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate({
          ...baseRastreador(),
          tipo: "SIM",
          operadora: "Claro",
          marca: "",
          modelo: "",
          marcaSimcardId: "",
          planoSimcardId: "",
        });
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body.operadora).toBe("Claro");
      expect(body).not.toHaveProperty("marcaSimcardId");
      expect(body).not.toHaveProperty("planoSimcardId");
    });

    it("abaterDivida false: não inclui abaterDebitoId no JSON; true com id null serializa null", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({ abaterDivida: false, abaterDebitoId: 99 }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());
      let raw = (api.mock.calls[0][1] as ApiFetchOptions).body;
      expect(raw).not.toMatch(/abaterDebitoId/);

      api.mockClear();
      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({ abaterDivida: true, abaterDebitoId: null }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());
      raw = (api.mock.calls[0][1] as ApiFetchOptions).body;
      expect(JSON.parse(raw).abaterDebitoId).toBeNull();
    });

    it("RETIRADA_CLIENTE + CLIENTE com clienteId null: sem match no catálogo → responsavelEntrega null", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "RETIRADA_CLIENTE",
            proprietario: "CLIENTE",
            clienteId: null,
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      expect(assertLastIndividualPost().responsavelEntrega).toBeNull();
    });

    it("lista de clientes: find usa o primeiro id coincidente", async () => {
      const duplicados: ClienteLista[] = [
        { id: 10, nome: "Primeiro" },
        { id: 10, nome: "Segundo" },
      ];
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, duplicados),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "RETIRADA_CLIENTE",
            proprietario: "CLIENTE",
            clienteId: 10,
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      expect(assertLastIndividualPost().responsavelEntrega).toBe("Primeiro");
    });
  });

  describe("origem e responsavelEntrega", () => {
    it("COMPRA_AVULSA com nota fiscal preenchida", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "COMPRA_AVULSA",
            notaFiscal: "NF-1",
            status: "CANCELADO_DEFEITO",
            categoriaFalha: "Dano Físico / Carcaça",
            destinoDefeito: "DESCARTADO",
            observacoes: "  obs  ",
            identificador: "12-34-56",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body.identificador).toBe("123456");
      expect(body.responsavelEntrega).toBe("NF-1");
      expect(body.notaFiscal).toBe("NF-1");
      expect(body.observacoes).toBe("obs");
      expect(body.categoriaFalha).toBe("Dano Físico / Carcaça");
      expect(body.destinoDefeito).toBe("DESCARTADO");
    });

    it("COMPRA_AVULSA sem nota fiscal: responsavelEntrega e notaFiscal null", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "COMPRA_AVULSA",
            notaFiscal: "",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body.responsavelEntrega).toBeNull();
      expect(body.notaFiscal).toBeNull();
    });

    it("RETIRADA + CLIENTE usa nome do catálogo; + INFINITY usa string literal Infinity", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "RETIRADA_CLIENTE",
            proprietario: "CLIENTE",
            clienteId: 10,
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());
      expect(assertLastIndividualPost().responsavelEntrega).toBe("Cliente Dez");

      api.mockClear();
      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "RETIRADA_CLIENTE",
            proprietario: "INFINITY",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());
      expect(assertLastIndividualPost().responsavelEntrega).toBe("Infinity");
    });

    it("RETIRADA + CLIENTE com id inexistente no catálogo → null", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "RETIRADA_CLIENTE",
            proprietario: "CLIENTE",
            clienteId: 999,
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      expect(assertLastIndividualPost().responsavelEntrega).toBeNull();
    });

    it("DEVOLUCAO_TECNICO ignora notaFiscal do formulário no payload", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            origem: "DEVOLUCAO_TECNICO",
            notaFiscal: "ignorada",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body.responsavelEntrega).toBeNull();
      expect(body.notaFiscal).toBeNull();
    });
  });

  describe("tipo SIM", () => {
    it("envia operadora e converte ids string para número", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate({
          ...baseRastreador(),
          tipo: "SIM",
          operadora: "Vivo",
          marca: "",
          modelo: "",
          marcaSimcardId: "5",
          planoSimcardId: "9",
        });
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body.tipo).toBe("SIM");
      expect(body.marca).toBeNull();
      expect(body.modelo).toBeNull();
      expect(body.operadora).toBe("Vivo");
      expect(body.marcaSimcardId).toBe(5);
      expect(body.planoSimcardId).toBe(9);
    });
  });

  describe("motivoDefeito", () => {
    it("CANCELADO_DEFEITO + categoriaFalhaMotiva true envia motivoDefeito no payload", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            status: "CANCELADO_DEFEITO",
            categoriaFalha: "Outro",
            categoriaFalhaMotiva: true,
            destinoDefeito: "DESCARTADO",
            motivoDefeito: "Chip danificado",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body.motivoDefeito).toBe("Chip danificado");
    });

    it("CANCELADO_DEFEITO + categoriaFalhaMotiva false envia motivoDefeito null", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            status: "CANCELADO_DEFEITO",
            categoriaFalha: "Dano Físico / Carcaça",
            categoriaFalhaMotiva: false,
            destinoDefeito: "DESCARTADO",
            motivoDefeito: "ignorado",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      expect(assertLastIndividualPost().motivoDefeito).toBeNull();
    });

    it("status diferente de CANCELADO_DEFEITO envia motivoDefeito null", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            status: "EM_MANUTENCAO",
            motivoDefeito: "ignorado",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      expect(assertLastIndividualPost().motivoDefeito).toBeNull();
    });
  });

  describe("status de entrada", () => {
    it("NOVO_OK força categoriaFalha e destinoDefeito null mesmo com valores no form", async () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(
          baseRastreador({
            status: "NOVO_OK",
            categoriaFalha: "Curto Circuito",
            destinoDefeito: "DESCARTADO",
          }),
        );
      });
      await waitFor(() => expect(api).toHaveBeenCalled());

      const body = assertLastIndividualPost();
      expect(body.categoriaFalha).toBeNull();
      expect(body.destinoDefeito).toBeNull();
    });
  });

  describe("limparFormulario", () => {
    it("false reseta para cadastroIndividualDefaultValues", () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.limparFormulario(false);
      });

      expect(form.reset).toHaveBeenCalledWith(cadastroIndividualDefaultValues);
    });

    it("sem argumento comporta-se como false (default)", () => {
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.limparFormulario();
      });

      expect(form.reset).toHaveBeenCalledWith(cadastroIndividualDefaultValues);
    });

    it("true chama getValues e preserva campos exceto identificador vazio", () => {
      const qc = newMutationClient();
      const current = baseRastreador({
        identificador: "999",
        marca: "M",
        clienteId: 10,
      });
      const form = {
        getValues: vi.fn(() => current),
        reset: vi.fn(),
      } as unknown as CadastroIndividualForm;
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.limparFormulario(true);
      });

      expect(form.getValues).toHaveBeenCalled();
      expect(form.reset).toHaveBeenCalledWith({
        ...current,
        identificador: "",
      });
    });
  });

  describe("onError", () => {
    it("valor rejeitado que não é Error usa mensagem genérica", async () => {
      api.mockRejectedValueOnce("timeout");
      const qc = newMutationClient();
      const form = mockForm();
      const { result } = renderHook(
        () => useCadastroIndividualAparelhoMutation(form, clientes),
        { wrapper: wrapper(qc) },
      );

      act(() => {
        result.current.createAparelhoMutation.mutate(baseRastreador());
      });

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith(
          "Erro ao cadastrar equipamento",
        ),
      );
    });
  });
});
