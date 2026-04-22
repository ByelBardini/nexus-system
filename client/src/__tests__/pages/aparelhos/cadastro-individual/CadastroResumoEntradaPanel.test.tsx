import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CadastroResumoEntradaPanel } from "@/pages/aparelhos/cadastro-individual/CadastroResumoEntradaPanel";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 5, 10, 12, 0, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("CadastroResumoEntradaPanel", () => {
  it("mostra badge PRONTO quando statusRevisao OK", () => {
    render(
      <CadastroResumoEntradaPanel
        statusRevisao="OK"
        watchTipo="RASTREADOR"
        watchMarca="M"
        watchModelo="X"
        watchOperadora=""
        watchIdentificador="123"
        idJaExiste={null}
        watchOrigem="DEVOLUCAO_TECNICO"
        notaFiscal=""
        watchProprietario="INFINITY"
        watchClienteId={null}
        clientes={[]}
        watchStatus="EM_MANUTENCAO"
      />,
    );
    expect(screen.getByText("PRONTO")).toBeInTheDocument();
  });

  it("mostra DUPLICADO quando id existe", () => {
    render(
      <CadastroResumoEntradaPanel
        statusRevisao="DUPLICADO"
        watchTipo="RASTREADOR"
        watchMarca="M"
        watchModelo="X"
        watchOperadora=""
        watchIdentificador="1"
        idJaExiste={{}}
        watchOrigem="DEVOLUCAO_TECNICO"
        notaFiscal=""
        watchProprietario="INFINITY"
        watchClienteId={null}
        clientes={[]}
        watchStatus="EM_MANUTENCAO"
      />,
    );
    expect(screen.getByText("DUPLICADO")).toBeInTheDocument();
  });

  it("exibe nota fiscal quando origem é compra avulsa e nota preenchida", () => {
    render(
      <CadastroResumoEntradaPanel
        statusRevisao="INCOMPLETO"
        watchTipo="RASTREADOR"
        watchMarca=""
        watchModelo=""
        watchOperadora=""
        watchIdentificador=""
        idJaExiste={null}
        watchOrigem="COMPRA_AVULSA"
        notaFiscal="NF-1"
        watchProprietario="INFINITY"
        watchClienteId={null}
        clientes={[]}
        watchStatus="NOVO_OK"
      />,
    );
    expect(screen.getByText("NF-1")).toBeInTheDocument();
  });

  it("formata vinculação de cliente com cidade/estado", () => {
    render(
      <CadastroResumoEntradaPanel
        statusRevisao="OK"
        watchTipo="RASTREADOR"
        watchMarca="M"
        watchModelo="X"
        watchOperadora=""
        watchIdentificador="1"
        idJaExiste={null}
        watchOrigem="DEVOLUCAO_TECNICO"
        notaFiscal=""
        watchProprietario="CLIENTE"
        watchClienteId={1}
        clientes={[
          { id: 1, nome: "Cli", cidade: "SP", estado: "SP" },
        ]}
        watchStatus="EM_MANUTENCAO"
      />,
    );
    expect(
      screen.getByText(/Cli \(SP - SP\)/i),
    ).toBeInTheDocument();
  });
});
