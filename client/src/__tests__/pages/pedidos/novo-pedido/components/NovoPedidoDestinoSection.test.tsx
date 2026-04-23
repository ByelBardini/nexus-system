import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getDefaultNovoPedidoRastreadorFormValues } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import type { FormNovoPedido } from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.schema";
import {
  buildOpcoesClienteFromList,
  type ClienteComSubclientes,
} from "@/pages/pedidos/novo-pedido/novo-pedido-rastreador.utils";
import { NovoPedidoDestinoSection } from "@/pages/pedidos/novo-pedido/components/NovoPedidoDestinoSection";

function DestinoWrap() {
  const form = useForm<FormNovoPedido>({
    defaultValues: {
      ...getDefaultNovoPedidoRastreadorFormValues("2026-01-20"),
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itensMisto",
  });
  const clientes: ClienteComSubclientes[] = [
    { id: 1, nome: "C1", subclientes: [] },
  ];
  const op = buildOpcoesClienteFromList(clientes);
  return (
    <MemoryRouter>
      <FormProvider {...form}>
        <NovoPedidoDestinoSection
          form={form}
          tecnicos={[]}
          loadingTecnicos={false}
          clientes={clientes}
          loadingClientes={false}
          opcoesCliente={op}
          itensMistoFields={fields}
          appendItem={append}
          removeItem={remove}
          modelosRaw={[]}
          marcas={[]}
          operadoras={[]}
          tipoDestino="TECNICO"
          deCliente={false}
          destinatarioSelecionado={null}
          cidadeDisplay={null}
          filialDisplay={null}
          marcaModeloEspecifico={false}
          operadoraEspecifica={false}
          itensMistoValues={form.watch("itensMisto")}
        />
      </FormProvider>
    </MemoryRouter>
  );
}

describe("NovoPedidoDestinoSection", () => {
  it("fumaça: título, alternância Técnico/Cliente e busca de destinatário", () => {
    render(<DestinoWrap />);
    expect(screen.getByText("Informações de Destino")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Técnico" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cliente" })).toBeInTheDocument();
    expect(screen.getByText("Pesquisar Destinatário")).toBeInTheDocument();
  });
});
