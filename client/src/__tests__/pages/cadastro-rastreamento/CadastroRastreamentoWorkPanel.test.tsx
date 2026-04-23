import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadastroRastreamentoWorkPanel } from "@/pages/cadastro-rastreamento/components/CadastroRastreamentoWorkPanel";
import type { OrdemCadastro } from "@/types/cadastro-rastreamento";
import { mapCadastroRastreamentoOS } from "@/lib/cadastro-rastreamento-mapper";
import { osRespostaBase } from "./cadastro-rastreamento.fixtures";
import { getAuxilioCopiaItens } from "@/lib/cadastro-rastreamento-copy";
import { PLATAFORMA_RAST_LABEL } from "@/lib/cadastro-rastreamento-ui";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

const osPadrao = osRespostaBase;

function renderComOrdem(
  o: OrdemCadastro,
  options: {
    plataforma?: "GETRAK" | "GEOMAPS" | "SELSYN";
    isMutating?: boolean;
  } = {},
) {
  const {
    plataforma = "GETRAK",
    isMutating = false,
  } = options;
  const setPlataforma = vi.fn();
  const handleAvancarStatus = vi.fn();
  const copiar = vi.fn();
  const copiarTodos = vi.fn();
  const r = render(
    <CadastroRastreamentoWorkPanel
      selectedOrdem={o}
      plataforma={plataforma}
      setPlataforma={setPlataforma}
      isMutating={isMutating}
      handleAvancarStatus={handleAvancarStatus}
      copiar={copiar}
      copiarTodos={copiarTodos}
      auxilioCopiaItens={getAuxilioCopiaItens(o)}
    />,
  );
  return {
    ...r,
    setPlataforma,
    handleAvancarStatus,
    copiar,
    copiarTodos,
  };
}

describe("CadastroRastreamentoWorkPanel", () => {
  it("sem ordem: mostra o empty state, badge da OS inexistente e o painel de detalhes colapsado", () => {
    render(
      <CadastroRastreamentoWorkPanel
        selectedOrdem={null}
        plataforma="GETRAK"
        setPlataforma={vi.fn()}
        isMutating={false}
        handleAvancarStatus={vi.fn()}
        copiar={vi.fn()}
        copiarTodos={vi.fn()}
        auxilioCopiaItens={[]}
      />,
    );
    expect(screen.getByText(/selecione uma os/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Dados da Ordem" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/#/),
    ).not.toBeInTheDocument();
  });

  it("cabeçalho com ordem: exibe OS #id (regressão: id visível com status)", () => {
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      id: 9001,
      statusCadastro: "AGUARDANDO",
    });
    renderComOrdem(o);
    expect(
      screen.getByText(new RegExp(`#${o.id}`, "i")),
    ).toBeInTheDocument();
  });

  it("REVISAO + AGUARDANDO: rótulo do botão reflete o tipo; aciona a mutação e não o copiar", async () => {
    const user = userEvent.setup();
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      tipo: "REVISAO",
      statusCadastro: "AGUARDANDO",
    });
    const { handleAvancarStatus, copiar, copiarTodos } = renderComOrdem(o);
    const btn = screen.getByRole("button", { name: /iniciar revisão/i });
    await user.click(btn);
    expect(handleAvancarStatus).toHaveBeenCalledTimes(1);
    expect(copiar).not.toHaveBeenCalled();
    expect(copiarTodos).not.toHaveBeenCalled();
  });

  it("AGUARDANDO + isMutating: início bloqueado (evita clique duplo na API)", () => {
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      statusCadastro: "AGUARDANDO",
    });
    const { handleAvancarStatus } = renderComOrdem(o, { isMutating: true });
    const btn = screen.getByRole("button", { name: /iniciar revisão/i });
    expect(btn).toBeDisabled();
    expect(handleAvancarStatus).not.toHaveBeenCalled();
  });

  it("tipo desconhecido (API) vira OUTRO: botão inicia com cópia de rotulo genérico", async () => {
    const user = userEvent.setup();
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      tipo: "ALGO_QUE_NAO_ESTA_NO_MAPA",
      statusCadastro: "AGUARDANDO",
    });
    expect(o.tipoRegistro).toBe("OUTRO");
    const { handleAvancarStatus } = renderComOrdem(o);
    await user.click(
      screen.getByRole("button", { name: /iniciar registro/i }),
    );
    expect(handleAvancarStatus).toHaveBeenCalledTimes(1);
  });

  it("RETIRADA: exige aparelho de saída, não bloco de entrada (regra de negócio de estoque)", () => {
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      tipo: "RETIRADA",
      statusCadastro: "AGUARDANDO",
    });
    expect(o.imei).toBeNull();
    expect(o.imeiSaida).toBe(osPadrao.idAparelho);
    renderComOrdem(o);
    expect(
      screen.queryByRole("heading", { name: "Aparelho de Entrada" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Aparelho de Saída" }),
    ).toBeInTheDocument();
  });

  it("EM_CADASTRO: botão concluir desabilita durante isMutating", () => {
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      statusCadastro: "EM_CADASTRO",
    });
    renderComOrdem(o, { isMutating: true });
    const btn = screen.getByRole("button", { name: /concluir revisão/i });
    expect(btn).toBeDisabled();
  });

  it("EM_CADASTRO: copiar chama (valor, label) e copiar todos recebe a ordem atual; duplicar clique reflete 2 chamadas", async () => {
    const user = userEvent.setup();
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      statusCadastro: "EM_CADASTRO",
    });
    const itens = getAuxilioCopiaItens(o);
    const ultimo = itens.at(-1);
    if (!itens[0] || !ultimo) {
      throw new Error("fixture de auxílio vazio demais");
    }
    const { copiar, copiarTodos } = renderComOrdem(o);
    const primeiroBotao = screen.getByRole("button", {
      name: itens[0].label,
    });
    await user.click(primeiroBotao);
    expect(copiar).toHaveBeenCalledWith(itens[0].value, itens[0].label);
    const ultimoBotao = screen.getByRole("button", { name: ultimo.label });
    expect(ultimoBotao).not.toBe(primeiroBotao);
    await user.click(ultimoBotao);
    expect(copiar).toHaveBeenLastCalledWith(ultimo.value, ultimo.label);
    await user.click(
      screen.getByRole("button", { name: /copiar todos os dados principais/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /copiar todos os dados principais/i }),
    );
    expect(copiarTodos).toHaveBeenCalledTimes(2);
    expect(copiarTodos).toHaveBeenCalledWith(o);
  });

  it("EM_CADASTRO: select de plataforma propaga Getrak / Geomaps / Selsyn", async () => {
    const user = userEvent.setup();
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      statusCadastro: "EM_CADASTRO",
    });
    const { setPlataforma, rerender } = renderComOrdem(o, {
      plataforma: "GETRAK",
    });
    const combo = screen.getByRole("combobox");
    await user.click(combo);
    await user.click(screen.getByRole("option", { name: "Selsyn" }));
    expect(setPlataforma).toHaveBeenLastCalledWith("SELSYN");
    setPlataforma.mockClear();
    rerender(
      <CadastroRastreamentoWorkPanel
        selectedOrdem={o}
        plataforma="SELSYN"
        setPlataforma={setPlataforma}
        isMutating={false}
        handleAvancarStatus={vi.fn()}
        copiar={vi.fn()}
        copiarTodos={vi.fn()}
        auxilioCopiaItens={getAuxilioCopiaItens(o)}
      />,
    );
    const combo2 = screen.getByRole("combobox");
    expect(combo2).toHaveTextContent("Selsyn");
  });

  it("CONCLUIDO: botão de estado desabilitado e sem nova mutação (resumo final)", () => {
    const o: OrdemCadastro = {
      ...mapCadastroRastreamentoOS({
        ...osPadrao,
        statusCadastro: "CONCLUIDO",
        plataforma: "GETRAK",
        concluidoEm: "2024-01-01T10:00:00.000Z",
      }),
    };
    const { handleAvancarStatus } = renderComOrdem(o);
    const btn = screen.getByRole("button", { name: /revisão concluída/i });
    expect(btn).toBeDisabled();
    expect(handleAvancarStatus).not.toHaveBeenCalled();
  });

  it("CONCLUIDO sem plataforma no payload: não exibe rótulo de nenhuma plataforma (bloco read-only condicional)", () => {
    const o: OrdemCadastro = {
      ...mapCadastroRastreamentoOS({
        ...osPadrao,
        statusCadastro: "CONCLUIDO",
        plataforma: null,
        concluidoEm: "2024-01-01T10:00:00.000Z",
      }),
    };
    renderComOrdem(o);
    expect(
      screen.queryByText(PLATAFORMA_RAST_LABEL.GETRAK),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(PLATAFORMA_RAST_LABEL.GEOMAPS),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(PLATAFORMA_RAST_LABEL.SELSYN),
    ).not.toBeInTheDocument();
  });

  it("CONCLUIDO com plataforma: exibe rótulo amigável (mapa plataforma → label)", () => {
    const o: OrdemCadastro = {
      ...mapCadastroRastreamentoOS({
        ...osPadrao,
        statusCadastro: "CONCLUIDO",
        plataforma: "GEOMAPS",
        concluidoEm: "2024-01-01T10:00:00.000Z",
      }),
    };
    renderComOrdem(o);
    expect(
      screen.getByText(PLATAFORMA_RAST_LABEL.GEOMAPS),
    ).toBeInTheDocument();
  });

  it("subcliente ausente: painel exibe tracinho em Dados da Ordem (não vazio silencioso)", () => {
    const o = mapCadastroRastreamentoOS({
      ...osPadrao,
      subcliente: null,
      statusCadastro: "AGUARDANDO",
    });
    expect(o.subcliente).toBeNull();
    renderComOrdem(o);
    const bloco = screen.getByRole("heading", { name: "Dados da Ordem" });
    const painel = bloco
      .closest("div")
      ?.querySelector("div.bg-slate-50");
    if (!painel) throw new Error("conteúdo do painel não encontrado");
    const rótulo = within(painel as HTMLElement).getByText("Subcliente");
    expect(
      (rótulo.nextElementSibling as HTMLElement | null)?.textContent,
    ).toBe("—");
  });
});
