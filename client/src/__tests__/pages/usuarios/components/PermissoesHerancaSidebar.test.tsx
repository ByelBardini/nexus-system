import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PermissoesHerancaSidebar } from "@/pages/usuarios/components/PermissoesHerancaSidebar";

describe("PermissoesHerancaSidebar", () => {
  it("vazio: pede para selecionar e mostra check verde de exclusão", () => {
    render(
      <PermissoesHerancaSidebar
        setoresHabilitados={[]}
        acoesAltoRisco={[]}
        accessScore={0}
      />,
    );
    expect(
      screen.getByText(/selecione cargos para ver as permissões/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nenhuma permissão de exclusão/i),
    ).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("lista setores, rótulos e ações de alto risco", () => {
    render(
      <PermissoesHerancaSidebar
        setoresHabilitados={[
          {
            modulo: "AGENDAMENTO.OS",
            acoes: ["LISTAR", "EXCLUIR"],
          },
        ]}
        acoesAltoRisco={[
          { modulo: "AGENDAMENTO.OS", permissao: "AGENDAMENTO.OS.EXCLUIR" },
        ]}
        accessScore={75}
      />,
    );
    expect(
      screen.getByText("Ordens de Serviço"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/visualizar, excluir/i),
    ).toBeInTheDocument();
    const warnBlock = screen.getByText(
      /excluir ordens de serviço/i,
    ).closest("div");
    expect(
      within(warnBlock?.parentElement ?? document.body).getByText(
        /acesso via cargos selecionados/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});
