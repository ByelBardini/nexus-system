import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KitResumo } from "@/pages/pedidos/shared/pedidos-config-types";
import type { PedidoRastreadorApi } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { SidePanel } from "@/pages/pedidos/side-panel/SidePanel";
import {
  buildAvançarStatusPayload,
  buildRetrocederStatusPayload,
} from "@/pages/pedidos/side-panel/side-panel.utils";
import {
  buildKitComAparelhos,
  buildPedidoView,
} from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";
import { toast } from "sonner";

const apiMock = vi.hoisted(() => vi.fn());

/** Permissão de edição do painel — alterado em testes de autorização. */
const authState = vi.hoisted(() => ({ podeEditarPedido: true }));

/** Última captura de props relevantes do modal (contrato com SidePanel). */
const modalCapture = vi.hoisted(() => ({
  filtrosPedido: null as {
    clienteId: number | null | undefined;
    modeloEquipamentoId: number | null | undefined;
    marcaEquipamentoId: number | null | undefined;
    operadoraId: number | null | undefined;
  } | null,
  pedidoApiPassado: null as PedidoRastreadorApi | null,
}));

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} aria-hidden />
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (key: string) =>
      key === "AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR"
        ? authState.podeEditarPedido
        : false,
  }),
}));

vi.mock("@/pages/pedidos/modal-selecao-ekit/ModalSelecaoEKit", () => ({
  ModalSelecaoEKit: ({
    open,
    onOpenChange,
    onVincular,
    kitParaEditar,
    pedidoApi,
    filtrosPedido,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVincular: (kit: KitResumo, qtd: number) => void;
    kitParaEditar: { id: number; nome: string } | null;
    pedidoApi: PedidoRastreadorApi | null;
    filtrosPedido: typeof modalCapture.filtrosPedido;
  }) => {
    modalCapture.pedidoApiPassado = pedidoApi;
    modalCapture.filtrosPedido = filtrosPedido;
    return open ? (
      <div data-testid="modal-selecao-ekit-open">
        {kitParaEditar != null && (
          <span data-testid="kit-editando-id">{kitParaEditar.id}</span>
        )}
        <button
          type="button"
          data-testid="modal-fechar"
          onClick={() => onOpenChange(false)}
        >
          fechar modal
        </button>
        <button
          type="button"
          data-testid="modal-abrir-sem-fechar-edit"
          onClick={() => onOpenChange(true)}
        >
          noop open
        </button>
        <button
          type="button"
          data-testid="vincular-novo-kit"
          onClick={() => onVincular({ id: 99, nome: "Kit Novo" }, 2)}
        >
          vincular novo
        </button>
        <button
          type="button"
          data-testid="vincular-atualiza-kit"
          onClick={() => onVincular({ id: 1, nome: "Kit Renomeado" }, 4)}
        >
          vincular atualiza
        </button>
      </div>
    ) : null;
  },
}));

function TestApp({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function pedidoApiCompleto(): PedidoRastreadorApi {
  return {
    id: 10,
    codigo: "PED-001",
    tipoDestino: "CLIENTE",
    tecnicoId: null,
    clienteId: 1,
    subclienteId: null,
    quantidade: 5,
    status: "CONFIGURADO",
    urgencia: "MEDIA",
    observacao: null,
    criadoPorId: 1,
    criadoEm: "",
    atualizadoEm: "",
    entregueEm: null,
    kitIds: [1],
    cliente: { id: 1, nome: "C" },
    deClienteId: 42,
    modeloEquipamentoId: 7,
    marcaEquipamentoId: 8,
    operadoraId: 9,
  };
}

/** Corpo enviado no PATCH /status (id vai na URL, não no JSON). */
function parseStatusPatchBody(call: unknown[]): { status: string; kitIds?: number[] } {
  const init = call[1] as { body?: string };
  return JSON.parse(init.body ?? "{}") as { status: string; kitIds?: number[] };
}

function findStatusPatchCall(pedidoId: number) {
  return apiMock.mock.calls.find(
    (c) =>
      c[0] === `/pedidos-rastreadores/${pedidoId}/status` &&
      (c[1] as { method?: string })?.method === "PATCH",
  );
}

function findKitsPatchCall(pedidoId: number) {
  return apiMock.mock.calls.find(
    (c) =>
      c[0] === `/pedidos-rastreadores/${pedidoId}/kits` &&
      (c[1] as { method?: string })?.method === "PATCH",
  );
}

/** Garante que o último PATCH de status bate com o payload de domínio (fonte única). */
function expectStatusPatchMatchesPayload(
  pedidoId: number,
  payload: ReturnType<typeof buildAvançarStatusPayload> | ReturnType<typeof buildRetrocederStatusPayload>,
) {
  const call = findStatusPatchCall(pedidoId);
  expect(call, "esperado PATCH /pedidos-rastreadores/:id/status").toBeDefined();
  const body = parseStatusPatchBody(call!);
  const expected: { status: string; kitIds?: number[] } = { status: payload.status };
  if (payload.kitIds !== undefined) expected.kitIds = payload.kitIds;
  expect(body).toEqual(expected);
}

function renderPainel(
  overrides: Partial<React.ComponentProps<typeof SidePanel>> = {},
) {
  const onKitsChange = overrides.onKitsChange ?? vi.fn();
  const onClose = overrides.onClose ?? vi.fn();
  const view = render(
    <TestApp>
      <SidePanel
        pedido={
          overrides.pedido ??
          buildPedidoView({
            id: 10,
            quantidade: 5,
            status: "configurado",
          })
        }
        pedidoApi={
          "pedidoApi" in overrides
            ? (overrides.pedidoApi ?? null)
            : pedidoApiCompleto()
        }
        open={overrides.open ?? true}
        onClose={onClose}
        onStatusUpdated={overrides.onStatusUpdated ?? vi.fn()}
        kitsVinculados={
          overrides.kitsVinculados ?? [{ id: 1, nome: "K1", quantidade: 5 }]
        }
        onKitsChange={onKitsChange}
        tipoDespacho={overrides.tipoDespacho ?? "TRANSPORTADORA"}
        onTipoDespachoChange={overrides.onTipoDespachoChange ?? vi.fn()}
        kitsPorPedido={overrides.kitsPorPedido ?? {}}
        transportadora={overrides.transportadora ?? ""}
        numeroNf={overrides.numeroNf ?? ""}
        onTransportadoraChange={overrides.onTransportadoraChange ?? vi.fn()}
        onNumeroNfChange={overrides.onNumeroNfChange ?? vi.fn()}
      />
    </TestApp>,
  );
  return { onKitsChange, onClose, ...view };
}

describe("SidePanel", () => {
  beforeEach(() => {
    apiMock.mockReset();
    authState.podeEditarPedido = true;
    modalCapture.filtrosPedido = null;
    modalCapture.pedidoApiPassado = null;
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  describe("visibilidade e contrato com o pai", () => {
    it("não renderiza conteúdo quando open é false (não dispara queries de kit)", async () => {
      apiMock.mockResolvedValue(buildKitComAparelhos());
      const { container } = renderPainel({
        open: false,
        kitsVinculados: [{ id: 1, nome: "K", quantidade: 5 }],
      });
      expect(container.firstChild).toBeNull();
      await waitFor(
        () => {
          const kitCalls = apiMock.mock.calls.filter(
            (c) =>
              typeof c[0] === "string" &&
              (c[0] as string).includes("/aparelhos/pareamento/kits/"),
          );
          expect(kitCalls).toHaveLength(0);
        },
        { timeout: 200 },
      );
    });

    it("não renderiza quando pedido é null", () => {
      const { container } = renderPainel({
        pedido: null,
        open: true,
      });
      expect(container.firstChild).toBeNull();
    });

    it("com pedidoApi, repassa filtros coerentes ao modal (contrato SidePanel → Modal)", async () => {
      const user = userEvent.setup();
      const api = pedidoApiCompleto();
      const { unmount } = renderPainel({ pedidoApi: api });
      await user.click(screen.getByRole("button", { name: /adicionar kit/i }));
      expect(modalCapture.pedidoApiPassado).toBe(api);
      expect(modalCapture.filtrosPedido).toEqual({
        clienteId: 42,
        modeloEquipamentoId: 7,
        marcaEquipamentoId: 8,
        operadoraId: 9,
      });
      unmount();
    });

    it("com pedidoApi null, filtrosPedido no modal é null", async () => {
      const user = userEvent.setup();
      const { unmount } = renderPainel({
        pedidoApi: null,
        pedido: buildPedidoView({ status: "configurado" }),
      });
      await user.click(screen.getByRole("button", { name: /adicionar kit/i }));
      expect(modalCapture.pedidoApiPassado).toBeNull();
      expect(modalCapture.filtrosPedido).toBeNull();
      unmount();
    });

    it("onClose só é chamado ao fechar o painel (Escape), não ao abrir", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const { onClose } = renderPainel();
      expect(onClose).not.toHaveBeenCalled();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it("botão fechar (X) do Sheet dispara onClose uma vez", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const { onClose } = renderPainel();
      await user.click(screen.getByRole("button", { name: /close/i }));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });
  });

  describe("autorização", () => {
    it("sem permissão AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR não exibe ações de status", () => {
      authState.podeEditarPedido = false;
      renderPainel({
        pedido: buildPedidoView({ status: "em_configuracao", quantidade: 5 }),
        kitsVinculados: [{ id: 1, nome: "K1", quantidade: 5 }],
      });
      expect(screen.queryByRole("button", { name: /avançar/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /retroceder/i })).toBeNull();
    });
  });

  describe("status (payload alinhado a build*Payload)", () => {
    it("Avançar: em_configuracao → CONFIGURADO com kitIds quando há kits", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const onStatus = vi.fn();
      const pedido = buildPedidoView({
        id: 10,
        quantidade: 5,
        status: "em_configuracao",
      });
      const kits = [{ id: 1, nome: "K1", quantidade: 5 }];
      renderPainel({ onStatusUpdated: onStatus, pedido, kitsVinculados: kits });

      await user.click(screen.getByRole("button", { name: /avançar/i }));

      const expected = buildAvançarStatusPayload(pedido, "configurado", kits);
      await waitFor(() => {
        expectStatusPatchMatchesPayload(10, expected);
        expect(onStatus).toHaveBeenCalledTimes(1);
      });
    });

    it("Avançar: configurado + despacho EM_MAOS pula para ENTREGUE (regra de negócio)", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const onStatus = vi.fn();
      const pedido = buildPedidoView({
        id: 10,
        quantidade: 5,
        status: "configurado",
      });
      const kits = [{ id: 1, nome: "K1", quantidade: 5 }];
      renderPainel({
        onStatusUpdated: onStatus,
        pedido,
        kitsVinculados: kits,
        tipoDespacho: "EM_MAOS",
      });

      await user.click(screen.getByRole("button", { name: /concluir/i }));

      const expected = buildAvançarStatusPayload(pedido, "entregue", kits);
      await waitFor(() => {
        expectStatusPatchMatchesPayload(10, expected);
        expect(onStatus).toHaveBeenCalledTimes(1);
      });
    });

    it("Avançar fica desabilitado quando progresso < total e o próximo passo seria configurado", () => {
      renderPainel({
        pedido: buildPedidoView({
          id: 10,
          quantidade: 5,
          status: "em_configuracao",
        }),
        kitsVinculados: [{ id: 1, nome: "K1", quantidade: 2 }],
      });
      const avançar = screen.getByRole("button", { name: /avançar/i });
      expect(avançar).toBeDisabled();
      expect(findStatusPatchCall(10)).toBeUndefined();
    });

    it("Retroceder: configurado → EM_CONFIGURACAO sem kitIds no corpo", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const onStatus = vi.fn();
      const pedido = buildPedidoView({
        id: 10,
        quantidade: 5,
        status: "configurado",
      });
      const kits = [{ id: 1, nome: "K1", quantidade: 5 }];
      renderPainel({ onStatusUpdated: onStatus, pedido, kitsVinculados: kits });

      await user.click(screen.getByRole("button", { name: /retroceder/i }));

      const expected = buildRetrocederStatusPayload(
        pedido,
        "em_configuracao",
        kits,
        pedidoApiCompleto(),
      );
      await waitFor(() => {
        expectStatusPatchMatchesPayload(10, expected);
        expect(onStatus).toHaveBeenCalledTimes(1);
      });
    });

    it("em despachado, Retroceder não está disponível (regra getSidePanelDerivations)", () => {
      renderPainel({
        pedido: buildPedidoView({
          id: 10,
          quantidade: 5,
          status: "despachado",
        }),
        kitsVinculados: [{ id: 1, nome: "K1", quantidade: 5 }],
      });
      const retro = screen.getByRole("button", { name: /retroceder/i });
      expect(retro).toBeDisabled();
      expect(findStatusPatchCall(10)).toBeUndefined();
    });
  });

  describe("kits vinculados", () => {
    it("remove último kit: onKitsChange([]) e PATCH kitIds vazio", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const { onKitsChange } = renderPainel();
      await user.click(screen.getByRole("button", { name: /remover kit/i }));
      expect(onKitsChange).toHaveBeenCalledExactlyOnceWith([]);
      await waitFor(() => {
        const call = findKitsPatchCall(10);
        expect(call).toBeDefined();
        expect(JSON.parse((call![1] as { body: string }).body)).toEqual({
          kitIds: [],
        });
      });
    });

    it("vincular primeiro kit a partir da lista vazia: apenas o novo kit e PATCH coerente", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const { onKitsChange } = renderPainel({
        kitsVinculados: [],
        pedido: buildPedidoView({ status: "em_configuracao", quantidade: 5 }),
      });
      expect(screen.getByText("Nenhum kit vinculado.")).toBeInTheDocument();
      await user.click(
        within(screen.getByRole("table")).getByRole("button", {
          name: /adicionar kit/i,
        }),
      );
      await user.click(screen.getByTestId("vincular-novo-kit"));
      expect(onKitsChange).toHaveBeenCalledExactlyOnceWith([
        { id: 99, nome: "Kit Novo", quantidade: 2 },
      ]);
      await waitFor(() => {
        const call = findKitsPatchCall(10);
        expect(JSON.parse((call![1] as { body: string }).body)).toEqual({
          kitIds: [99],
        });
      });
    });

    it("vincular kit novo acumula ordem estável [existentes…, novo]", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const { onKitsChange } = renderPainel({
        kitsVinculados: [
          { id: 1, nome: "A", quantidade: 3 },
          { id: 2, nome: "B", quantidade: 2 },
        ],
      });
      await user.click(screen.getByRole("button", { name: /adicionar kit/i }));
      await user.click(screen.getByTestId("vincular-novo-kit"));
      expect(onKitsChange).toHaveBeenCalledWith([
        { id: 1, nome: "A", quantidade: 3 },
        { id: 2, nome: "B", quantidade: 2 },
        { id: 99, nome: "Kit Novo", quantidade: 2 },
      ]);
      await waitFor(() => {
        expect(JSON.parse((findKitsPatchCall(10)![1] as { body: string }).body)).toEqual({
          kitIds: [1, 2, 99],
        });
      });
    });

    it("vincular atualiza kit existente preservando outros campos do item", async () => {
      const user = userEvent.setup();
      apiMock.mockResolvedValue({});
      const { onKitsChange } = renderPainel({
        kitsVinculados: [
          { id: 1, nome: "K1", quantidade: 5 },
          { id: 2, nome: "Outro", quantidade: 1 },
        ],
      });
      await user.click(screen.getByRole("button", { name: /adicionar kit/i }));
      await user.click(screen.getByTestId("vincular-atualiza-kit"));
      expect(onKitsChange).toHaveBeenCalledWith([
        { id: 1, nome: "Kit Renomeado", quantidade: 4 },
        { id: 2, nome: "Outro", quantidade: 1 },
      ]);
    });

    it("erro no PATCH de kits exibe toast de erro (hook real)", async () => {
      const user = userEvent.setup();
      apiMock.mockRejectedValueOnce(new Error("falha de rede"));
      renderPainel();
      await user.click(screen.getByRole("button", { name: /remover kit/i }));
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("falha de rede"),
      );
    });

    it("com dois kits na tabela, remove a linha correta (kit 2) mantendo expansão do kit 1", async () => {
      const user = userEvent.setup();
      apiMock.mockImplementation(async (path: string) => {
        if (path === "/aparelhos/pareamento/kits/1") {
          return buildKitComAparelhos({ id: 1, aparelhos: [] });
        }
        return {};
      });
      const { onKitsChange } = renderPainel({
        kitsVinculados: [
          { id: 1, nome: "A", quantidade: 3 },
          { id: 2, nome: "B", quantidade: 2 },
        ],
      });
      const tabela = screen.getByRole("table");
      const rowA = within(tabela).getByRole("row", { name: /A/i });
      const expandA = within(rowA).getByTestId("icon-expand_more").closest("button");
      await user.click(expandA!);
      await waitFor(() =>
        expect(within(tabela).getByTestId("icon-expand_less")).toBeInTheDocument(),
      );
      const rows = within(tabela).getAllByRole("row");
      const rowB = rows.find((r) => r.textContent?.includes("B"));
      expect(rowB).toBeDefined();
      const removerB = within(rowB!).getByRole("button", { name: /remover kit/i });
      await user.click(removerB);
      expect(onKitsChange).toHaveBeenLastCalledWith([
        { id: 1, nome: "A", quantidade: 3 },
      ]);
      expect(within(tabela).getByTestId("icon-expand_less")).toBeInTheDocument();
    });

    it("remover kit expandido fecha detalhe e não deixa expand_less no DOM", async () => {
      const user = userEvent.setup();
      apiMock.mockImplementation(async (path: string) => {
        if (path === "/aparelhos/pareamento/kits/1") {
          return buildKitComAparelhos({ id: 1, aparelhos: [] });
        }
        return {};
      });
      renderPainel();
      await user.click(screen.getByTestId("icon-expand_more").closest("button")!);
      await waitFor(() =>
        expect(screen.getByTestId("icon-expand_less")).toBeInTheDocument(),
      );
      await user.click(screen.getByRole("button", { name: /remover kit/i }));
      expect(screen.queryByTestId("icon-expand_less")).toBeNull();
    });

    it("segundo clique no expand colapsa (expand_less)", async () => {
      const user = userEvent.setup();
      apiMock.mockImplementation(async (path: string) => {
        if (path === "/aparelhos/pareamento/kits/1") {
          return buildKitComAparelhos({ id: 1, aparelhos: [] });
        }
        return {};
      });
      renderPainel();
      await user.click(screen.getByTestId("icon-expand_more").closest("button")!);
      await waitFor(() =>
        expect(screen.getByTestId("icon-expand_less")).toBeInTheDocument(),
      );
      await user.click(screen.getByTestId("icon-expand_less").closest("button")!);
      expect(screen.queryByTestId("icon-expand_less")).toBeNull();
    });
  });

  describe("modal de kit", () => {
    it("Editar define kitParaEditar e onOpenChange(true) não limpa edição", async () => {
      const user = userEvent.setup();
      apiMock.mockImplementation(async (path: string) => {
        if (path === "/aparelhos/pareamento/kits/1") {
          return buildKitComAparelhos({ id: 1, aparelhos: [] });
        }
        return {};
      });
      renderPainel();
      await user.click(screen.getByTestId("icon-expand_more").closest("button")!);
      await waitFor(() => screen.getByRole("button", { name: /^editar$/i }));
      await user.click(screen.getByRole("button", { name: /^editar$/i }));
      expect(screen.getByTestId("kit-editando-id")).toHaveTextContent("1");
      await user.click(screen.getByTestId("modal-abrir-sem-fechar-edit"));
      expect(screen.getByTestId("kit-editando-id")).toHaveTextContent("1");
    });

    it("onOpenChange(false) zera kitParaEditar: após fechar, abrir por Adicionar não mostra kit em edição", async () => {
      const user = userEvent.setup();
      apiMock.mockImplementation(async (path: string) => {
        if (path === "/aparelhos/pareamento/kits/1") {
          return buildKitComAparelhos({ id: 1, aparelhos: [] });
        }
        return {};
      });
      renderPainel();
      await user.click(screen.getByTestId("icon-expand_more").closest("button")!);
      await waitFor(() => screen.getByRole("button", { name: /^editar$/i }));
      await user.click(screen.getByRole("button", { name: /^editar$/i }));
      expect(screen.getByTestId("kit-editando-id")).toHaveTextContent("1");
      await user.click(screen.getByTestId("modal-fechar"));
      expect(screen.queryByTestId("modal-selecao-ekit-open")).toBeNull();
      await user.click(screen.getByRole("button", { name: /adicionar kit/i }));
      expect(screen.queryByTestId("kit-editando-id")).toBeNull();
    });
  });

  describe("histórico", () => {
    it("renderiza bloco só quando há histórico não vazio", () => {
      const { rerender } = render(
        <TestApp>
          <SidePanel
            pedido={buildPedidoView({
              historico: [{ titulo: "E1", descricao: "D", concluido: true }],
            })}
            pedidoApi={pedidoApiCompleto()}
            open
            onClose={vi.fn()}
            onStatusUpdated={vi.fn()}
            kitsVinculados={[]}
            onKitsChange={vi.fn()}
            tipoDespacho="TRANSPORTADORA"
            onTipoDespachoChange={vi.fn()}
            kitsPorPedido={{}}
            transportadora=""
            numeroNf=""
            onTransportadoraChange={vi.fn()}
            onNumeroNfChange={vi.fn()}
          />
        </TestApp>,
      );
      expect(screen.getByText("Histórico do Pedido")).toBeInTheDocument();

      rerender(
        <TestApp>
          <SidePanel
            pedido={buildPedidoView({ historico: [] })}
            pedidoApi={pedidoApiCompleto()}
            open
            onClose={vi.fn()}
            onStatusUpdated={vi.fn()}
            kitsVinculados={[]}
            onKitsChange={vi.fn()}
            tipoDespacho="TRANSPORTADORA"
            onTipoDespachoChange={vi.fn()}
            kitsPorPedido={{}}
            transportadora=""
            numeroNf=""
            onTransportadoraChange={vi.fn()}
            onNumeroNfChange={vi.fn()}
          />
        </TestApp>,
      );
      expect(screen.queryByText("Histórico do Pedido")).toBeNull();
    });
  });
});
