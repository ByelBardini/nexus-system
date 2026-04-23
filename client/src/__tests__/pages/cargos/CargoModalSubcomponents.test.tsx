import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { CargoModalFooter } from "@/pages/cargos/cargo-modal/CargoModalFooter";
import { CargoModalHeaderForm } from "@/pages/cargos/cargo-modal/CargoModalHeaderForm";
import { CargoModalSummary } from "@/pages/cargos/cargo-modal/CargoModalSummary";
import { CargoPermissionMatrix } from "@/pages/cargos/cargo-modal/CargoPermissionMatrix";
import { agruparPermissoes } from "@/pages/cargos/cargo-modal/permissionMatrix";
import type { CategoriaCargo, Permission } from "@/types/cargo";

const PH_NOME = "Ex: Operador Logístico Nível II";
const PH_DESC = "Breve descrição das responsabilidades...";

function StatefulCargoHeaderForm(props: {
  isNew: boolean;
  initialNome?: string;
  initialDescricao?: string;
  initialCategoria?: CategoriaCargo;
  initialAtivo?: boolean;
}): ReactElement {
  const {
    isNew,
    initialNome = "",
    initialDescricao = "",
    initialCategoria = "OPERACIONAL",
    initialAtivo = true,
  } = props;
  const [nome, setNome] = useState(initialNome);
  const [descricao, setDescricao] = useState(initialDescricao);
  const [categoria, setCategoria] = useState<CategoriaCargo>(initialCategoria);
  const [ativo, setAtivo] = useState(initialAtivo);

  return (
    <CargoModalHeaderForm
      isNew={isNew}
      nome={nome}
      descricao={descricao}
      categoria={categoria}
      ativo={ativo}
      onNomeChange={setNome}
      onDescricaoChange={setDescricao}
      onCategoriaChange={setCategoria}
      onAtivoChange={setAtivo}
    />
  );
}

describe("CargoModalHeaderForm", () => {
  describe("criação (isNew)", () => {
    it("não renderiza a linha de ativo: não chama onAtivoChange e não existe checkbox acessível", () => {
      const onAtivo = vi.fn();
      render(
        <CargoModalHeaderForm
          isNew
          nome=""
          descricao=""
          categoria="OPERACIONAL"
          ativo
          onNomeChange={vi.fn()}
          onDescricaoChange={vi.fn()}
          onCategoriaChange={vi.fn()}
          onAtivoChange={onAtivo}
        />,
      );

      expect(
        screen.queryByRole("checkbox", { name: /cargo ativo/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cargo ativo/i)).not.toBeInTheDocument();
      expect(onAtivo).not.toHaveBeenCalled();
    });
  });

  describe("exibição a partir das props (edição, sem abrir o select)", () => {
    it.each<{
      categoria: CategoriaCargo;
      textoVisivel: RegExp;
    }>([
      { categoria: "OPERACIONAL", textoVisivel: /operacional/i },
      { categoria: "ADMINISTRATIVO", textoVisivel: /administrativo/i },
      { categoria: "GESTAO", textoVisivel: /gestão/i },
    ])(
      "com categoria $categoria o gatilho do select mostra o rótulo humano no botão (Radix: combobox sem nome acessível)",
      ({ categoria, textoVisivel }) => {
        render(
          <CargoModalHeaderForm
            isNew={false}
            nome="n"
            descricao="d"
            categoria={categoria}
            ativo
            onNomeChange={vi.fn()}
            onDescricaoChange={vi.fn()}
            onCategoriaChange={vi.fn()}
            onAtivoChange={vi.fn()}
          />,
        );
        const combobox = screen.getByRole("combobox");
        expect(combobox).toBeVisible();
        expect(combobox).toHaveTextContent(textoVisivel);
      },
    );
  });

  describe("texto: onChange e propagação do valor (incl. edge cases)", () => {
    it("onNomeChange e onDescricaoChange recebem exatamente o string do evento (controlado, um disparo por change)", () => {
      const onNome = vi.fn();
      const onDesc = vi.fn();
      render(
        <CargoModalHeaderForm
          isNew
          nome="x"
          descricao="y"
          categoria="OPERACIONAL"
          ativo
          onNomeChange={onNome}
          onDescricaoChange={onDesc}
          onCategoriaChange={vi.fn()}
          onAtivoChange={vi.fn()}
        />,
      );
      const nomeEl = screen.getByPlaceholderText(PH_NOME);
      const descEl = screen.getByPlaceholderText(PH_DESC);
      const payloadNome = "Nome com acentuação ção e unicode α";
      const payloadDesc = `"'<&>`;
      fireEvent.change(nomeEl, { target: { value: payloadNome } });
      fireEvent.change(descEl, { target: { value: payloadDesc } });
      expect(onNome).toHaveBeenCalledOnce();
      expect(onNome).toHaveBeenCalledWith(payloadNome);
      expect(onDesc).toHaveBeenCalledOnce();
      expect(onDesc).toHaveBeenCalledWith(payloadDesc);
    });

    it('vazio: propagar string vazia (limpar o campo) dispara o handler com ""', () => {
      const onNome = vi.fn();
      render(
        <CargoModalHeaderForm
          isNew
          nome="pre"
          descricao=""
          categoria="OPERACIONAL"
          ativo
          onNomeChange={onNome}
          onDescricaoChange={vi.fn()}
          onCategoriaChange={vi.fn()}
          onAtivoChange={vi.fn()}
        />,
      );
      const nomeEl = screen.getByPlaceholderText(PH_NOME);
      fireEvent.change(nomeEl, { target: { value: "" } });
      expect(onNome).toHaveBeenCalledWith("");
    });

    it("fluxo integrado: digitação com estado no pai (como tela real) atualiza o valor exibido", async () => {
      const user = userEvent.setup();
      render(
        <StatefulCargoHeaderForm isNew initialNome="" initialDescricao="" />,
      );
      const nome = screen.getByPlaceholderText(PH_NOME);
      const desc = screen.getByPlaceholderText(PH_DESC);
      await user.type(nome, "Coord");
      expect(nome).toHaveValue("Coord");
      await user.clear(desc);
      await user.type(desc, "Suporte L2");
      expect(desc).toHaveValue("Suporte L2");
    });
  });

  describe("categoria: cada opção mapeia para a enum correta", () => {
    it.each<{
      inicial: CategoriaCargo;
      opcaoLabel: string;
      valorEsperado: CategoriaCargo;
    }>([
      {
        inicial: "OPERACIONAL",
        opcaoLabel: "Administrativo",
        valorEsperado: "ADMINISTRATIVO",
      },
      { inicial: "OPERACIONAL", opcaoLabel: "Gestão", valorEsperado: "GESTAO" },
      {
        inicial: "ADMINISTRATIVO",
        opcaoLabel: "Gestão",
        valorEsperado: "GESTAO",
      },
      {
        inicial: "ADMINISTRATIVO",
        opcaoLabel: "Operacional",
        valorEsperado: "OPERACIONAL",
      },
      {
        inicial: "GESTAO",
        opcaoLabel: "Operacional",
        valorEsperado: "OPERACIONAL",
      },
      {
        inicial: "GESTAO",
        opcaoLabel: "Administrativo",
        valorEsperado: "ADMINISTRATIVO",
      },
    ])(
      "de $inicial selecionando $opcaoLabel chama onCategoriaChange($valorEsperado)",
      async ({ inicial, opcaoLabel, valorEsperado }) => {
        const user = userEvent.setup();
        const onCategoriaChange = vi.fn();
        const onAtivoChange = vi.fn();
        render(
          <CargoModalHeaderForm
            isNew
            nome=""
            descricao=""
            categoria={inicial}
            ativo
            onNomeChange={vi.fn()}
            onDescricaoChange={vi.fn()}
            onCategoriaChange={onCategoriaChange}
            onAtivoChange={onAtivoChange}
          />,
        );
        await user.click(screen.getByRole("combobox"));
        await user.click(screen.getByRole("option", { name: opcaoLabel }));
        expect(onCategoriaChange).toHaveBeenCalledWith(valorEsperado);
        expect(onCategoriaChange).toHaveBeenCalledTimes(1);
        // Modo criação não renderiza o bloco "ativo" — trocar categoria jamais deve disparar isso
        expect(onAtivoChange).not.toHaveBeenCalled();
      },
    );

    it("quando o pai atualiza: o texto do gatilho acompanha a categoria (fluxo com estado)", async () => {
      const user = userEvent.setup();
      render(<StatefulCargoHeaderForm isNew initialCategoria="OPERACIONAL" />);
      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveTextContent(/operacional/i);
      await user.click(combobox);
      await user.click(screen.getByRole("option", { name: "Administrativo" }));
      await waitFor(() => {
        expect(screen.getByRole("combobox")).toHaveTextContent(
          /administrativo/i,
        );
      });
    });
  });

  describe("ativo (edição): onCheckedChange e estado controlado", () => {
    it("inativo → ativo: clique no rótulo; com estado no pai, o checkbox permanece alinhado ao `ativo`", async () => {
      const user = userEvent.setup();
      render(
        <StatefulCargoHeaderForm
          isNew={false}
          initialAtivo={false}
          initialNome="Coord"
        />,
      );
      const cb = screen.getByRole("checkbox", { name: /cargo ativo/i });
      expect(cb).not.toBeChecked();
      await user.click(screen.getByText(/desmarque para inativar/i));
      expect(cb).toBeChecked();
    });

    it("inativo → ativo: o handler do pai recebe exatamente true (spy)", async () => {
      const user = userEvent.setup();
      const onAtivo = vi.fn();
      render(
        <CargoModalHeaderForm
          isNew={false}
          nome="x"
          descricao=""
          categoria="OPERACIONAL"
          ativo={false}
          onNomeChange={vi.fn()}
          onDescricaoChange={vi.fn()}
          onCategoriaChange={vi.fn()}
          onAtivoChange={onAtivo}
        />,
      );
      await user.click(screen.getByLabelText(/cargo ativo/i));
      expect(onAtivo).toHaveBeenCalledTimes(1);
      expect(onAtivo).toHaveBeenCalledWith(true);
    });

    it("ativo → inativo: clique no checkbox chama onAtivoChange(false); com estado no pai, desmarca", async () => {
      const user = userEvent.setup();
      render(
        <StatefulCargoHeaderForm
          isNew={false}
          initialAtivo
          initialCategoria="GESTAO"
        />,
      );
      const cb = screen.getByRole("checkbox", { name: /cargo ativo/i });
      expect(cb).toBeChecked();
      await user.click(cb);
      expect(cb).not.toBeChecked();
    });

    it("mock do pai: ativo true → onAtivoChange(false) uma vez (sem estado, só contrato do callback)", async () => {
      const user = userEvent.setup();
      const onAtivo = vi.fn();
      render(
        <CargoModalHeaderForm
          isNew={false}
          nome=""
          descricao=""
          categoria="GESTAO"
          ativo
          onNomeChange={vi.fn()}
          onDescricaoChange={vi.fn()}
          onCategoriaChange={vi.fn()}
          onAtivoChange={onAtivo}
        />,
      );
      await user.click(screen.getByRole("checkbox", { name: /cargo ativo/i }));
      expect(onAtivo).toHaveBeenCalledTimes(1);
      expect(onAtivo).toHaveBeenCalledWith(false);
    });
  });
});

describe("CargoModalSummary", () => {
  it("mostra placeholder quando nome vazio e lista permissões", () => {
    render(
      <CargoModalSummary
        nome=""
        categoria="ADMINISTRATIVO"
        permissoesAtivas={["Visualizar Cargos"]}
        selectedCount={1}
      />,
    );
    expect(screen.getByText(/definir nome/i)).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText(/visualizar cargos/i)).toBeInTheDocument();
  });

  it("edge: mais de 10 permissões exibe continuação", () => {
    const many = Array.from({ length: 12 }, (_, i) => `Perm ${i}`);
    render(
      <CargoModalSummary
        nome="A"
        categoria="OPERACIONAL"
        permissoesAtivas={many}
        selectedCount={12}
      />,
    );
    expect(screen.getByText(/\+ 2 permissões/i)).toBeInTheDocument();
  });
});

describe("CargoModalFooter", () => {
  it("desabilita botões quando isPending", () => {
    render(<CargoModalFooter onClose={vi.fn()} onSave={vi.fn()} isPending />);
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /salvando/i })).toBeDisabled();
  });
});

describe("CargoPermissionMatrix", () => {
  it("colapsa setor ao clicar no cabeçalho", async () => {
    const user = userEvent.setup();
    const perms: Permission[] = [
      { id: 1, code: "ADMINISTRATIVO.CARGO.LISTAR" },
      { id: 2, code: "ADMINISTRATIVO.CARGO.CRIAR" },
    ];
    const estrutura = agruparPermissoes(perms);
    const onToggleSector = vi.fn();
    const { container } = render(
      <CargoPermissionMatrix
        estrutura={estrutura}
        expandedSectors={["ADMINISTRATIVO"]}
        selectedPermIds={[]}
        onToggleSectorExpanded={onToggleSector}
        onToggleAllSectorPermissions={vi.fn()}
        isSectorFullySelected={() => false}
        onTogglePermission={vi.fn()}
      />,
    );
    expect(container.querySelector("table")).toBeInTheDocument();

    await user.click(screen.getByText(/administrativo/i));
    expect(onToggleSector).toHaveBeenCalledWith("ADMINISTRATIVO");
  });
});
