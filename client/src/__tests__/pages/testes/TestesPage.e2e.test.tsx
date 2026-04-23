/**
 * Fluxo ponta a ponta no cliente (Vitest + RTL): TestesPage com API mockada.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TestesPage } from "@/pages/testes/TestesPage";
import { osTesteFixture, rastreadorTesteFixture } from "./fixtures";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

function renderTestesPage(initial = "/testes") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <QueryClientProvider client={qc}>
        <Routes>
          <Route path="/testes" element={<TestesPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  api.mockReset();
});

describe("TestesPage E2E (cliente)", () => {
  it("renderiza fila e bancada após carregar OS", async () => {
    const os = osTesteFixture();
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([rastreadorTesteFixture()]);
      return Promise.resolve({});
    });
    renderTestesPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /fila de testes/i })).toBeInTheDocument(),
    );
    expect(
      await screen.findByRole("heading", { name: /dados da ordem de serviço/i }),
    ).toBeInTheDocument();
  });

  it("fluxo: Finalizar permanece desabilitado sem IMEI vinculado (não chama API)", async () => {
    const os = osTesteFixture({ idAparelho: null });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([]);
      return Promise.resolve({});
    });
    renderTestesPage();
    await screen.findByText(/cliente alfa/i);
    const finalizar = await screen.findByRole("button", {
      name: /finalizar teste/i,
    });
    expect(finalizar).toBeDisabled();
    expect(api).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/ordens-servico\/\d+\/status/),
      expect.anything(),
    );
  });

  it("fluxo: abre modal cancelar e Reagendar dispara PATCH", async () => {
    const user = userEvent.setup();
    const os = osTesteFixture();
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([]);
      return Promise.resolve({});
    });
    renderTestesPage();
    await screen.findByText(/cliente alfa/i);
    await user.click(screen.getByRole("button", { name: /cancelar operação/i }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        /o que deseja fazer com esta ordem de serviço/i,
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /reagendar/i }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        `/ordens-servico/${os.id}/status`,
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("AGENDADO"),
        }),
      ),
    );
  });

  it("edge: OS RETIRADA exibe botão Retirada Realizada e abre modal", async () => {
    const user = userEvent.setup();
    const os = osTesteFixture({ tipo: "RETIRADA", idAparelho: "R-1" });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      return Promise.resolve({});
    });
    renderTestesPage();
    await screen.findByRole("heading", { name: /dados da retirada/i });
    await user.click(
      screen.getByRole("button", { name: /retirada realizada/i }),
    );
    expect(
      await screen.findByText(/o aparelho foi encontrado no local/i),
    ).toBeInTheDocument();
  });

  it("edge: subcliente via snapshot aparece nos dados da OS", async () => {
    const os = osTesteFixture({
      subcliente: null,
      subclienteSnapshotNome: "Snap Only",
    });
    api.mockImplementation((path: string) => {
      if (String(path).startsWith("/ordens-servico/testando"))
        return Promise.resolve([os]);
      if (String(path).startsWith("/aparelhos/para-testes"))
        return Promise.resolve([]);
      return Promise.resolve({});
    });
    renderTestesPage();
    expect(await screen.findByText("Snap Only")).toBeInTheDocument();
  });
});
