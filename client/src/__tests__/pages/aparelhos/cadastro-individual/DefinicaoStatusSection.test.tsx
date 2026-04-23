import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefinicaoStatusSection } from "@/pages/aparelhos/cadastro-individual/DefinicaoStatusSection";
import { cadastroIndividualDefaultValues } from "@/pages/aparelhos/cadastro-individual/schema";
import type { FormDataCadastroIndividual } from "@/pages/aparelhos/cadastro-individual/schema";
import {
  CATEGORIAS_FALHA,
  DESTINOS_DEFEITO,
} from "@/pages/aparelhos/cadastro-individual/constants";
import type { StatusAparelho } from "@/pages/aparelhos/cadastro-individual/constants";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden="true" />
  ),
}));

const allStatuses: StatusAparelho[] = ["NOVO_OK", "EM_MANUTENCAO", "CANCELADO_DEFEITO"];

function DefinicaoHarness({
  defaultStatus = "EM_MANUTENCAO" as StatusAparelho,
  watchStatus,
  statusDisponiveis = allStatuses,
  onFormReady,
}: {
  defaultStatus?: StatusAparelho;
  watchStatus: string;
  statusDisponiveis?: StatusAparelho[];
  onFormReady?: (f: ReturnType<typeof useForm<FormDataCadastroIndividual>>) => void;
}) {
  const form = useForm<FormDataCadastroIndividual>({
    defaultValues: {
      ...cadastroIndividualDefaultValues,
      status: defaultStatus,
      categoriaFalha: "FALHA_COMUNICACAO",
      destinoDefeito: "LABORATORIO",
    },
  });
  onFormReady?.(form);
  return (
    <DefinicaoStatusSection
      form={form}
      statusDisponiveis={statusDisponiveis}
      watchStatus={watchStatus}
    />
  );
}

describe("DefinicaoStatusSection", () => {
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("atualiza o campo status no formulário ao clicar em cada opção disponível", async () => {
    const user = userEvent.setup();
    const formRef: { current: ReturnType<typeof useForm<FormDataCadastroIndividual>> | null } = {
      current: null,
    };
    function H() {
      const form = useForm<FormDataCadastroIndividual>({
        defaultValues: { ...cadastroIndividualDefaultValues, status: "EM_MANUTENCAO" },
      });
      formRef.current = form;
      return (
        <DefinicaoStatusSection
          form={form}
          statusDisponiveis={allStatuses}
          watchStatus="EM_MANUTENCAO"
        />
      );
    }
    render(<H />);
    const f = formRef.current!;

    await user.click(screen.getByRole("button", { name: /Novo.*OK/i }));
    expect(f.getValues("status")).toBe("NOVO_OK");

    await user.click(screen.getByRole("button", { name: /Em Manutenção/i }));
    expect(f.getValues("status")).toBe("EM_MANUTENCAO");

    await user.click(screen.getByRole("button", { name: /Cancelado.*Defeito/i }));
    expect(f.getValues("status")).toBe("CANCELADO_DEFEITO");
  });

  it("com status CANCELADO_DEFEITO, o botão correspondente exibe estado selecionado (anel / cor de destaque)", async () => {
    const user = userEvent.setup();
    const formRef: { current: ReturnType<typeof useForm<FormDataCadastroIndividual>> | null } = {
      current: null,
    };
    function H() {
      const form = useForm<FormDataCadastroIndividual>({
        defaultValues: { ...cadastroIndividualDefaultValues, status: "EM_MANUTENCAO" },
      });
      formRef.current = form;
      return (
        <DefinicaoStatusSection
          form={form}
          statusDisponiveis={allStatuses}
          watchStatus="EM_MANUTENCAO"
        />
      );
    }
    render(<H />);
    const cancelBefore = screen.getByRole("button", { name: /Cancelado.*Defeito/i });
    expect(cancelBefore.className).toMatch(/opacity-60/);
    await user.click(cancelBefore);
    expect(formRef.current!.getValues("status")).toBe("CANCELADO_DEFEITO");
    const cancelAfter = screen.getByRole("button", { name: /Cancelado.*Defeito/i });
    expect(cancelAfter.className).toMatch(/ring-1/);
    expect(cancelAfter.className).toMatch(/border-red/);
  });

  it("persiste categoriaFalha e destinoDefeito no formulário após escolha nos selects", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useForm<FormDataCadastroIndividual>> | null = null;
    render(
      <DefinicaoHarness
        defaultStatus="CANCELADO_DEFEITO"
        watchStatus="CANCELADO_DEFEITO"
        onFormReady={(f) => {
          api = f;
        }}
      />,
    );
    const cat = CATEGORIAS_FALHA[2]!;
    const dest = DESTINOS_DEFEITO[1]!;
    const [catCombo, destCombo] = screen.getAllByRole("combobox");

    await user.click(catCombo!);
    await user.click(await screen.findByRole("option", { name: cat.label }));
    expect(api!.getValues("categoriaFalha")).toBe(cat.value);

    await user.click(destCombo!);
    await user.click(await screen.findByRole("option", { name: dest.label }));
    expect(api!.getValues("destinoDefeito")).toBe(dest.value);
  });

  it("exige watchStatus === CANCELADO_DEFEITO para o bloco de defeito: ignora desincronização se o form ainda está em cancelado mas o pai ainda não acompanhou", () => {
    render(
      <DefinicaoHarness
        defaultStatus="CANCELADO_DEFEITO"
        watchStatus="EM_MANUTENCAO"
      />,
    );
    expect(
      screen.queryByText(/Detalhamento de Defeito Requerido/i),
    ).not.toBeInTheDocument();
  });

  it("com subconjunto de status (só Novo e Em manutenção), não oferece botão Cancelado e não mostra defeito", () => {
    render(
      <DefinicaoHarness
        watchStatus="EM_MANUTENCAO"
        statusDisponiveis={["NOVO_OK", "EM_MANUTENCAO"]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Cancelado.*Defeito/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Detalhamento de Defeito Requerido/i),
    ).not.toBeInTheDocument();
  });

  it("com watch CANCELADO_DEFEITO, mostra o bloco vermelho com rótulos dos selects", () => {
    render(
      <DefinicaoHarness defaultStatus="CANCELADO_DEFEITO" watchStatus="CANCELADO_DEFEITO" />,
    );
    const panel = screen.getByText(/Detalhamento de Defeito Requerido/i).closest("div")
      ?.parentElement;
    expect(panel).toBeTruthy();
    expect(within(panel as HTMLElement).getByText("Categoria de Falha")).toBeInTheDocument();
    expect(within(panel as HTMLElement).getByText("Destino Imediato")).toBeInTheDocument();
  });
});
