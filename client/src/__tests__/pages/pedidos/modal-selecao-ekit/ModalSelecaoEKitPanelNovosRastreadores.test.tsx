import { useRef, useState, type ComponentProps } from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ModalSelecaoEKitPanelNovosRastreadores } from "@/pages/pedidos/modal-selecao-ekit/components/ModalSelecaoEKitPanelNovosRastreadores";
import type { ModalSelecaoEKitPanelNovosRastreadoresProps } from "@/pages/pedidos/modal-selecao-ekit/components/ModalSelecaoEKitPanelNovosRastreadores";
import type {
  AparelhosDestinatariosResponse,
  PedidoRastreadorApi,
} from "@/types/pedidos-rastreador";
import { SearchableSelect as SearchableSelectUnderTest } from "@/components/SearchableSelect";
import {
  buildAparelhoNoKit,
  buildPedidoApiMisto,
  buildPedidoView,
} from "./modal-selecao-ekit.fixtures";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

/**
 * Mantém o SearchableSelect real (opções, labels, portal) e expõe só o ramo
 * `onChange("")` do painel, que o componente de produção não dispara pela UI.
 */
vi.mock("@/components/SearchableSelect", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/components/SearchableSelect")>();
  const Actual = mod.SearchableSelect;
  return {
    SearchableSelect: (props: ComponentProps<typeof Actual>) => (
      <div data-testid="searchable-select-wrap">
        <Actual {...props} />
        <button
          type="button"
          aria-label="Limpar destino do lote (teste)"
          onClick={() => props.onChange("")}
        />
      </div>
    ),
  };
});

type BaseOverrides = Partial<ModalSelecaoEKitPanelNovosRastreadoresProps>;

function baseProps(): BaseOverrides & {
  setDestinatarioLote: ReturnType<typeof vi.fn>;
  setShowAllClientes: ReturnType<typeof vi.fn>;
  setBuscaAparelho: ReturnType<typeof vi.fn>;
  setFiltroMarcaModelo: ReturnType<typeof vi.fn>;
  setFiltroOperadora: ReturnType<typeof vi.fn>;
  setFiltroCliente: ReturnType<typeof vi.fn>;
  onAdicionarSelecionados: ReturnType<typeof vi.fn>;
} {
  return {
    pedido: null,
    pedidoApi: null,
    isMisto: false,
    destinatariosData: undefined,
    destinatarioLote: null,
    setDestinatarioLote: vi.fn(),
    showAllClientes: false,
    setShowAllClientes: vi.fn(),
    buscaAparelho: "",
    setBuscaAparelho: vi.fn(),
    filtroMarcaModelo: "",
    setFiltroMarcaModelo: vi.fn(),
    filtroOperadora: "",
    setFiltroOperadora: vi.fn(),
    filtroCliente: "",
    setFiltroCliente: vi.fn(),
    opcoesMarcaModelo: ["MarcaA"],
    opcoesOperadora: ["Vivo"],
    opcoesCliente: ["CliA"],
    aparelhosFiltrados: [],
    onAdicionarSelecionados: vi.fn(),
  };
}

/** Evita novos vi.fn() a cada render (identidades estáveis dentro do mesmo mount). */
function PanelWithSelecao(
  extra: BaseOverrides & { initialSelecionados?: Set<number> },
) {
  const { initialSelecionados = new Set<number>(), ...rest } = extra;
  const baseRef = useRef<ReturnType<typeof baseProps> | null>(null);
  if (baseRef.current === null) {
    baseRef.current = baseProps();
  }
  const [aparelhosSelecionados, setAparelhosSelecionados] =
    useState<Set<number>>(initialSelecionados);
  return (
    <ModalSelecaoEKitPanelNovosRastreadores
      {...baseRef.current!}
      aparelhosSelecionados={aparelhosSelecionados}
      setAparelhosSelecionados={setAparelhosSelecionados}
      {...rest}
    />
  );
}

/** Painel misto com estado local de destinatarioLote (espelha uso real com estado no hook pai). */
function PanelMistoComEstadoDestino(
  extra: BaseOverrides & { initialSelecionados?: Set<number> },
) {
  const { initialSelecionados = new Set<number>(), ...rest } = extra;
  const baseRef = useRef<ReturnType<typeof baseProps> | null>(null);
  if (baseRef.current === null) {
    baseRef.current = baseProps();
  }
  const [aparelhosSelecionados, setAparelhosSelecionados] =
    useState<Set<number>>(initialSelecionados);
  const [destinatarioLote, setDestinatarioLote] =
    useState<ModalSelecaoEKitPanelNovosRastreadoresProps["destinatarioLote"]>(
      null,
    );
  return (
    <ModalSelecaoEKitPanelNovosRastreadores
      {...baseRef.current!}
      isMisto
      destinatarioLote={destinatarioLote}
      setDestinatarioLote={setDestinatarioLote}
      aparelhosSelecionados={aparelhosSelecionados}
      setAparelhosSelecionados={setAparelhosSelecionados}
      {...rest}
    />
  );
}

function renderPanel(
  override: BaseOverrides & {
    aparelhosSelecionados?: Set<number>;
    setAparelhosSelecionados?: ModalSelecaoEKitPanelNovosRastreadoresProps["setAparelhosSelecionados"];
  } = {},
) {
  const {
    aparelhosSelecionados = new Set<number>(),
    setAparelhosSelecionados = vi.fn(),
    ...rest
  } = override;
  const b = baseProps();
  return render(
    <ModalSelecaoEKitPanelNovosRastreadores
      {...b}
      {...rest}
      aparelhosSelecionados={aparelhosSelecionados}
      setAparelhosSelecionados={setAparelhosSelecionados}
    />,
  );
}

function quotaPayload(): AparelhosDestinatariosResponse {
  return {
    assignments: [],
    quotaUsage: [
      {
        proprietario: "INFINITY",
        clienteId: null,
        clienteNome: null,
        atribuido: 2,
        total: 2,
      },
      {
        proprietario: "CLIENTE",
        clienteId: 7,
        clienteNome: "ACME",
        atribuido: 1,
        total: 3,
      },
      {
        proprietario: "CLIENTE",
        clienteId: 8,
        clienteNome: null,
        atribuido: 0,
        total: 1,
      },
    ],
  };
}

describe("ModalSelecaoEKitPanelNovosRastreadores", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 36,
      top: 100,
      left: 20,
      bottom: 400,
      right: 220,
      x: 20,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
  });

  describe("banner de requisitos do pedido", () => {
    it("não renderiza o banner quando pedido não tem marca/modelo nem operadora", () => {
      const pedido = buildPedidoView({
        marcaModelo: undefined,
        operadora: undefined,
      });
      renderPanel({ pedido });
      expect(
        screen.queryByText(/Aparelhos filtrados por requisitos do pedido/i),
      ).not.toBeInTheDocument();
    });

    it("renderiza só a etiqueta de marca/modelo quando não há operadora", () => {
      const pedido = buildPedidoView({
        marcaModelo: "TK-103",
        operadora: undefined,
      });
      renderPanel({ pedido });
      expect(screen.getByText("TK-103")).toBeInTheDocument();
      expect(screen.queryByText(/Operadora:/i)).not.toBeInTheDocument();
    });

    it("renderiza só a etiqueta de operadora quando não há marca/modelo", () => {
      const pedido = buildPedidoView({
        marcaModelo: undefined,
        operadora: "TIM",
      });
      renderPanel({ pedido });
      expect(screen.queryByText("TK-103")).not.toBeInTheDocument();
      expect(screen.getByText(/Operadora: TIM/i)).toBeInTheDocument();
    });

    it("renderiza marca/modelo e operadora quando ambos existem", () => {
      const pedido = buildPedidoView({
        marcaModelo: "TK-103",
        operadora: "TIM",
      });
      renderPanel({ pedido });
      expect(
        screen.getByText(/Aparelhos filtrados por requisitos do pedido/i),
      ).toBeInTheDocument();
      expect(screen.getByText("TK-103")).toBeInTheDocument();
      expect(screen.getByText(/Operadora: TIM/i)).toBeInTheDocument();
    });
  });

  describe("quota (pedido misto)", () => {
    it("não exibe chips de quota quando não é misto, mesmo com dados", () => {
      renderPanel({ isMisto: false, destinatariosData: quotaPayload() });
      expect(screen.queryByText("Infinity:")).not.toBeInTheDocument();
    });

    it("não exibe chips quando é misto mas quotaUsage está vazia", () => {
      renderPanel({
        isMisto: true,
        destinatariosData: { assignments: [], quotaUsage: [] },
      });
      expect(screen.queryByText("Infinity:")).not.toBeInTheDocument();
    });

    it("não exibe chips quando destinatariosData é undefined", () => {
      renderPanel({ isMisto: true, destinatariosData: undefined });
      expect(screen.queryByText("Infinity:")).not.toBeInTheDocument();
    });

    it("exibe Infinity, nome do cliente, fallback Cliente #id e cores por preenchimento da quota", () => {
      renderPanel({ isMisto: true, destinatariosData: quotaPayload() });
      expect(screen.getByText("Infinity:")).toBeInTheDocument();
      expect(screen.getByText("2/2")).toBeInTheDocument();
      expect(screen.getByText("ACME:")).toBeInTheDocument();
      expect(screen.getByText("1/3")).toBeInTheDocument();
      expect(screen.getByText("Cliente #8:")).toBeInTheDocument();
      expect(screen.getByText("0/1")).toBeInTheDocument();

      const infinityRow = screen.getByText("Infinity:").closest("div");
      expect(infinityRow).toHaveClass("bg-emerald-50");
      const acmeRow = screen.getByText("ACME:").closest("div");
      expect(acmeRow).toHaveClass("bg-amber-50");
    });
  });

  describe("destino do lote (misto + SearchableSelect)", () => {
    it("não exibe bloco Destino quando pedidoApi é null", () => {
      renderPanel({ isMisto: true, pedidoApi: null });
      expect(screen.queryByText("Destino deste lote")).not.toBeInTheDocument();
    });

    it("exibe bloco com lista vazia quando itens é [] (array vazio é truthy em JS)", () => {
      const pedidoApi = buildPedidoApiMisto({ itens: [] });
      renderPanel({ isMisto: true, pedidoApi });
      expect(screen.getByText("Destino deste lote")).toBeInTheDocument();
      expect(screen.getByTestId("searchable-select-wrap")).toBeInTheDocument();
    });

    it("limpar valor (onChange '') chama setDestinatarioLote(null)", async () => {
      const user = userEvent.setup();
      const setDestinatarioLote = vi.fn();
      renderPanel({
        isMisto: true,
        pedidoApi: buildPedidoApiMisto(),
        setDestinatarioLote,
        destinatarioLote: {
          proprietario: "INFINITY",
          clienteId: null,
        },
      });
      await user.click(
        screen.getByRole("button", {
          name: /Limpar destino do lote \(teste\)/i,
        }),
      );
      expect(setDestinatarioLote).toHaveBeenCalledWith(null);
    });

    it("via UI real: selecionar Infinity atualiza destino com objeto parseado", async () => {
      const user = userEvent.setup();
      const setDestinatarioLote = vi.fn();
      renderPanel({
        isMisto: true,
        pedidoApi: buildPedidoApiMisto(),
        setDestinatarioLote,
      });
      await user.click(
        screen.getByRole("button", { name: /selecionar destino/i }),
      );
      await user.click(
        await screen.findByRole("button", { name: /^Infinity$/ }),
      );
      expect(setDestinatarioLote).toHaveBeenCalledWith({
        proprietario: "INFINITY",
        clienteId: null,
      });
    });

    it("via UI real: selecionar cliente nomeado envia proprietario CLIENTE e clienteId", async () => {
      const user = userEvent.setup();
      const setDestinatarioLote = vi.fn();
      renderPanel({
        isMisto: true,
        pedidoApi: buildPedidoApiMisto(),
        setDestinatarioLote,
      });
      await user.click(
        screen.getByRole("button", { name: /selecionar destino/i }),
      );
      await user.click(await screen.findByRole("button", { name: /^ACME$/ }));
      expect(setDestinatarioLote).toHaveBeenCalledWith({
        proprietario: "CLIENTE",
        clienteId: 99,
      });
    });

    it("rótulo no select para CLIENTE sem nome usa Cliente #id (e seleção funciona)", async () => {
      const user = userEvent.setup();
      const setDestinatarioLote = vi.fn();
      const pedidoApi: PedidoRastreadorApi = {
        ...buildPedidoApiMisto(),
        itens: [
          {
            id: 9,
            proprietario: "CLIENTE",
            clienteId: 42,
            quantidade: 1,
            cliente: null,
          },
        ],
      };
      renderPanel({
        isMisto: true,
        pedidoApi,
        setDestinatarioLote,
      });
      await user.click(
        screen.getByRole("button", { name: /selecionar destino/i }),
      );
      await user.click(
        await screen.findByRole("button", { name: "Cliente #42" }),
      );
      expect(setDestinatarioLote).toHaveBeenCalledWith({
        proprietario: "CLIENTE",
        clienteId: 42,
      });
    });
  });

  describe("checkbox outros proprietários", () => {
    it("ao desmarcar, onCheckedChange converte valor falsy com !! e chama false", async () => {
      const user = userEvent.setup();
      const setShowAllClientes = vi.fn();
      renderPanel({
        setShowAllClientes,
        showAllClientes: true,
      });
      await user.click(
        screen.getByRole("checkbox", {
          name: /Exibir rastreadores de outros proprietários/i,
        }),
      );
      expect(setShowAllClientes).toHaveBeenCalledWith(false);
    });

    it("ao marcar, chama true", async () => {
      const user = userEvent.setup();
      const setShowAllClientes = vi.fn();
      renderPanel({
        setShowAllClientes,
        showAllClientes: false,
      });
      await user.click(
        screen.getByRole("checkbox", {
          name: /Exibir rastreadores de outros proprietários/i,
        }),
      );
      expect(setShowAllClientes).toHaveBeenCalledWith(true);
    });
  });

  describe("botão Adicionar ao Kit", () => {
    it("permanece desabilitado em misto com seleção mas sem destinatarioLote", () => {
      renderPanel({
        isMisto: true,
        destinatarioLote: null,
        aparelhosSelecionados: new Set([1]),
      });
      expect(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      ).toBeDisabled();
    });

    it("habilitado em misto quando há destino e pelo menos um aparelho selecionado", () => {
      renderPanel({
        isMisto: true,
        destinatarioLote: { proprietario: "INFINITY", clienteId: null },
        aparelhosSelecionados: new Set([1]),
      });
      expect(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      ).not.toBeDisabled();
    });

    it("desabilitado sem seleção mesmo com destino definido (misto)", () => {
      renderPanel({
        isMisto: true,
        destinatarioLote: { proprietario: "INFINITY", clienteId: null },
        aparelhosSelecionados: new Set(),
      });
      expect(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      ).toBeDisabled();
    });

    it("não exige destinatarioLote quando não é misto", () => {
      renderPanel({
        isMisto: false,
        destinatarioLote: null,
        aparelhosSelecionados: new Set([10]),
      });
      expect(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      ).not.toBeDisabled();
    });

    it("dispara onAdicionarSelecionados uma vez ao clicar", async () => {
      const user = userEvent.setup();
      const onAdicionar = vi.fn();
      renderPanel({
        onAdicionarSelecionados: onAdicionar,
        aparelhosSelecionados: new Set([10]),
      });
      await user.click(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      );
      expect(onAdicionar).toHaveBeenCalledTimes(1);
    });
  });

  describe("filtros", () => {
    it("campo de busca chama setBuscaAparelho com o valor digitado (input controlado)", async () => {
      const user = userEvent.setup();
      function Harness() {
        const b = useRef(baseProps());
        const [busca, setBusca] = useState("");
        return (
          <ModalSelecaoEKitPanelNovosRastreadores
            {...b.current!}
            buscaAparelho={busca}
            setBuscaAparelho={setBusca}
            aparelhosSelecionados={new Set()}
            setAparelhosSelecionados={vi.fn()}
          />
        );
      }
      render(<Harness />);
      const input = screen.getByPlaceholderText("Digite o identificador...");
      await user.type(input, "abc");
      expect(input).toHaveValue("abc");
    });

    it("onChange do input repassa string completa em uma única alteração", () => {
      const setBuscaAparelho = vi.fn();
      renderPanel({ setBuscaAparelho, buscaAparelho: "" });
      fireEvent.change(
        screen.getByPlaceholderText("Digite o identificador..."),
        {
          target: { value: "IMEI-999" },
        },
      );
      expect(setBuscaAparelho).toHaveBeenCalledTimes(1);
      expect(setBuscaAparelho).toHaveBeenCalledWith("IMEI-999");
    });

    it("altera os três selects nativos com valores distintos", () => {
      const setFiltroMarcaModelo = vi.fn();
      const setFiltroOperadora = vi.fn();
      const setFiltroCliente = vi.fn();
      renderPanel({
        setFiltroMarcaModelo,
        setFiltroOperadora,
        setFiltroCliente,
        opcoesMarcaModelo: ["M1", "M2"],
        opcoesOperadora: ["Op1", "Op2"],
        opcoesCliente: ["C1", "C2"],
      });
      const combos = screen.getAllByRole("combobox");
      expect(combos).toHaveLength(3);
      fireEvent.change(combos[0], { target: { value: "M2" } });
      fireEvent.change(combos[1], { target: { value: "Op2" } });
      fireEvent.change(combos[2], { target: { value: "C2" } });
      expect(setFiltroMarcaModelo).toHaveBeenCalledTimes(1);
      expect(setFiltroMarcaModelo).toHaveBeenCalledWith("M2");
      expect(setFiltroOperadora).toHaveBeenCalledTimes(1);
      expect(setFiltroOperadora).toHaveBeenCalledWith("Op2");
      expect(setFiltroCliente).toHaveBeenCalledTimes(1);
      expect(setFiltroCliente).toHaveBeenCalledWith("C2");
    });
  });

  describe("tabela de aparelhos", () => {
    it("com lista vazia mostra mensagem e não há linhas de aparelho (IMEI de dado)", () => {
      render(
        <PanelWithSelecao
          aparelhosFiltrados={[]}
          opcoesMarcaModelo={[]}
          opcoesOperadora={[]}
          opcoesCliente={[]}
        />,
      );
      expect(
        screen.getByText("Nenhum aparelho disponível."),
      ).toBeInTheDocument();
      expect(screen.queryByText("IMEI-1")).not.toBeInTheDocument();
    });

    it("IMEI, marca/modelo e operadora usam fallback '-' e operadora do SIM quando necessário", () => {
      const a = buildAparelhoNoKit({
        id: 1,
        identificador: null,
        marca: null,
        modelo: null,
        operadora: null,
        simVinculado: { identificador: "SIM1", operadora: "Claro" },
        cliente: { id: 1, nome: "Empresa X" },
      });
      render(
        <PanelWithSelecao
          aparelhosFiltrados={[a]}
          opcoesMarcaModelo={["x"]}
          opcoesOperadora={["x"]}
          opcoesCliente={["x"]}
        />,
      );
      const row = screen.getByText("Empresa X").closest("tr")!;
      expect(within(row).getAllByText("-").length).toBeGreaterThanOrEqual(2);
      expect(within(row).getByText("Claro")).toBeInTheDocument();
      expect(within(row).getByText("Empresa X")).toBeInTheDocument();
    });

    it("marca sem modelo exibe só a marca (join sem barra dupla)", () => {
      const a = buildAparelhoNoKit({
        id: 2,
        marca: "Teltonika",
        modelo: null,
      });
      render(
        <PanelWithSelecao
          aparelhosFiltrados={[a]}
          opcoesMarcaModelo={["x"]}
          opcoesOperadora={["x"]}
          opcoesCliente={["x"]}
        />,
      );
      expect(screen.getByText("Teltonika")).toBeInTheDocument();
      expect(screen.queryByText("Teltonika /")).not.toBeInTheDocument();
    });

    it("clique na linha alterna seleção; estado indica linha selecionada (classe)", async () => {
      const user = userEvent.setup();
      const a = buildAparelhoNoKit({ id: 50 });
      render(
        <PanelWithSelecao
          aparelhosFiltrados={[a]}
          opcoesMarcaModelo={["M"]}
          opcoesOperadora={["V"]}
          opcoesCliente={["C"]}
        />,
      );
      const dataRow = screen.getByText("IMEI-1").closest("tr")!;
      expect(dataRow).not.toHaveClass("bg-blue-50");
      await user.click(dataRow);
      expect(dataRow).toHaveClass("bg-blue-50");
      await user.click(dataRow);
      expect(dataRow).not.toHaveClass("bg-blue-50");
    });

    it("clique no checkbox da linha alterna uma vez (stopPropagation evita duplo toggle da tr)", async () => {
      const user = userEvent.setup();
      const a = buildAparelhoNoKit({ id: 60 });
      render(
        <PanelWithSelecao
          aparelhosFiltrados={[a]}
          opcoesMarcaModelo={["M"]}
          opcoesOperadora={["V"]}
          opcoesCliente={["C"]}
        />,
      );
      const table = screen.getByRole("table");
      const rowCheckbox = within(table).getAllByRole("checkbox")[1];
      await user.click(rowCheckbox);
      expect(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      ).not.toBeDisabled();
      await user.click(rowCheckbox);
      expect(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      ).toBeDisabled();
    });

    it("seleção parcial: cabeçalho não fica marcado; marcar cabeçalho seleciona todos", async () => {
      const user = userEvent.setup();
      const a1 = buildAparelhoNoKit({ id: 1 });
      const a2 = buildAparelhoNoKit({ id: 2, identificador: "IMEI-2" });
      render(
        <PanelWithSelecao
          aparelhosFiltrados={[a1, a2]}
          opcoesMarcaModelo={["M"]}
          opcoesOperadora={["V"]}
          opcoesCliente={["C"]}
        />,
      );
      const table = screen.getByRole("table");
      const [headerCb, row1Cb] = within(table).getAllByRole("checkbox");
      expect(headerCb).not.toBeChecked();
      await user.click(row1Cb);
      expect(headerCb).not.toBeChecked();
      await user.click(headerCb);
      expect(headerCb).toBeChecked();
      within(table)
        .getAllByRole("checkbox")
        .forEach((cb) => {
          expect(cb).toBeChecked();
        });
    });

    it("com zero linhas, marcar checkbox do cabeçalho não quebra e Adicionar segue desabilitado", async () => {
      const user = userEvent.setup();
      render(
        <PanelWithSelecao
          aparelhosFiltrados={[]}
          opcoesMarcaModelo={[]}
          opcoesOperadora={[]}
          opcoesCliente={[]}
        />,
      );
      const table = screen.getByRole("table");
      const headerCb = within(table).getByRole("checkbox");
      await user.click(headerCb);
      expect(
        screen.getByRole("button", { name: /Adicionar ao Kit/i }),
      ).toBeDisabled();
    });

    it("fluxo misto: escolher destino na UI + selecionar linha habilita Adicionar", async () => {
      const user = userEvent.setup();
      render(
        <PanelMistoComEstadoDestino
          pedidoApi={buildPedidoApiMisto()}
          aparelhosFiltrados={[buildAparelhoNoKit({ id: 7 })]}
          opcoesMarcaModelo={["M"]}
          opcoesOperadora={["V"]}
          opcoesCliente={["C"]}
        />,
      );
      const adicionar = screen.getByRole("button", {
        name: /Adicionar ao Kit/i,
      });
      expect(adicionar).toBeDisabled();
      await user.click(
        screen.getByRole("button", { name: /selecionar destino/i }),
      );
      await user.click(
        await screen.findByRole("button", { name: /^Infinity$/ }),
      );
      expect(adicionar).toBeDisabled();
      await user.click(screen.getByText("IMEI-1").closest("tr")!);
      expect(adicionar).not.toBeDisabled();
    });
  });
});

describe("SearchableSelect export (wrapper de teste + implementação interna)", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 36,
      top: 100,
      left: 20,
      bottom: 400,
      right: 220,
      x: 20,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
  });

  it("abre, filtra e devolve value ao onChange (detecta mock que não repasse props ao Select interno)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SearchableSelectUnderTest
        options={[
          { value: "x", label: "Alpha" },
          { value: "y", label: "Beta" },
        ]}
        value=""
        onChange={onChange}
        placeholder="Escolha"
      />,
    );
    await user.click(screen.getByRole("button", { name: /escolha/i }));
    const filter = await screen.findByPlaceholderText("Filtrar...");
    await user.type(filter, "bet");
    await user.click(screen.getByRole("button", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("y");
  });
});
