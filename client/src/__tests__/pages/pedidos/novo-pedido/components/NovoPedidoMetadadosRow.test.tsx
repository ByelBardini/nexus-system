import { useForm, FormProvider } from "react-hook-form";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { getDefaultNovoPedidoRastreadorFormValues } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import type { FormNovoPedido } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import { NovoPedidoMetadadosRow } from "@/pages/pedidos/novo-pedido/components/NovoPedidoMetadadosRow";

function Wrap() {
  const form = useForm<FormNovoPedido>({
    defaultValues: getDefaultNovoPedidoRastreadorFormValues("2026-02-20"),
  });
  return (
    <FormProvider {...form}>
      <NovoPedidoMetadadosRow control={form.control} nomeUsuario="Maria" />
    </FormProvider>
  );
}

describe("NovoPedidoMetadadosRow", () => {
  it("exibe o criador, número futuro e campo de data", () => {
    render(<Wrap />);
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("Será gerado")).toBeInTheDocument();
  });
});
