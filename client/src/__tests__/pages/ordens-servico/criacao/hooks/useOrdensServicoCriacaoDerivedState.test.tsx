import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect } from "vitest";
import {
  criacaoOsFormSchema,
  criacaoOsDefaultValues,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";
import { useOrdensServicoCriacaoDerivedState } from "@/pages/ordens-servico/criacao/hooks/useOrdensServicoCriacaoDerivedState";

const filledDefaults = {
  ...criacaoOsDefaultValues,
  ordemInstalacao: "INFINITY" as const,
  tipo: "REVISAO",
  subclienteTelefone: "11999999999",
  subclienteNome: "N",
  subclienteCep: "0",
  subclienteLogradouro: "L",
  subclienteNumero: "1",
  subclienteBairro: "B",
  subclienteEstado: "SP",
  subclienteCidade: "C",
};

function FormThenDerived({ cid }: { cid: number | null }) {
  const form = useForm({
    resolver: zodResolver(criacaoOsFormSchema),
    defaultValues: filledDefaults,
  });
  const d = useOrdensServicoCriacaoDerivedState(form.control, cid);
  return (
    <div>
      <span data-testid="valid">{d.isFormValid ? "1" : "0"}</span>
      <span data-testid="tcliente">{d.temCliente ? "1" : "0"}</span>
    </div>
  );
}

describe("useOrdensServicoCriacaoDerivedState (integrado ao FormProvider)", () => {
  it("isFormValid true com Infinity e clienteId carregado", () => {
    render(
      <FormThenDerived cid={1} />,
    );
    expect(screen.getByTestId("valid")).toHaveTextContent("1");
    expect(screen.getByTestId("tcliente")).toHaveTextContent("1");
  });

  it("isFormValid false se cliente Infinity ausente", () => {
    render(<FormThenDerived cid={null} />);
    expect(screen.getByTestId("valid")).toHaveTextContent("0");
  });
});
