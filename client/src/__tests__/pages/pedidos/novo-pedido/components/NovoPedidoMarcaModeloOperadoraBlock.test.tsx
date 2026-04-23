import { useForm, FormProvider } from "react-hook-form";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getDefaultNovoPedidoRastreadorFormValues } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import type { FormNovoPedido } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import { NovoPedidoMarcaModeloOperadoraBlock } from "@/pages/pedidos/novo-pedido/components/NovoPedidoMarcaModeloOperadoraBlock";

function Wrap() {
  const form = useForm<FormNovoPedido>({
    defaultValues: {
      ...getDefaultNovoPedidoRastreadorFormValues("2026-03-01"),
    },
  });
  return (
    <FormProvider {...form}>
      <NovoPedidoMarcaModeloOperadoraBlock
        control={form.control}
        setValue={form.setValue}
        marcaModeloEspecifico={form.watch("marcaModeloEspecifico")}
        operadoraEspecifica={form.watch("operadoraEspecifica")}
        marcaEquipamentoId={form.watch("marcaEquipamentoId")}
        marcas={[{ id: 1, nome: "Mar" }]}
        modelosFiltrados={[
          { id: 2, nome: "ModA", marcaId: 1 },
        ]}
        operadoras={[{ id: 3, nome: "Op" }]}
      />
    </FormProvider>
  );
}

describe("NovoPedidoMarcaModeloOperadoraBlock", () => {
  it("exibe seção após ativar checkboxes (fluxo: marca+modelo+operadora)", async () => {
    const u = userEvent.setup();
    render(<Wrap />);
    expect(screen.queryByText("Marca")).toBeNull();
    await u.click(
      screen.getByRole("checkbox", { name: /Marca\/modelo específico/i }),
    );
    expect(await screen.findByText("Marca")).toBeInTheDocument();
    expect(screen.getByText("Modelo")).toBeInTheDocument();
    await u.click(
      screen.getByRole("checkbox", { name: /Operadora específica/i }),
    );
    expect(await screen.findByText("Operadora")).toBeInTheDocument();
  });
});
