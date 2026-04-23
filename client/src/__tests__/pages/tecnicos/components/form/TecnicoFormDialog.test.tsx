import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect, vi } from "vitest";
import type { EnderecoCEP, UF } from "@/hooks/useBrasilAPI";
import { TecnicoFormDialog } from "@/pages/tecnicos/components/form/TecnicoFormDialog";
import {
  emptyTecnicoFormValues,
  tecnicoFormSchema,
  type TecnicoFormData,
} from "@/pages/tecnicos/lib/tecnico-form";

const mockEnderecoCep: EnderecoCEP = {
  cep: "01001-000",
  logradouro: "Praça da Sé",
  complemento: "lado ímpar",
  bairro: "Sé",
  localidade: "São Paulo",
  uf: "SP",
};

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/InputCPFCNPJ", () => ({
  InputCPFCNPJ: (p: { value: string; onChange: (v: string) => void }) => (
    <input
      aria-label="cpf-cnpj"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputTelefone", () => ({
  InputTelefone: (p: { value: string; onChange: (v: string) => void }) => (
    <input
      aria-label="telefone"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/InputCEP", () => ({
  InputCEP: (p: { onAddressFound?: (e: EnderecoCEP) => void }) => (
    <button
      type="button"
      data-testid="cep-btn"
      onClick={() => p.onAddressFound?.(mockEnderecoCep)}
    >
      simular-cep
    </button>
  ),
}));

vi.mock("@/components/InputPreco", () => ({
  InputPreco: (p: { value: number; onChange: (v: number) => void }) => (
    <input
      type="number"
      aria-label="input-preco-field"
      value={p.value}
      onChange={(e) => p.onChange(Number(e.target.value))}
    />
  ),
}));

vi.mock("@/components/SelectUF", () => ({
  SelectUF: (p: { value: string; onChange: (v: string) => void }) => (
    <select
      aria-label="uf"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    >
      <option value="">--</option>
      <option value="SP">SP</option>
    </select>
  ),
}));

vi.mock("@/components/SelectCidade", () => ({
  SelectCidade: (p: { value: string; onChange: (v: string) => void }) => (
    <select
      aria-label="cidade"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    >
      <option value="">--</option>
    </select>
  ),
}));

const defaultUfs: UF[] = [
  {
    id: 35,
    sigla: "SP",
    nome: "SP",
    regiao: { id: 3, sigla: "SE", nome: "Sudeste" },
  },
];

const defaultWatched = {
  nome: "X",
  cidade: undefined,
  estado: undefined,
  instalacaoSemBloqueio: 0,
  revisao: 0,
  deslocamento: 0,
};

const editingTecnicoMock = {
  id: 1,
  nome: "Ed",
  cpfCnpj: null,
  telefone: null,
  cidade: null,
  estado: null,
  cep: null,
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  cidadeEndereco: null,
  estadoEndereco: null,
  latitude: null,
  longitude: null,
  geocodingPrecision: null,
  ativo: true,
} as const;

type HarnessProps = {
  editing: boolean;
  onSubmit: (data: TecnicoFormData) => void;
  onCloseSpy?: () => void;
  isSubmitting?: boolean;
  onAddressFound?: (e: EnderecoCEP) => void;
  defaultFormValues?: Partial<TecnicoFormData>;
};

/**
 * Imita o padrão da página: ao fechar, o pai deixa de renderizar o dialog (`open` → false).
 * Sem isso, `onClose` dispara mas o `Dialog` continua `open` no teste, mascarando bugs de estado.
 */
function DialogHarness({
  editing,
  onSubmit,
  onCloseSpy = vi.fn(),
  isSubmitting = false,
  onAddressFound = vi.fn(),
  defaultFormValues,
}: HarnessProps) {
  const [open, setOpen] = useState(true);
  const form = useForm<TecnicoFormData>({
    resolver: zodResolver(tecnicoFormSchema) as Resolver<TecnicoFormData>,
    defaultValues: {
      ...emptyTecnicoFormValues(),
      nome: "X",
      ...defaultFormValues,
    },
  });

  const handleClose = () => {
    onCloseSpy();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <TecnicoFormDialog
      open
      editingTecnico={editing ? editingTecnicoMock : null}
      onClose={handleClose}
      form={form}
      ufs={defaultUfs}
      municipios={[]}
      estadoAtuacao=""
      onAddressFound={onAddressFound}
      watchedResumo={defaultWatched}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

function OpenFromClosedHarness({
  onCloseSpy,
  onSubmit,
}: {
  onCloseSpy: () => void;
  onSubmit: (data: TecnicoFormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<TecnicoFormData>({
    resolver: zodResolver(tecnicoFormSchema) as Resolver<TecnicoFormData>,
    defaultValues: { ...emptyTecnicoFormValues(), nome: "X" },
  });
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        abrir-dialog
      </button>
      {open ? (
        <TecnicoFormDialog
          open
          editingTecnico={null}
          onClose={() => {
            onCloseSpy();
            setOpen(false);
          }}
          form={form}
          ufs={defaultUfs}
          municipios={[]}
          estadoAtuacao=""
          onAddressFound={vi.fn()}
          watchedResumo={defaultWatched}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      ) : null}
    </>
  );
}

function ClosedDialogHost() {
  const form = useForm<TecnicoFormData>({
    resolver: zodResolver(tecnicoFormSchema) as Resolver<TecnicoFormData>,
    defaultValues: { ...emptyTecnicoFormValues(), nome: "X" },
  });
  return (
    <TecnicoFormDialog
      open={false}
      editingTecnico={null}
      onClose={vi.fn()}
      form={form}
      ufs={defaultUfs}
      municipios={[]}
      estadoAtuacao=""
      onAddressFound={vi.fn()}
      watchedResumo={defaultWatched}
      onSubmit={vi.fn()}
      isSubmitting={false}
    />
  );
}

function headerHeading(dialog: HTMLElement, title: string) {
  const header = dialog.querySelector("header");
  expect(header).toBeTruthy();
  return within(header as HTMLElement).getByRole("heading", {
    level: 2,
    name: title,
  });
}

describe("TecnicoFormDialog", () => {
  it("com open=false não expõe o modal ao leitor de telas (sem role=dialog)", () => {
    render(<ClosedDialogHost />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exibe título e nome acessível coerentes com novo vs edição (apenas título visível no header)", () => {
    const { rerender } = render(
      <DialogHarness editing={false} onSubmit={vi.fn()} />,
    );
    const dialogNovo = screen.getByRole("dialog", { name: /Novo Técnico/i });
    expect(headerHeading(dialogNovo, "Novo Técnico")).toBeInTheDocument();

    rerender(<DialogHarness editing onSubmit={vi.fn()} />);
    const dialogEditar = screen.getByRole("dialog", {
      name: /Editar Técnico/i,
    });
    expect(headerHeading(dialogEditar, "Editar Técnico")).toBeInTheDocument();
  });

  it("associa o botão de salvar ao formulário via atributo form e dispara onSubmit com payload coerente", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DialogHarness editing={false} onSubmit={onSubmit} />);

    const formEl = document.getElementById("tecnico-form");
    expect(formEl?.tagName).toBe("FORM");

    const salvar = screen.getByRole("button", { name: /Salvar Técnico/i });
    expect(salvar).toHaveAttribute("form", "tecnico-form");
    expect(salvar).toHaveAttribute("type", "submit");

    await user.click(salvar);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      nome: "X",
      ativo: true,
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    });
  });

  it("não chama onSubmit quando o nome fica vazio; exibe o erro de validação do schema", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <DialogHarness
        editing={false}
        onSubmit={onSubmit}
        defaultFormValues={{ nome: "" }}
      />,
    );

    const nomeInput = screen.getByPlaceholderText("Ex: Ricardo Silva");
    expect(nomeInput).toHaveValue("");

    await user.click(screen.getByRole("button", { name: /Salvar Técnico/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Nome obrigatório")).toBeInTheDocument();
  });

  it("se o usuário corrigir o nome após erro, a submissão volta a ser aceita", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <DialogHarness
        editing={false}
        onSubmit={onSubmit}
        defaultFormValues={{ nome: "" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Salvar Técnico/i }));
    expect(await screen.findByText("Nome obrigatório")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ex: Ricardo Silva"),
      "Maria Técnica",
    );
    await user.click(screen.getByRole("button", { name: /Salvar Técnico/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0].nome).toBe("Maria Técnica");
  });

  it("Escape chama onClose uma vez e remove o dialog do DOM (estado alinhado ao pai)", async () => {
    const user = userEvent.setup();
    const onCloseSpy = vi.fn();
    render(
      <DialogHarness
        editing={false}
        onSubmit={vi.fn()}
        onCloseSpy={onCloseSpy}
      />,
    );
    const dialog = screen.getByRole("dialog");
    await user.click(dialog);
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("botão X do header: uma chamada a onClose e fechamento do modal", async () => {
    const user = userEvent.setup();
    const onCloseSpy = vi.fn();
    render(
      <DialogHarness
        editing={false}
        onSubmit={vi.fn()}
        onCloseSpy={onCloseSpy}
      />,
    );
    const closeInHeader = screen
      .getByRole("dialog")
      .querySelector("header button[type='button']");
    expect(closeInHeader).toBeTruthy();
    await user.click(closeInHeader!);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("Cancelar: mesma semântica de fechar (onClose e desmonte)", async () => {
    const user = userEvent.setup();
    const onCloseSpy = vi.fn();
    render(
      <DialogHarness
        editing={false}
        onSubmit={vi.fn()}
        onCloseSpy={onCloseSpy}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^Cancelar$/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("isSubmitting: botões do rodapé desativados, label de salvamento; ícone de fechar do header ainda encerra o fluxo", async () => {
    const user = userEvent.setup();
    const onCloseSpy = vi.fn();
    const onSubmit = vi.fn();
    render(
      <DialogHarness
        editing={false}
        onSubmit={onSubmit}
        onCloseSpy={onCloseSpy}
        isSubmitting
      />,
    );

    const salvar = screen.getByRole("button", { name: /Salvando/i });
    expect(salvar).toBeDisabled();
    expect(salvar).toHaveAttribute("form", "tecnico-form");
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeDisabled();

    await user.click(
      screen.getByRole("dialog").querySelector("header button")!,
    );
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("repõe o payload completo de endereço no callback onAddressFound (API ViaCEP)", async () => {
    const user = userEvent.setup();
    const onAddressFound = vi.fn();
    render(
      <DialogHarness
        editing={false}
        onSubmit={vi.fn()}
        onAddressFound={onAddressFound}
      />,
    );
    await user.click(screen.getByTestId("cep-btn"));
    expect(onAddressFound).toHaveBeenCalledTimes(1);
    expect(onAddressFound).toHaveBeenCalledWith(mockEnderecoCep);
  });

  it("fluxo: abrir em estado fechado → conteúdo acessível → fechar com Escape (sem onClose no ‘abrir’)", async () => {
    const user = userEvent.setup();
    const onCloseSpy = vi.fn();
    const onSubmit = vi.fn();
    render(
      <OpenFromClosedHarness onCloseSpy={onCloseSpy} onSubmit={onSubmit} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir-dialog/i }));
    const dialog = await screen.findByRole("dialog");
    expect(onCloseSpy).not.toHaveBeenCalled();

    await user.click(dialog);
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });
});
