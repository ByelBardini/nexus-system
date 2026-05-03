import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLIENTES_PAGE_SIZE,
  clienteFormSchema,
  formatClienteEnderecoLinhaLista,
  formatClienteEnderecoResumo,
  getClientesFooterStats,
  getDefaultClienteFormValues,
  type Cliente,
} from "@/pages/clientes/shared/clientes-page.shared";

describe("clientes-page.shared — formatClienteEnderecoLinhaLista", () => {
  it("monta linha completa com número, bairro, cidade/UF e CEP", () => {
    expect(
      formatClienteEnderecoLinhaLista({
        logradouro: "Rua A",
        numero: "10",
        complemento: "Sala 2",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01310100",
      }),
    ).toBe("Rua A, nº 10, Sala 2 - Centro - São Paulo/SP - CEP 01310-100");
  });

  it("ignora número vazio ou só espaços", () => {
    expect(
      formatClienteEnderecoLinhaLista({
        logradouro: "Rua B",
        numero: "   ",
        bairro: "X",
      }),
    ).toBe("Rua B - X");
  });

  it("retorna string vazia quando não há campos", () => {
    expect(formatClienteEnderecoLinhaLista({})).toBe("");
  });

  it("inclui apenas CEP quando demais campos ausentes", () => {
    expect(formatClienteEnderecoLinhaLista({ cep: "01310100" })).toBe(
      "- CEP 01310-100",
    );
  });
});

describe("clientes-page.shared — formatClienteEnderecoResumo", () => {
  it("junta logradouro, número e bairro com traço longo para localidade", () => {
    expect(
      formatClienteEnderecoResumo({
        logradouro: "Av. Paulista",
        numero: "1000",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        estado: "SP",
      }),
    ).toBe("Av. Paulista, 1000, Bela Vista — São Paulo/SP");
  });

  it("só localidade quando não há linha base", () => {
    expect(formatClienteEnderecoResumo({ cidade: "Rio", estado: "RJ" })).toBe(
      "— Rio/RJ",
    );
  });

  it("só base quando não há cidade/estado", () => {
    expect(formatClienteEnderecoResumo({ logradouro: "Rua X" })).toBe("Rua X");
  });

  it("retorna vazio sem dados", () => {
    expect(formatClienteEnderecoResumo({})).toBe("");
  });
});

describe("clientes-page.shared — getClientesFooterStats", () => {
  const base = (over: Partial<Cliente>): Cliente =>
    ({
      id: 1,
      nome: "A",
      nomeFantasia: null,
      cnpj: null,
      tipoContrato: "COMODATO",
      status: "ATIVO",
      contatos: [],
      ...over,
    }) as Cliente;

  it("conta ativos apenas na seleção filtrada", () => {
    const todos = [
      base({ id: 1, status: "ATIVO" }),
      base({ id: 2, status: "INATIVO" }),
      base({ id: 3, status: "ATIVO" }),
    ];
    const filtrados = [todos[0], todos[1]];
    expect(getClientesFooterStats(todos, filtrados)).toEqual({
      exibindo: 2,
      totalCadastro: 3,
      ativosNaSelecao: 1,
    });
  });

  it("seleção vazia: ativosNaSelecao zero", () => {
    const todos = [base({ id: 1, status: "ATIVO" })];
    expect(getClientesFooterStats(todos, [])).toEqual({
      exibindo: 0,
      totalCadastro: 1,
      ativosNaSelecao: 0,
    });
  });
});

describe("clientes-page.shared — CLIENTES_PAGE_SIZE", () => {
  it("é positivo (usado na paginação)", () => {
    expect(CLIENTES_PAGE_SIZE).toBeGreaterThan(0);
  });
});

describe("clienteFormSchema — validação cnpj", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const base = { ...getDefaultClienteFormValues(), nome: "Empresa X" };

  it("aceita cnpj vazio (campo opcional)", () => {
    const r = clienteFormSchema.safeParse({ ...base, cnpj: "" });
    expect(r.success).toBe(true);
  });

  it("aceita cnpj undefined", () => {
    const r = clienteFormSchema.safeParse({ ...base, cnpj: undefined });
    expect(r.success).toBe(true);
  });

  it("aceita CNPJ com dígitos verificadores corretos", () => {
    const r = clienteFormSchema.safeParse({
      ...base,
      cnpj: "11222333000181",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita CNPJ com dígito verificador errado", () => {
    const r = clienteFormSchema.safeParse({
      ...base,
      cnpj: "11222333000182",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("CNPJ inválido");
  });

  it("rejeita CNPJ com sequência repetida", () => {
    const r = clienteFormSchema.safeParse({
      ...base,
      cnpj: "11111111111111",
    });
    expect(r.success).toBe(false);
  });

  it("quando VITE_VALIDATE_CPF_CNPJ=false, aceita CNPJ inválido", () => {
    vi.stubEnv("VITE_VALIDATE_CPF_CNPJ", "false");
    const r = clienteFormSchema.safeParse({
      ...base,
      cnpj: "11222333000182",
    });
    expect(r.success).toBe(true);
  });
});
