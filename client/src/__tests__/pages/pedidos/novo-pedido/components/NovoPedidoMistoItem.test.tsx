import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { describe, it, expect, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getDefaultNovoPedidoRastreadorFormValues } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import type { FormNovoPedido } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import { NovoPedidoMistoItem } from "@/pages/pedidos/novo-pedido/components/NovoPedidoMistoItem";
import type { ClienteComSubclientes } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.utils";

const clientes: ClienteComSubclientes[] = [
  { id: 1, nome: "Cliente Um", subclientes: [] },
  { id: 2, nome: "Cliente Dois", subclientes: [] },
];

type MistoHarnessProps = {
  itensMisto: NonNullable<FormNovoPedido["itensMisto"]>;
  marcaModeloEspecifico?: boolean;
  operadoraEspecifica?: boolean;
  index?: number;
  formBag?: { current: UseFormReturn<FormNovoPedido> | null };
  removeItemSpy?: (index: number) => void;
};

function MistoItemHarness({
  itensMisto,
  marcaModeloEspecifico = false,
  operadoraEspecifica = false,
  index = 0,
  formBag,
  removeItemSpy,
}: MistoHarnessProps) {
  const def: FormNovoPedido = {
    ...getDefaultNovoPedidoRastreadorFormValues("2026-01-01"),
    tipoDestino: "MISTO",
    itensMisto,
  };
  const form = useForm<FormNovoPedido>({ defaultValues: def });
  if (formBag) {
    formBag.current = form;
  }
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "itensMisto",
  });
  const removeItem =
    removeItemSpy ??
    ((i: number) => {
      remove(i);
    });
  const field = fields[index];
  if (!field) return null;

  return (
    <FormProvider {...form}>
      <NovoPedidoMistoItem
        control={form.control}
        setValue={form.setValue}
        field={field}
        index={index}
        removeItem={removeItem}
        itensMistoFieldsLength={fields.length}
        modelosRaw={[
          { id: 10, nome: "Mod Marca1", marcaId: 1 },
          { id: 11, nome: "Mod Marca2", marcaId: 2 },
        ]}
        marcas={[
          { id: 1, nome: "Marca Um" },
          { id: 2, nome: "Marca Dois" },
        ]}
        operadoras={[{ id: 5, nome: "Operadora X" }]}
        clientes={clientes}
        loadingClientes={false}
        itensMistoValues={form.watch("itensMisto")}
        marcaModeloEspecifico={marcaModeloEspecifico}
        operadoraEspecifica={operadoraEspecifica}
      />
    </FormProvider>
  );
}

function DoisItensHarness({
  formBag,
  removeSpy,
}: {
  formBag?: { current: UseFormReturn<FormNovoPedido> | null };
  removeSpy?: ReturnType<typeof vi.fn>;
}) {
  const def: FormNovoPedido = {
    ...getDefaultNovoPedidoRastreadorFormValues("2026-01-01"),
    tipoDestino: "MISTO",
    itensMisto: [
      { proprietario: "INFINITY", quantidade: 1 },
      { proprietario: "CLIENTE", quantidade: 1, clienteId: 1 },
    ],
  };
  const form = useForm<FormNovoPedido>({ defaultValues: def });
  if (formBag) {
    formBag.current = form;
  }
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "itensMisto",
  });
  const removeItem = (i: number) => {
    removeSpy?.(i);
    remove(i);
  };
  return (
    <FormProvider {...form}>
      {fields.map((f, i) => (
        <NovoPedidoMistoItem
          key={f.id}
          control={form.control}
          setValue={form.setValue}
          field={f}
          index={i}
          removeItem={removeItem}
          itensMistoFieldsLength={fields.length}
          modelosRaw={[{ id: 10, nome: "Mod A", marcaId: 1 }]}
          marcas={[{ id: 1, nome: "M1" }]}
          operadoras={[{ id: 5, nome: "Op" }]}
          clientes={clientes}
          loadingClientes={false}
          itensMistoValues={form.watch("itensMisto")}
          marcaModeloEspecifico={false}
          operadoraEspecifica={false}
        />
      ))}
    </FormProvider>
  );
}

function DoisClientesHarness() {
  const def: FormNovoPedido = {
    ...getDefaultNovoPedidoRastreadorFormValues("2026-01-01"),
    tipoDestino: "MISTO",
    itensMisto: [
      { proprietario: "CLIENTE", quantidade: 1, clienteId: 1 },
      { proprietario: "CLIENTE", quantidade: 1 },
    ],
  };
  const form = useForm<FormNovoPedido>({ defaultValues: def });
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "itensMisto",
  });
  return (
    <FormProvider {...form}>
      {fields.map((f, i) => (
        <NovoPedidoMistoItem
          key={f.id}
          control={form.control}
          setValue={form.setValue}
          field={f}
          index={i}
          removeItem={remove}
          itensMistoFieldsLength={fields.length}
          modelosRaw={[]}
          marcas={[]}
          operadoras={[]}
          clientes={clientes}
          loadingClientes={false}
          itensMistoValues={form.watch("itensMisto")}
          marcaModeloEspecifico={false}
          operadoraEspecifica={false}
        />
      ))}
    </FormProvider>
  );
}

describe("NovoPedidoMistoItem", () => {
  it("com um único item, remover está desabilitado (não chama removeItem)", async () => {
    const removeSpy = vi.fn();
    const u = userEvent.setup();
    render(
      <MistoItemHarness
        itensMisto={[{ proprietario: "INFINITY", quantidade: 1 }]}
        removeItemSpy={removeSpy}
      />,
    );
    const removeBtn = screen.getByRole("button", { name: "Remover item" });
    expect(removeBtn).toBeDisabled();
    await u.click(removeBtn);
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("troca proprietário persiste em itensMisto (CLIENTE ↔ INFINITY)", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <MistoItemHarness
        formBag={bag}
        itensMisto={[{ proprietario: "INFINITY", quantidade: 1 }]}
      />,
    );
    await u.click(screen.getByRole("button", { name: "Cliente" }));
    await waitFor(() => {
      expect(bag.current?.getValues("itensMisto.0.proprietario")).toBe(
        "CLIENTE",
      );
    });
    await u.click(screen.getByRole("button", { name: "Infinity" }));
    await waitFor(() => {
      expect(bag.current?.getValues("itensMisto.0.proprietario")).toBe(
        "INFINITY",
      );
    });
  });

  it("com outro item INFINITY, botão Infinity fica desabilitado (único dono Infinity por pedido)", () => {
    render(
      <MistoItemHarness
        itensMisto={[
          { proprietario: "INFINITY", quantidade: 1 },
          { proprietario: "CLIENTE", quantidade: 1, clienteId: 1 },
        ]}
        index={1}
      />,
    );
    expect(screen.getByRole("button", { name: "Infinity" })).toBeDisabled();
  });

  it("fluxo Cliente: selecionar opção grava clienteId no formulário", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <MistoItemHarness
        formBag={bag}
        itensMisto={[{ proprietario: "CLIENTE", quantidade: 1 }]}
      />,
    );
    const card = document.querySelector("[data-misto-item]") as HTMLElement;
    await u.click(within(card).getByRole("combobox"));
    await u.click(screen.getByRole("option", { name: "Cliente Um" }));
    await waitFor(() => {
      expect(bag.current?.getValues("itensMisto.0.clienteId")).toBe(1);
    });
  });

  it("dois itens CLIENTE: segundo select exclui clienteId já alocado na outra linha", async () => {
    const u = userEvent.setup();
    render(<DoisClientesHarness />);
    const rows = document.querySelectorAll("[data-misto-item]");
    const second = rows[1] as HTMLElement;
    await u.click(within(second).getByRole("combobox"));
    expect(
      screen.queryByRole("option", { name: "Cliente Um" }),
    ).toBeNull();
    expect(
      screen.getByRole("option", { name: "Cliente Dois" }),
    ).toBeInTheDocument();
  });

  it("quantidade da linha: valor válido persiste; lixo e zero viram 1 no estado", () => {
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <MistoItemHarness
        formBag={bag}
        itensMisto={[{ proprietario: "INFINITY", quantidade: 1 }]}
      />,
    );
    const qty = screen.getByRole("spinbutton");
    fireEvent.change(qty, { target: { value: "8" } });
    expect(bag.current?.getValues("itensMisto.0.quantidade")).toBe(8);
    fireEvent.change(qty, { target: { value: "0" } });
    expect(bag.current?.getValues("itensMisto.0.quantidade")).toBe(1);
    fireEvent.change(qty, { target: { value: "nope" } });
    expect(bag.current?.getValues("itensMisto.0.quantidade")).toBe(1);
  });

  it("marca/modelo herdado do pedido: não exibe toggles editáveis de marca/modelo", () => {
    render(
      <MistoItemHarness
        itensMisto={[{ proprietario: "INFINITY", quantidade: 1 }]}
        marcaModeloEspecifico
      />,
    );
    expect(
      screen.getByText("Marca/modelo do pedido aplicado"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Marca/modelo específico"),
    ).toBeNull();
  });

  it("trocar marca zera modelo já escolhido (evita modelo incompatível com a marca)", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <MistoItemHarness
        formBag={bag}
        itensMisto={[
          {
            proprietario: "INFINITY",
            quantidade: 1,
            marcaModeloEspecifico: true,
            marcaEquipamentoId: 1,
            modeloEquipamentoId: 10,
          },
        ]}
      />,
    );
    const [marcaCombo] = screen.getAllByRole("combobox");
    await u.click(marcaCombo);
    await u.click(screen.getByRole("option", { name: "Marca Dois" }));
    await waitFor(() => {
      expect(bag.current?.getValues("itensMisto.0.marcaEquipamentoId")).toBe(
        2,
      );
      expect(
        bag.current?.getValues("itensMisto.0.modeloEquipamentoId"),
      ).toBeUndefined();
    });
  });

  it("marca/modelo: filtra modelos pela marca e remove selects ao desmarcar", async () => {
    const u = userEvent.setup();
    render(
      <MistoItemHarness
        itensMisto={[{ proprietario: "INFINITY", quantidade: 1 }]}
      />,
    );
    const marcaCb = screen.getAllByRole("checkbox")[0];
    await u.click(marcaCb);
    const [marcaCombo, modeloCombo] = screen.getAllByRole("combobox");
    await u.click(marcaCombo);
    await u.click(screen.getByRole("option", { name: "Marca Dois" }));
    await u.click(modeloCombo);
    expect(
      screen.getByRole("option", { name: "Mod Marca2" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Mod Marca1" }),
    ).toBeNull();
    await u.click(screen.getByRole("option", { name: "Mod Marca2" }));
    await u.click(marcaCb);
    const card = document.querySelector(
      "[data-misto-item]",
    ) as HTMLElement | null;
    expect(card).not.toBeNull();
    expect(within(card!).queryAllByRole("combobox").length).toBe(0);
  });

  it("operadora herdada do pedido: não exibe toggle editável", () => {
    render(
      <MistoItemHarness
        itensMisto={[{ proprietario: "INFINITY", quantidade: 1 }]}
        operadoraEspecifica
      />,
    );
    expect(
      screen.getByText("Operadora do pedido aplicada"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Operadora específica")).toBeNull();
  });

  it("operadora específica: escolha grava operadoraId; desmarcar zera id e flag", async () => {
    const u = userEvent.setup();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(
      <MistoItemHarness
        formBag={bag}
        itensMisto={[{ proprietario: "INFINITY", quantidade: 1 }]}
      />,
    );
    const opCheck = screen.getAllByRole("checkbox")[1];
    await u.click(opCheck);
    const opCombo = screen.getByRole("combobox");
    await u.click(opCombo);
    await u.click(screen.getByRole("option", { name: "Operadora X" }));
    await waitFor(() => {
      expect(bag.current?.getValues("itensMisto.0.operadoraId")).toBe(5);
      expect(bag.current?.getValues("itensMisto.0.operadoraEspecifica")).toBe(
        true,
      );
    });
    await u.click(opCheck);
    await waitFor(() => {
      expect(bag.current?.getValues("itensMisto.0.operadoraId")).toBeUndefined();
      expect(bag.current?.getValues("itensMisto.0.operadoraEspecifica")).toBe(
        false,
      );
    });
  });

  it("remove com dois itens: delega índice correto e atualiza o array", async () => {
    const u = userEvent.setup();
    const removeSpy = vi.fn();
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    render(<DoisItensHarness formBag={bag} removeSpy={removeSpy} />);
    const removeBtns = screen.getAllByRole("button", { name: "Remover item" });
    expect(removeBtns[0]).not.toBeDisabled();
    await u.click(removeBtns[0]);
    expect(removeSpy).toHaveBeenCalledWith(0);
    await waitFor(() => {
      expect(bag.current?.getValues("itensMisto")).toHaveLength(1);
      expect(bag.current?.getValues("itensMisto.0.proprietario")).toBe(
        "CLIENTE",
      );
    });
  });

  it("loadingClientes: select de cliente desabilitado na linha CLIENTE", () => {
    const bag: { current: UseFormReturn<FormNovoPedido> | null } = {
      current: null,
    };
    function LoadingHarness() {
      const def: FormNovoPedido = {
        ...getDefaultNovoPedidoRastreadorFormValues("2026-01-01"),
        tipoDestino: "MISTO",
        itensMisto: [{ proprietario: "CLIENTE", quantidade: 1 }],
      };
      const form = useForm<FormNovoPedido>({ defaultValues: def });
      bag.current = form;
      const { fields, remove } = useFieldArray({
        control: form.control,
        name: "itensMisto",
      });
      const f0 = fields[0];
      if (!f0) return null;
      return (
        <FormProvider {...form}>
          <NovoPedidoMistoItem
            control={form.control}
            setValue={form.setValue}
            field={f0}
            index={0}
            removeItem={remove}
            itensMistoFieldsLength={fields.length}
            modelosRaw={[]}
            marcas={[]}
            operadoras={[]}
            clientes={clientes}
            loadingClientes
            itensMistoValues={form.watch("itensMisto")}
            marcaModeloEspecifico={false}
            operadoraEspecifica={false}
          />
        </FormProvider>
      );
    }
    render(<LoadingHarness />);
    const card = document.querySelector("[data-misto-item]") as HTMLElement;
    expect(within(card).getByRole("combobox")).toBeDisabled();
  });
});
