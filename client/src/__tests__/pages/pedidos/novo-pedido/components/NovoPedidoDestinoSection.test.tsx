import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { describe, it, expect } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { getDefaultNovoPedidoRastreadorFormValues } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import type { FormNovoPedido } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import {
  buildOpcoesClienteFromList,
  type ClienteComSubclientes,
} from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.utils";
import { NovoPedidoDestinoSection } from "@/pages/pedidos/novo-pedido/components/NovoPedidoDestinoSection";

const clientes: ClienteComSubclientes[] = [
  { id: 10, nome: "Cliente Alpha", subclientes: [] },
  { id: 20, nome: "Cliente Beta", subclientes: [] },
];

/** Cliente com subcliente: valida valor `subcliente-{id}` no select (edge de domínio). */
const clientesComSubcliente: ClienteComSubclientes[] = [
  {
    id: 100,
    nome: "Holding",
    subclientes: [{ id: 501, nome: "Filial Norte" }],
  },
];

type DestinoHarnessProps = {
  defaultOverrides?: Partial<FormNovoPedido>;
  /** Preenchido a cada render; use após `render` / `waitFor` para inspecionar o formulário. */
  formBag?: { current: UseFormReturn<FormNovoPedido> | null };
  clientesLista?: ClienteComSubclientes[];
  loadingClientes?: boolean;
  destinatarioSelecionado?: unknown;
  cidadeDisplay?: string | null;
  filialDisplay?: string | null;
};

function DestinoHarness({
  defaultOverrides,
  formBag,
  clientesLista = clientes,
  loadingClientes = false,
  destinatarioSelecionado = null,
  cidadeDisplay = null,
  filialDisplay = null,
}: DestinoHarnessProps) {
  const form = useForm<FormNovoPedido>({
    defaultValues: {
      ...getDefaultNovoPedidoRastreadorFormValues("2026-01-20"),
      ...defaultOverrides,
    },
  });
  if (formBag) {
    formBag.current = form;
  }
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itensMisto",
  });
  const tipoDestino = form.watch("tipoDestino");
  const deCliente = form.watch("deCliente");
  const marcaModeloEspecifico = form.watch("marcaModeloEspecifico");
  const operadoraEspecifica = form.watch("operadoraEspecifica");
  const itensMistoValues = form.watch("itensMisto");
  const op = buildOpcoesClienteFromList(clientesLista);

  return (
    <MemoryRouter>
      <FormProvider {...form}>
        <NovoPedidoDestinoSection
          form={form}
          tecnicos={[]}
          loadingTecnicos={false}
          clientes={clientesLista}
          loadingClientes={loadingClientes}
          opcoesCliente={op}
          itensMistoFields={fields}
          appendItem={append}
          removeItem={remove}
          modelosRaw={[{ id: 1, nome: "Mod", marcaId: 1 }]}
          marcas={[{ id: 1, nome: "Marca X" }]}
          operadoras={[{ id: 1, nome: "Op Y" }]}
          tipoDestino={tipoDestino}
          deCliente={deCliente}
          destinatarioSelecionado={destinatarioSelecionado}
          cidadeDisplay={cidadeDisplay}
          filialDisplay={filialDisplay}
          marcaModeloEspecifico={marcaModeloEspecifico}
          operadoraEspecifica={operadoraEspecifica}
          itensMistoValues={itensMistoValues}
        />
      </FormProvider>
    </MemoryRouter>
  );
}

describe("NovoPedidoDestinoSection", () => {
  it("modo inicial: destino técnico, quantidade global e urgência padrão coerentes com defaults", () => {
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(<DestinoHarness formBag={bag} />);
    expect(bag.current).not.toBeNull();
    const v = bag.current!.getValues();
    expect(v.tipoDestino).toBe("TECNICO");
    expect(v.quantidade).toBe(1);
    expect(v.urgencia).toBe("MEDIA");
    expect(v.itensMisto).toEqual([
      { proprietario: "INFINITY", quantidade: 1 },
    ]);
    expect(
      screen.getByRole("checkbox", { name: /Pedido misto/i }),
    ).toBeInTheDocument();
  });

  it("modo Cliente: esconde pedido misto; persiste destinoCliente e reseta itensMisto para um item INFINITY", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(<DestinoHarness formBag={bag} />);
    await u.click(screen.getByRole("button", { name: "Cliente" }));
    expect(
      screen.queryByRole("checkbox", { name: /Pedido misto/i }),
    ).toBeNull();
    const destinoBlock = screen.getByText("Pesquisar Destinatário")
      .parentElement as HTMLElement;
    const combo = within(destinoBlock).getByRole("combobox");
    await u.click(combo);
    await u.click(
      screen.getByRole("option", { name: "Cliente Alpha" }),
    );
    await waitFor(() => {
      expect(bag.current?.getValues("tipoDestino")).toBe("CLIENTE");
      expect(bag.current?.getValues("destinoCliente")).toBe("cliente-10");
      expect(bag.current?.getValues("tecnicoId")).toBeUndefined();
      expect(bag.current?.getValues("itensMisto")).toEqual([
        { proprietario: "INFINITY", quantidade: 1 },
      ]);
    });
    expect(combo).toHaveTextContent("Cliente Alpha");
  });

  it("select de destinatário com subcliente grava valor subcliente-{id}", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <DestinoHarness
        formBag={bag}
        clientesLista={clientesComSubcliente}
      />,
    );
    await u.click(screen.getByRole("button", { name: "Cliente" }));
    const destinoBlock = screen.getByText("Pesquisar Destinatário")
      .parentElement as HTMLElement;
    await u.click(within(destinoBlock).getByRole("combobox"));
    await u.click(
      screen.getByRole("option", { name: /Filial Norte — Holding/ }),
    );
    await waitFor(() => {
      expect(bag.current?.getValues("destinoCliente")).toBe(
        "subcliente-501",
      );
    });
  });

  it("botão Técnico: zera destino cliente, flags de remetente e permite buscar técnico de novo", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <DestinoHarness
        formBag={bag}
        defaultOverrides={{
          tipoDestino: "CLIENTE",
          destinoCliente: "cliente-10",
          deCliente: true,
          deClienteId: 20,
        }}
      />,
    );
    await u.click(screen.getByRole("button", { name: "Técnico" }));
    await waitFor(() => {
      expect(bag.current?.getValues("tipoDestino")).toBe("TECNICO");
      expect(bag.current?.getValues("tecnicoId")).toBeUndefined();
      expect(bag.current?.getValues("destinoCliente")).toBeUndefined();
      expect(bag.current?.getValues("deCliente")).toBe(false);
      expect(bag.current?.getValues("deClienteId")).toBeUndefined();
    });
    expect(
      screen.getByPlaceholderText("Digite para pesquisar técnico..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Pedido misto/i }),
    ).toBeInTheDocument();
  });

  it("pedido misto: segundo destino usa CLIENTE quando já existe linha INFINITY (regra de negócio do append)", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(<DestinoHarness formBag={bag} />);
    await u.click(
      screen.getByRole("checkbox", { name: /Pedido misto/i }),
    );
    await u.click(screen.getByRole("button", { name: "Adicionar Destino" }));
    await waitFor(() => {
      const itens = bag.current!.getValues("itensMisto");
      expect(itens).toHaveLength(2);
      expect(itens![0]!.proprietario).toBe("INFINITY");
      expect(itens![1]!.proprietario).toBe("CLIENTE");
      expect(itens![1]!.quantidade).toBe(1);
    });
  });

  it("pedido misto: sem nenhum INFINITY, Adicionar Destino acrescenta INFINITY", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <DestinoHarness
        formBag={bag}
        defaultOverrides={{
          tipoDestino: "MISTO",
          itensMisto: [
            { proprietario: "CLIENTE", quantidade: 2, clienteId: 10 },
          ],
        }}
      />,
    );
    await u.click(screen.getByRole("button", { name: "Adicionar Destino" }));
    await waitFor(() => {
      const itens = bag.current!.getValues("itensMisto");
      expect(itens).toHaveLength(2);
      expect(itens!.map((i) => i.proprietario)).toEqual([
        "CLIENTE",
        "INFINITY",
      ]);
    });
  });

  it("pedido misto: desmarcar volta para TÉCNICO e colapsa itensMisto para um único INFINITY", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(<DestinoHarness formBag={bag} />);
    const misto = screen.getByRole("checkbox", { name: /Pedido misto/i });
    await u.click(misto);
    await u.click(screen.getByRole("button", { name: "Adicionar Destino" }));
    await u.click(misto);
    await waitFor(() => {
      expect(bag.current?.getValues("tipoDestino")).toBe("TECNICO");
      expect(bag.current?.getValues("itensMisto")).toEqual([
        { proprietario: "INFINITY", quantidade: 1 },
      ]);
    });
    expect(screen.queryByRole("button", { name: "Adicionar Destino" })).toBeNull();
  });

  it("De Cliente: desmarcar limpa deClienteId no estado (não só some o select)", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <DestinoHarness
        formBag={bag}
        defaultOverrides={{
          deCliente: true,
          deClienteId: 10,
        }}
      />,
    );
    await u.click(screen.getByRole("checkbox", { name: /De Cliente/i }));
    await waitFor(() => {
      expect(bag.current?.getValues("deCliente")).toBe(false);
      expect(bag.current?.getValues("deClienteId")).toBeUndefined();
    });
  });

  it("De Cliente: escolher remetente persiste deClienteId numérico", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <DestinoHarness
        formBag={bag}
        defaultOverrides={{
          deCliente: true,
          deClienteId: undefined,
        }}
      />,
    );
    const remetenteBlock = screen.getByText("Cliente remetente")
      .parentElement as HTMLElement;
    const combo = within(remetenteBlock).getByRole("combobox");
    await u.click(combo);
    await u.click(screen.getByRole("option", { name: "Cliente Beta" }));
    await waitFor(() => {
      expect(bag.current?.getValues("deClienteId")).toBe(20);
    });
  });

  it("cartão do destinatário: mostra traço quando objeto não tem nome legível", () => {
    render(
      <DestinoHarness
        destinatarioSelecionado={{}}
        cidadeDisplay={null}
        filialDisplay={null}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("erro em tecnicoId: exibe a mensagem retornada pela validação", async () => {
    const u = userEvent.setup();
    function Harness() {
      const form = useForm<FormNovoPedido>({
        defaultValues: getDefaultNovoPedidoRastreadorFormValues("2026-01-20"),
      });
      const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "itensMisto",
      });
      const tipoDestino = form.watch("tipoDestino");
      const deCliente = form.watch("deCliente");
      const marcaModeloEspecifico = form.watch("marcaModeloEspecifico");
      const operadoraEspecifica = form.watch("operadoraEspecifica");
      const itensMistoValues = form.watch("itensMisto");
      return (
        <MemoryRouter>
          <FormProvider {...form}>
            <button
              type="button"
              onClick={() =>
                form.setError("tecnicoId", { message: "Selecione o técnico" })
              }
            >
              erro-tecnico
            </button>
            <NovoPedidoDestinoSection
              form={form}
              tecnicos={[]}
              loadingTecnicos={false}
              clientes={clientes}
              loadingClientes={false}
              opcoesCliente={buildOpcoesClienteFromList(clientes)}
              itensMistoFields={fields}
              appendItem={append}
              removeItem={remove}
              modelosRaw={[]}
              marcas={[]}
              operadoras={[]}
              tipoDestino={tipoDestino}
              deCliente={deCliente}
              destinatarioSelecionado={null}
              cidadeDisplay={null}
              filialDisplay={null}
              marcaModeloEspecifico={marcaModeloEspecifico}
              operadoraEspecifica={operadoraEspecifica}
              itensMistoValues={itensMistoValues}
            />
          </FormProvider>
        </MemoryRouter>
      );
    }
    render(<Harness />);
    await u.click(screen.getByRole("button", { name: "erro-tecnico" }));
    expect(
      await screen.findByText("Selecione o técnico"),
    ).toBeInTheDocument();
  });

  it("erro em destinoCliente sem message: usa fallback 'Selecione o destinatário'", async () => {
    const u = userEvent.setup();
    function Harness() {
      const form = useForm<FormNovoPedido>({
        defaultValues: {
          ...getDefaultNovoPedidoRastreadorFormValues("2026-01-20"),
          tipoDestino: "CLIENTE",
        },
      });
      const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "itensMisto",
      });
      const tipoDestino = form.watch("tipoDestino");
      const deCliente = form.watch("deCliente");
      const marcaModeloEspecifico = form.watch("marcaModeloEspecifico");
      const operadoraEspecifica = form.watch("operadoraEspecifica");
      const itensMistoValues = form.watch("itensMisto");
      return (
        <MemoryRouter>
          <FormProvider {...form}>
            <button
              type="button"
              onClick={() =>
                form.setError("destinoCliente", { type: "manual" })
              }
            >
              erro-destino-sem-msg
            </button>
            <NovoPedidoDestinoSection
              form={form}
              tecnicos={[]}
              loadingTecnicos={false}
              clientes={clientes}
              loadingClientes={false}
              opcoesCliente={buildOpcoesClienteFromList(clientes)}
              itensMistoFields={fields}
              appendItem={append}
              removeItem={remove}
              modelosRaw={[]}
              marcas={[]}
              operadoras={[]}
              tipoDestino={tipoDestino}
              deCliente={deCliente}
              destinatarioSelecionado={null}
              cidadeDisplay={null}
              filialDisplay={null}
              marcaModeloEspecifico={marcaModeloEspecifico}
              operadoraEspecifica={operadoraEspecifica}
              itensMistoValues={itensMistoValues}
            />
          </FormProvider>
        </MemoryRouter>
      );
    }
    render(<Harness />);
    await u.click(
      screen.getByRole("button", { name: "erro-destino-sem-msg" }),
    );
    const destinoField = screen.getByText("Pesquisar Destinatário")
      .parentElement as HTMLElement;
    const erros = within(destinoField).getAllByText("Selecione o destinatário");
    expect(
      erros.some(
        (el) =>
          el.tagName.toLowerCase() === "p" &&
          el.classList.contains("text-destructive"),
      ),
    ).toBe(true);
  });

  it("quantidade global: valores válidos persistem; inválidos viram 1", () => {
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(<DestinoHarness formBag={bag} />);
    const qty = screen.getByRole("spinbutton");
    fireEvent.change(qty, { target: { value: "12" } });
    expect(bag.current?.getValues("quantidade")).toBe(12);
    fireEvent.change(qty, { target: { value: "0" } });
    expect(bag.current?.getValues("quantidade")).toBe(1);
    fireEvent.change(qty, { target: { value: "abc" } });
    expect(bag.current?.getValues("quantidade")).toBe(1);
  });

  it("exibe erros de quantidade e dataSolicitacao vindos do formState", async () => {
    const u = userEvent.setup();
    function HarnessFieldErrors() {
      const form = useForm<FormNovoPedido>({
        defaultValues: getDefaultNovoPedidoRastreadorFormValues("2026-01-20"),
      });
      const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "itensMisto",
      });
      const tipoDestino = form.watch("tipoDestino");
      const deCliente = form.watch("deCliente");
      const marcaModeloEspecifico = form.watch("marcaModeloEspecifico");
      const operadoraEspecifica = form.watch("operadoraEspecifica");
      const itensMistoValues = form.watch("itensMisto");
      return (
        <MemoryRouter>
          <FormProvider {...form}>
            <button
              type="button"
              onClick={() => {
                form.setError("quantidade", {
                  message: "Informe a quantidade",
                });
                form.setError("dataSolicitacao", {
                  message: "Data inválida",
                });
              }}
            >
              disparar-erros-campos
            </button>
            <NovoPedidoDestinoSection
              form={form}
              tecnicos={[]}
              loadingTecnicos={false}
              clientes={clientes}
              loadingClientes={false}
              opcoesCliente={buildOpcoesClienteFromList(clientes)}
              itensMistoFields={fields}
              appendItem={append}
              removeItem={remove}
              modelosRaw={[]}
              marcas={[]}
              operadoras={[]}
              tipoDestino={tipoDestino}
              deCliente={deCliente}
              destinatarioSelecionado={null}
              cidadeDisplay={null}
              filialDisplay={null}
              marcaModeloEspecifico={marcaModeloEspecifico}
              operadoraEspecifica={operadoraEspecifica}
              itensMistoValues={itensMistoValues}
            />
          </FormProvider>
        </MemoryRouter>
      );
    }
    render(<HarnessFieldErrors />);
    await u.click(
      screen.getByRole("button", { name: "disparar-erros-campos" }),
    );
    expect(
      await screen.findByText("Informe a quantidade"),
    ).toBeInTheDocument();
    expect(screen.getByText("Data inválida")).toBeInTheDocument();
  });

  it("urgência: alteração persiste no formulário", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(<DestinoHarness formBag={bag} />);
    const urgenciaBlock = screen.getByText("Urgência").parentElement as HTMLElement;
    await u.click(within(urgenciaBlock).getByRole("combobox"));
    await u.click(screen.getByRole("option", { name: "Urgente" }));
    await waitFor(() => {
      expect(bag.current?.getValues("urgencia")).toBe("URGENTE");
    });
  });

  it("modo MISTO: remove bloco Quantidade+Unidades (quantidades ficam por linha mista)", async () => {
    const u = userEvent.setup();
    render(<DestinoHarness />);
    expect(screen.getByText("Unidades")).toBeInTheDocument();
    await u.click(
      screen.getByRole("checkbox", { name: /Pedido misto/i }),
    );
    expect(screen.queryByText("Unidades")).toBeNull();
  });

  it("loadingClientes: select de destinatário (modo Cliente) fica desabilitado", async () => {
    const u = userEvent.setup();
    render(
      <DestinoHarness loadingClientes clientesLista={clientes} />,
    );
    await u.click(screen.getByRole("button", { name: "Cliente" }));
    const destinoBlock = screen.getByText("Pesquisar Destinatário")
      .parentElement as HTMLElement;
    const combo = within(destinoBlock).getByRole("combobox");
    expect(combo).toBeDisabled();
  });
});
