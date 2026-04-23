import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { getDefaultNovoPedidoRastreadorFormValues } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import type { FormNovoPedido } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import { NovoPedidoMistoItem } from "@/pages/pedidos/novo-pedido/components/NovoPedidoMistoItem";

function MistoItemHarness() {
  const def = {
    ...getDefaultNovoPedidoRastreadorFormValues("2026-01-01"),
    tipoDestino: "MISTO" as const,
    itensMisto: [
      { proprietario: "INFINITY" as const, quantidade: 1 },
    ],
  };
  const form = useForm<FormNovoPedido>({ defaultValues: def });
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "itensMisto",
  });
  return (
    <FormProvider {...form}>
      {fields[0] && (
        <NovoPedidoMistoItem
          control={form.control}
          setValue={form.setValue}
          field={fields[0]}
          index={0}
          removeItem={remove}
          itensMistoFieldsLength={fields.length}
          modelosRaw={[]}
          marcas={[]}
          operadoras={[]}
          clientes={[]}
          loadingClientes={false}
          itensMistoValues={form.watch("itensMisto")}
          marcaModeloEspecifico={false}
          operadoraEspecifica={false}
        />
      )}
    </FormProvider>
  );
}

describe("NovoPedidoMistoItem", () => {
  it("exibe ações Infinity e Cliente; remove desabilitado com um único item (edge)", () => {
    render(<MistoItemHarness />);
    expect(
      screen.getByRole("button", { name: "Infinity" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cliente" }),
    ).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: "Remover item" });
    expect(removeBtn).toBeDisabled();
  });
});
