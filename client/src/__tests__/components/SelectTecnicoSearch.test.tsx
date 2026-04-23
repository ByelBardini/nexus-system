import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SelectTecnicoSearch } from "@/components/SelectTecnicoSearch";

const tecnicos = [
  { id: 1, nome: "Ana", cidade: "São Paulo", estado: "SP" },
  { id: 2, nome: "Bruno", cidade: "Rio de Janeiro", estado: "RJ" },
  { id: 3, nome: "Carla", cidade: "Campinas", estado: "SP" },
  { id: 4, nome: "Daniel", cidade: "São Bernardo", estado: "SP" },
];

function renderWithRouter(
  ui: React.ReactElement,
  initial = "/x",
) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/x" element={ui} />
        <Route path="/tecnicos" element={<div data-testid="pag-tec">Página técnicos</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function dispatchScrollOn(target: EventTarget) {
  const e = new Event("scroll", { bubbles: true });
  Object.defineProperty(e, "target", { value: target, configurable: true });
  act(() => {
    (target as Node).dispatchEvent(e);
  });
}

function getPanel(): HTMLElement {
  const el = document.querySelector(".max-h-60");
  if (!el) throw new Error("painel dropdown inexistente");
  return el as HTMLElement;
}

describe("SelectTecnicoSearch", () => {
  it("value inexistente na lista: não exibe rótulo fantasma, só placeholder; onChange ainda dispara se usuário selecionar", () => {
    render(
      <MemoryRouter>
        <SelectTecnicoSearch
          tecnicos={tecnicos}
          value={9999}
          onChange={vi.fn()}
          disabled
        />
      </MemoryRouter>,
    );
    const container = document.querySelector(
      ".flex.h-9",
    ) as HTMLElement;
    expect(container).toBeInTheDocument();
    expect(
      screen.getByText("Digite para pesquisar técnico..."),
    ).toBeInTheDocument();
  });

  it("desabilitado: placeholder; com id válido, mostra getDisplayText (localidade)", () => {
    const { rerender } = render(
      <MemoryRouter>
        <SelectTecnicoSearch
          tecnicos={tecnicos}
          value={undefined}
          onChange={vi.fn()}
          disabled
          placeholder="Técnico"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <SelectTecnicoSearch
          tecnicos={tecnicos}
          value={1}
          onChange={vi.fn()}
          disabled
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/Ana \(São Paulo - SP\)/),
    ).toBeInTheDocument();
  });

  it("técnico com só cidade (sem estado): título ainda descreve (nome + cidade)", () => {
    render(
      <MemoryRouter>
        <SelectTecnicoSearch
          tecnicos={[{ id: 10, nome: "Eva", cidade: "Curitiba" }]}
          value={10}
          onChange={vi.fn()}
          disabled
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Eva \(Curitiba\)/)).toBeInTheDocument();
  });

  it("seleciona Bruno: onChange(2) uma vez, painel some", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={onChange}
        placeholder="Buscar"
      />,
    );
    await user.click(screen.getByPlaceholderText("Buscar"));
    expect(getPanel()).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Bruno/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
    await waitFor(() => {
      expect(
        document.querySelector(".max-h-60"),
      ).not.toBeInTheDocument();
    });
  });

  it("com valor selecionado, abre dropdown: linha ainda exibe (cidade - estado) de Ana", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={1}
        onChange={vi.fn()}
        placeholder="B"
      />,
    );
    await user.click(screen.getByDisplayValue(/^Ana/));
    expect(
      screen.getByText("São Paulo - SP", { exact: false }),
    ).toBeInTheDocument();
  });

  it("subclienteEstado com espaços: ainda restringe a UF (comportamento trim)", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={vi.fn()}
        subclienteEstado="  sp  "
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    expect(
      screen.getByRole("button", { name: /Ana/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bruno/ })).toBeNull();
  });

  it("só com subclienteEstado, ordena por nome após filtro (Daniel antes de… ordem alfabética do locale)", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={[
          { id: 1, nome: "Zeca", estado: "SP" },
          { id: 2, nome: "Ana", estado: "SP" },
        ]}
        value={undefined}
        onChange={vi.fn()}
        subclienteEstado="SP"
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const tec = screen
      .getAllByRole("button")
      .map((b) => b.textContent)
      .filter((t) => t?.includes("Zeca") || t?.includes("Ana"));
    expect(tec[0]).toMatch(/Ana/);
  });

  it("subcliente cidade+estado: match exato fica com score máximo (Carla em Campinas antes de Ana/SP", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={vi.fn()}
        subclienteCidade="Campinas"
        subclienteEstado="SP"
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const tecRowButtons = screen
      .getAllByRole("button")
      .map((b) => b.textContent ?? "");
    const idxCarla = tecRowButtons.findIndex((t) => t.includes("Carla"));
    const idxAna = tecRowButtons.findIndex((t) => t.includes("Ana"));
    expect(idxCarla).toBeGreaterThanOrEqual(0);
    expect(idxAna).toBeGreaterThanOrEqual(0);
    expect(idxCarla).toBeLessThan(idxAna);
  });

  it("Enter seleciona o primeiro da lista (Ana) por id, não chama onChange vazio", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={onChange}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("Enter com filtro excludente: lista vazia, não seleciona (sem id)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={onChange}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const input = screen.getByDisplayValue("");
    await user.type(input, "___zero___");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Limpar seleção: onChange(undefined), uma única emissão", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={1}
        onChange={onChange}
        placeholder="B"
      />,
    );
    await user.click(screen.getByDisplayValue(/Ana/));
    const limpar = screen.getByRole("button", { name: /limpar seleção/i });
    expect(limpar).toBeInTheDocument();
    await user.click(limpar);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("com lista vazia: CTA de cadastrar leva a /tecnicos", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={[]}
        value={undefined}
        onChange={vi.fn()}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    await user.click(
      screen.getByRole("button", { name: /cadastrar novo técnico/i }),
    );
    await waitFor(() => {
      expect(screen.getByTestId("pag-tec")).toBeInTheDocument();
    });
  });

  it("com técnicos: CTA de rodapé (único) também leva a /tecnicos", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={vi.fn()}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const cadastrar = await screen.findByRole("button", {
      name: /cadastrar novo técnico/i,
    });
    await user.click(cadastrar);
    await waitFor(() => {
      expect(screen.getByTestId("pag-tec")).toBeInTheDocument();
    });
  });

  it("scroll no painel não fecha; scroll no body fecha o popup", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={vi.fn()}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const panel = getPanel();
    dispatchScrollOn(panel);
    expect(
      screen.getByRole("button", { name: /Ana/ }),
    ).toBeInTheDocument();
    dispatchScrollOn(document.body);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Ana/ }),
      ).not.toBeInTheDocument();
    });
  });

  it("Escape: fecha sem tocar onChange; click fora idem", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={tecnicos}
        value={undefined}
        onChange={onChange}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    await user.keyboard("{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByPlaceholderText("B"));
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Ana/ }),
      ).not.toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("linha: só nome quando não há par cidade+estado no técnico", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={[{ id: 9, nome: "Só Nome" }]}
        value={undefined}
        onChange={vi.fn()}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const row = screen.getByRole("button", { name: "Só Nome" });
    expect(row).toBeInTheDocument();
  });

  it("re-fetch no pai: mesmo id, dados novos, rótulo de local muda (sem trocar value)", () => {
    function T() {
      const [list, setList] = useState([
        { id: 1, nome: "Ana", cidade: "A" as const, estado: "SP" as const },
      ]);
      return (
        <MemoryRouter>
          <div>
            <button type="button" onClick={() => setList([{ id: 1, nome: "Ana", cidade: "B", estado: "RJ" }])}>
              atualizar
            </button>
            <SelectTecnicoSearch
              tecnicos={list}
              value={1}
              onChange={vi.fn()}
              disabled
            />
          </div>
        </MemoryRouter>
      );
    }
    render(<T />);
    expect(screen.getByText(/A - SP/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "atualizar" }));
    expect(screen.getByText(/B - RJ/)).toBeInTheDocument();
  });

  it("estado nulo em técnicos: compara com string vazia (não cai fora com trim)", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={[
          { id: 1, nome: "X", cidade: "Y" },
        ]}
        value={undefined}
        onChange={vi.fn()}
        subclienteEstado="SP"
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    expect(
      screen.queryByRole("button", { name: /X/ }),
    ).not.toBeInTheDocument();
  });

  it("só com estado (sem cidade): rótulo no modo desabilitado usa (UF) — sem travar com cidade null", () => {
    render(
      <MemoryRouter>
        <SelectTecnicoSearch
          tecnicos={[{ id: 5, nome: "Jorge", estado: "PR" }]}
          value={5}
          onChange={vi.fn()}
          disabled
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Jorge \(PR\)/)).toBeInTheDocument();
  });

  it("id selecionado com lista ainda vazia (carregando): mostra placeholder, sem texto inventado", () => {
    render(
      <MemoryRouter>
        <SelectTecnicoSearch
          tecnicos={[]}
          value={1}
          onChange={vi.fn()}
          disabled
          placeholder="Carregando…"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Carregando…")).toBeInTheDocument();
  });

  it("cidade com acentos: filtra pelo texto digitado (substring no nome", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={[
          { id: 1, nome: "Zé", cidade: "Araçatuba" },
        ]}
        value={undefined}
        onChange={vi.fn()}
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const input = screen.getByDisplayValue("");
    await user.type(input, "aça");
    expect(
      screen.getByRole("button", { name: /Zé/ }),
    ).toBeInTheDocument();
  });

  it("só subclienteCidade (sem subclienteEstado): ninguém ganha score 2/3; ordem cai no localeCompare do nome", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SelectTecnicoSearch
        tecnicos={[
          { id: 1, nome: "Zelda" },
          { id: 2, nome: "Mario" },
        ]}
        value={undefined}
        onChange={vi.fn()}
        subclienteCidade="Qualquer"
        placeholder="B"
      />,
    );
    await user.click(screen.getByPlaceholderText("B"));
    const labels = screen
      .getAllByRole("button")
      .map((b) => b.textContent ?? "")
      .filter((t) => t.includes("Mario") || t.includes("Zelda"));
    expect(labels[0]).toMatch(/Mario/);
  });
});
