import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { AbaterDividaSection } from "@/pages/aparelhos/cadastro-individual/AbaterDividaSection";
import {
  cadastroIndividualDefaultValues,
  cadastroIndividualSchema,
  type FormDataCadastroIndividual,
} from "@/pages/aparelhos/cadastro-individual/schema";
import type { DebitoRastreadorApi } from "@/pages/aparelhos/shared/debito-rastreador";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

const debito1: DebitoRastreadorApi = {
  id: 7,
  devedorTipo: "INFINITY",
  devedorClienteId: null,
  devedorCliente: null,
  credorTipo: "INFINITY",
  credorClienteId: null,
  credorCliente: null,
  marcaId: 1,
  marca: { id: 1, nome: "A" },
  modeloId: 2,
  modelo: { id: 2, nome: "B" },
  quantidade: 1,
};

function Harness({
  abaterDivida = false,
  debitos = [debito1],
}: {
  abaterDivida?: boolean;
  debitos?: DebitoRastreadorApi[];
}) {
  const form = useForm<FormDataCadastroIndividual>({
    resolver: zodResolver(
      cadastroIndividualSchema,
    ) as Resolver<FormDataCadastroIndividual>,
    defaultValues: {
      ...cadastroIndividualDefaultValues,
      abaterDivida,
      abaterDebitoId: null,
    },
  });
  return (
    <AbaterDividaSection
      form={form}
      debitosFiltrados={debitos}
      watchAbaterDivida={abaterDivida}
      selectedDebito={null}
    />
  );
}

describe("AbaterDividaSection", () => {
  it("renderiza título quando existe débito", () => {
    render(<Harness />);
    expect(screen.getByText(/Abater Dívida/i)).toBeInTheDocument();
  });

  it("não renderiza o card quando a lista de débitos é vazia", () => {
    render(<Harness debitos={[]} />);
    expect(screen.queryByText(/Abater Dívida/i)).not.toBeInTheDocument();
  });
});
