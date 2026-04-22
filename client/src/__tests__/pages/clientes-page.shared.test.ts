import { describe, expect, it } from "vitest";
import {
  FILTRO_TIPO_CONTRATO_OPTIONS,
  TIPO_CONTRATO_LABEL,
  TIPO_CONTRATO_VALUES,
  buildClienteApiBody,
  clienteFormSchema,
  clienteToFormValues,
  getClientesFooterStats,
  getDefaultClienteFormValues,
  type Cliente,
} from "@/pages/clientes/shared/clientes-page.shared";

function clienteStub(
  overrides: Partial<Cliente> & Pick<Cliente, "id" | "nome" | "status">,
): Cliente {
  return {
    nomeFantasia: null,
    cnpj: null,
    tipoContrato: "COMODATO",
    estoqueProprio: false,
    contatos: [],
    ...overrides,
  };
}

describe("getDefaultClienteFormValues", () => {
  it("retorna objeto estável com valores iniciais esperados", () => {
    const a = getDefaultClienteFormValues();
    const b = getDefaultClienteFormValues();

    expect(a).toEqual(b);
    expect(a.tipoContrato).toBe("COMODATO");
    expect(a.status).toBe("ATIVO");
    expect(a.estoqueProprio).toBe(false);
    expect(a.contatos).toEqual([]);
    expect(a.cor).toBeUndefined();
  });
});

describe("buildClienteApiBody", () => {
  const baseForm = {
    ...getDefaultClienteFormValues(),
    nome: "Empresa X",
    nomeFantasia: "",
    cnpj: "",
    tipoContrato: "COMODATO" as const,
    cep: "",
    logradouro: "Rua A",
    cor: "",
  };

  it("modo create: omite strings vazias de endereço e fantasia", () => {
    const body = buildClienteApiBody(
      { ...baseForm, nomeFantasia: "", cnpj: "", cep: "", cor: "" },
      "create",
    );

    expect(body).toMatchObject({
      nome: "Empresa X",
      tipoContrato: "COMODATO",
      logradouro: "Rua A",
    });
    expect(body).not.toHaveProperty("nomeFantasia");
    expect(body).not.toHaveProperty("cnpj");
    expect(body).not.toHaveProperty("cep");
    expect(body).not.toHaveProperty("cor");
  });

  it("modo create: contatos sem id", () => {
    const body = buildClienteApiBody(
      {
        ...getDefaultClienteFormValues(),
        nome: "C",
        contatos: [
          { nome: "Pessoa", celular: "", email: "" },
          { nome: "Dois", celular: "11", email: "x@y.com" },
        ],
      },
      "create",
    );

    expect(body.contatos).toEqual([
      { nome: "Pessoa", celular: undefined, email: undefined },
      { nome: "Dois", celular: "11", email: "x@y.com" },
    ]);
    expect(body.contatos[0]).not.toHaveProperty("id");
  });

  it("modo update: inclui id nos contatos (undefined serializa omitido no JSON)", () => {
    const body = buildClienteApiBody(
      {
        ...getDefaultClienteFormValues(),
        nome: "C",
        contatos: [
          { id: 1, nome: "Velho", celular: "11", email: "" },
          { nome: "Novo", celular: "", email: "" },
        ],
      },
      "update",
    );

    expect(body.contatos[0]).toEqual({
      id: 1,
      nome: "Velho",
      celular: "11",
      email: undefined,
    });
    expect(body.contatos[1]).toMatchObject({ nome: "Novo" });
    expect(body.contatos[1]).not.toHaveProperty("id");

    const json = JSON.parse(JSON.stringify(body));
    expect(json.contatos[0].id).toBe(1);
    expect(json.contatos[1]).not.toHaveProperty("id");
  });

  it("modo update: envia cor quando preenchida", () => {
    const body = buildClienteApiBody(
      {
        ...getDefaultClienteFormValues(),
        nome: "C",
        cor: "#ff0000",
      },
      "update",
    );

    expect(body.cor).toBe("#ff0000");
  });
});

describe("clienteToFormValues", () => {
  it("converte nulls do API em strings vazias nos campos do formulário", () => {
    const cliente: Cliente = {
      id: 5,
      nome: "N",
      nomeFantasia: null,
      cnpj: null,
      tipoContrato: "AQUISICAO",
      estoqueProprio: true,
      status: "PENDENTE",
      cor: null,
      cep: null,
      logradouro: null,
      numero: null,
      complemento: null,
      bairro: null,
      cidade: null,
      estado: null,
      contatos: [
        {
          id: 9,
          nome: "C",
          celular: null,
          email: null,
        },
      ],
    };

    const form = clienteToFormValues(cliente);

    expect(form.nomeFantasia).toBe("");
    expect(form.cnpj).toBe("");
    expect(form.cep).toBe("");
    expect(form.cor).toBeUndefined();
    expect(form.contatos[0].celular).toBe("");
    expect(form.contatos[0].email).toBe("");
    expect(form.contatos[0].id).toBe(9);
  });
});

describe("clienteFormSchema", () => {
  it("aceita payload válido completo", () => {
    const parsed = clienteFormSchema.safeParse({
      ...getDefaultClienteFormValues(),
      nome: "OK",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const parsed = clienteFormSchema.safeParse({
      ...getDefaultClienteFormValues(),
      nome: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejeita email de contato inválido", () => {
    const parsed = clienteFormSchema.safeParse({
      ...getDefaultClienteFormValues(),
      nome: "X",
      contatos: [{ nome: "Y", email: "invalid" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("aceita email vazio no contato", () => {
    const parsed = clienteFormSchema.safeParse({
      ...getDefaultClienteFormValues(),
      nome: "X",
      contatos: [{ nome: "Y", email: "" }],
    });
    expect(parsed.success).toBe(true);
  });
});

describe("getClientesFooterStats", () => {
  it("conta exibindo, total e ativos apenas na lista filtrada", () => {
    const todos = [
      clienteStub({ id: 1, nome: "A", status: "ATIVO" }),
      clienteStub({ id: 2, nome: "B", status: "PENDENTE" }),
      clienteStub({ id: 3, nome: "C", status: "INATIVO" }),
    ];
    const filtrados = [todos[1], todos[2]];

    expect(getClientesFooterStats(todos, filtrados)).toEqual({
      exibindo: 2,
      totalCadastro: 3,
      ativosNaSelecao: 0,
    });
  });

  it("ativos na seleção reflete apenas clientes ATIVO entre os filtrados", () => {
    const todos = [
      clienteStub({ id: 1, nome: "A", status: "ATIVO" }),
      clienteStub({ id: 2, nome: "B", status: "ATIVO" }),
      clienteStub({ id: 3, nome: "C", status: "PENDENTE" }),
    ];

    expect(getClientesFooterStats(todos, todos)).toEqual({
      exibindo: 3,
      totalCadastro: 3,
      ativosNaSelecao: 2,
    });
  });
});

describe("constantes de UI", () => {
  it("filtro de tipo inclui todos e um item por valor de contrato", () => {
    expect(FILTRO_TIPO_CONTRATO_OPTIONS[0]).toEqual({
      value: "todos",
      label: "Todos",
    });
    expect(FILTRO_TIPO_CONTRATO_OPTIONS).toHaveLength(
      1 + TIPO_CONTRATO_VALUES.length,
    );
    for (const v of TIPO_CONTRATO_VALUES) {
      expect(
        FILTRO_TIPO_CONTRATO_OPTIONS.some((o) => o.value === v),
      ).toBe(true);
      expect(TIPO_CONTRATO_LABEL[v].length).toBeGreaterThan(0);
    }
  });
});
