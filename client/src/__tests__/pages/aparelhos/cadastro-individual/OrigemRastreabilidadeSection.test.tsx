import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrigemRastreabilidadeSection } from "@/pages/aparelhos/cadastro-individual/OrigemRastreabilidadeSection";
import { cadastroIndividualDefaultValues } from "@/pages/aparelhos/cadastro-individual/schema";
import type { FormDataCadastroIndividual } from "@/pages/aparelhos/cadastro-individual/schema";
import type { ClienteLista } from "@/pages/aparelhos/shared/catalog.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden="true" />
  ),
}));

/** Mock mínimo que permite acionar o contrato onChange (incl. null) como o componente real faria. */
vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: ({
    onChange,
    placeholder,
  }: {
    onChange: (id: number | null | undefined) => void;
    placeholder?: string;
  }) => (
    <div>
      <button
        type="button"
        data-testid="select-cliente"
        data-placeholder={placeholder}
        onClick={() => onChange(7)}
      >
        escolher-cliente
      </button>
      <button
        type="button"
        data-testid="select-cliente-limpar"
        onClick={() => onChange(null)}
      >
        limpar-cliente
      </button>
    </div>
  ),
}));

const clientes: ClienteLista[] = [
  { id: 1, nome: "Cliente A", cidade: "São Paulo", estado: "SP" },
  { id: 7, nome: "Cliente B", cidade: "Campinas", estado: "SP" },
];

function OrigemHarness({
  defaultOverrides,
  onFormReady,
}: {
  defaultOverrides?: Partial<FormDataCadastroIndividual>;
  onFormReady?: (f: UseFormReturn<FormDataCadastroIndividual>) => void;
}) {
  const form = useForm<FormDataCadastroIndividual>({
    defaultValues: {
      ...cadastroIndividualDefaultValues,
      ...defaultOverrides,
    },
  });
  onFormReady?.(form);
  const origemW = form.watch("origem");
  const tipoW = form.watch("tipo");
  const propW = form.watch("proprietario");
  return (
    <OrigemRastreabilidadeSection
      form={form}
      clientes={clientes}
      watchOrigem={origemW}
      watchTipo={tipoW}
      watchProprietario={propW}
    />
  );
}

describe("OrigemRastreabilidadeSection", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 36,
      top: 100,
      left: 20,
      bottom: 400,
      right: 220,
      x: 20,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("selecionar Compra Avulsa força status NOVO_OK quando o status atual não é NOVO_OK", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{
          status: "EM_MANUTENCAO",
          origem: "DEVOLUCAO_TECNICO",
        }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: /compra avulsa/i }),
    );
    expect(form!.getValues("origem")).toBe("COMPRA_AVULSA");
    expect(form!.getValues("status")).toBe("NOVO_OK");
  });

  it("selecionar Compra Avulsa não altera o status se já estava em NOVO_OK (idempotência do ramo de status)", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{ status: "NOVO_OK", origem: "RETIRADA_CLIENTE" }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    expect(form!.getValues("status")).toBe("NOVO_OK");
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: /compra avulsa/i }),
    );
    expect(form!.getValues("status")).toBe("NOVO_OK");
  });

  it("a partir de NOVO_OK, selecionar Retirada de Cliente passa o status para EM_MANUTENCAO", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{ status: "NOVO_OK", origem: "COMPRA_AVULSA" }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: /retirada de cliente/i }),
    );
    expect(form!.getValues("status")).toBe("EM_MANUTENCAO");
  });

  it("a partir de NOVO_OK, selecionar Devolução de técnico passa o status para EM_MANUTENCAO", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{ status: "NOVO_OK", origem: "COMPRA_AVULSA" }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: /devolução de técnico/i }),
    );
    expect(form!.getValues("status")).toBe("EM_MANUTENCAO");
  });

  it("nota fiscal: visível só em Compra avulsa, grava no form e some ao trocar a origem", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{ origem: "COMPRA_AVULSA" }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    const nota = screen.getByPlaceholderText(/NF-/i);
    expect(nota).toBeInTheDocument();
    await user.type(nota, "NF-ABCD-001");
    expect(form!.getValues("notaFiscal")).toBe("NF-ABCD-001");
    expect(form!.getValues("origem")).toBe("COMPRA_AVULSA");

    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: /devolução de técnico/i }),
    );
    expect(form!.getValues("origem")).toBe("DEVOLUCAO_TECNICO");
    expect(screen.queryByPlaceholderText(/NF-/i)).not.toBeInTheDocument();
  });

  it("rastreador: escolhe Cliente, grava clienteId e permite limpar (Infinity) ou onChange null no search", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{ tipo: "RASTREADOR" }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^Cliente$/ }));
    expect(form!.getValues("proprietario")).toBe("CLIENTE");
    await user.click(screen.getByTestId("select-cliente"));
    expect(form!.getValues("clienteId")).toBe(7);
    await user.click(screen.getByTestId("select-cliente-limpar"));
    expect(form!.getValues("clienteId")).toBeNull();
    await user.click(screen.getByTestId("select-cliente"));
    expect(form!.getValues("clienteId")).toBe(7);
    await user.click(screen.getByRole("button", { name: /^Infinity$/i }));
    expect(form!.getValues("clienteId")).toBeNull();
    expect(form!.getValues("proprietario")).toBe("INFINITY");
  });

  it("rastreador: erro de validação de clienteId é exibido quando o formulário reporta o erro e o dono é Cliente", async () => {
    const user = userEvent.setup();
    function HComErro() {
      const form = useForm<FormDataCadastroIndividual>({
        defaultValues: {
          ...cadastroIndividualDefaultValues,
          tipo: "RASTREADOR",
        },
      });
      const origemW = form.watch("origem");
      const tipoW = form.watch("tipo");
      const propW = form.watch("proprietario");
      useEffect(() => {
        form.setError("clienteId", { message: "Selecione o cliente" });
      }, [form]);
      return (
        <OrigemRastreabilidadeSection
          form={form}
          clientes={clientes}
          watchOrigem={origemW}
          watchTipo={tipoW}
          watchProprietario={propW}
        />
      );
    }
    render(<HComErro />);
    await user.click(await screen.findByRole("button", { name: /^Cliente$/ }));
    expect(await screen.findByText("Selecione o cliente")).toBeInTheDocument();
  });

  it("qualquer troca de origem zera vinculação: proprietário INFINITY, cliente nulo e nota vazia", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{
          origem: "RETIRADA_CLIENTE",
          proprietario: "CLIENTE",
          clienteId: 1,
          notaFiscal: "NF-99",
          status: "EM_MANUTENCAO",
        }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    expect(form!.getValues("proprietario")).toBe("CLIENTE");
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: /compra avulsa/i }),
    );
    expect(form!.getValues("proprietario")).toBe("INFINITY");
    expect(form!.getValues("clienteId")).toBeNull();
    expect(form!.getValues("notaFiscal")).toBe("");
  });

  it("observacoes é controlado: digitação persiste no formulário", async () => {
    const user = userEvent.setup();
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    const obs = screen.getByPlaceholderText(/detalhes adicionais/i);
    await user.type(obs, "recebido com lacre ok");
    expect(form!.getValues("observacoes")).toBe("recebido com lacre ok");
  });

  it("simcard: exibe o aviso de estoque e não oferece os botões Infinity/Cliente", () => {
    let form: UseFormReturn<FormDataCadastroIndividual> | null = null;
    render(
      <OrigemHarness
        defaultOverrides={{ tipo: "SIM" }}
        onFormReady={(f) => {
          form = f;
        }}
      />,
    );
    expect(
      screen.getByText(
        /simcards são sempre registrados no estoque da infinity/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Infinity$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Cliente$/ }),
    ).not.toBeInTheDocument();
    expect(form!.getValues("tipo")).toBe("SIM");
  });
});
