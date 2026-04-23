import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DrawerDetalhes } from "@/pages/pedidos/lista/components/DrawerDetalhes";
import { URGENCIA_STYLE } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { buildPedidoView } from "../../modal-selecao-ekit/modal-selecao-ekit.fixtures";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => false }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

function App({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("DrawerDetalhes (valor de urgência + classes de texto)", () => {
  it("Urgente aplica valueText vermelho do mapa", () => {
    const pedido = buildPedidoView({ urgencia: "Urgente" });
    render(
      <App>
        <DrawerDetalhes
          pedido={pedido}
          open
          onOpenChange={vi.fn()}
        />
      </App>,
    );
    const value = screen.getByText("Urgente");
    for (const cls of URGENCIA_STYLE.Urgente.valueText.split(/\s+/)) {
      if (cls) expect(value).toHaveClass(cls);
    }
  });

  it("Média usa tom slate do mapa (não âmbar)", () => {
    const pedido = buildPedidoView({ urgencia: "Média" });
    render(
      <App>
        <DrawerDetalhes pedido={pedido} open onOpenChange={vi.fn()} />
      </App>,
    );
    const value = screen.getByText("Média");
    for (const cls of URGENCIA_STYLE["Média"]!.valueText.split(/\s+/)) {
      if (cls) expect(value).toHaveClass(cls);
    }
  });

  it("urgência desconhecida cai no fallback Média para o texto", () => {
    const pedido = buildPedidoView({ urgencia: "???ForaDoMapa" });
    render(
      <App>
        <DrawerDetalhes pedido={pedido} open onOpenChange={vi.fn()} />
      </App>,
    );
    const value = screen.getByText("???ForaDoMapa");
    for (const cls of URGENCIA_STYLE["Média"]!.valueText.split(/\s+/)) {
      if (cls) expect(value).toHaveClass(cls);
    }
  });

  it("sem urgência não renderiza bloco Urgência", () => {
    const pedido = buildPedidoView();
    delete pedido.urgencia;
    render(
      <App>
        <DrawerDetalhes pedido={pedido} open onOpenChange={vi.fn()} />
      </App>,
    );
    expect(screen.queryByText("Urgência")).not.toBeInTheDocument();
  });
});
