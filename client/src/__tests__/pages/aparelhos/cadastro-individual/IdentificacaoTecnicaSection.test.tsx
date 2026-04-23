import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdentificacaoTecnicaSection } from "@/pages/aparelhos/cadastro-individual/IdentificacaoTecnicaSection";
import { cadastroIndividualDefaultValues } from "@/pages/aparelhos/cadastro-individual/schema";
import type { FormDataCadastroIndividual } from "@/pages/aparelhos/cadastro-individual/schema";
import type {
  MarcaCatalog,
  MarcaModeloCatalog,
  MarcaSimcardRow,
  OperadoraCatalog,
} from "@/pages/aparelhos/shared/catalog.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden="true" />
  ),
}));

const marcasAtivas: MarcaCatalog[] = [
  { id: 1, nome: "MarcaA", ativo: true },
  { id: 2, nome: "MarcaB", ativo: true },
];

const modelosDisponiveis: MarcaModeloCatalog[] = [
  {
    id: 10,
    nome: "ModeloX",
    ativo: true,
    marca: { id: 1, nome: "MarcaA" },
  },
  {
    id: 11,
    nome: "ModeloY",
    ativo: true,
    marca: { id: 1, nome: "MarcaA" },
  },
];

const operadorasAtivas: OperadoraCatalog[] = [
  { id: 1, nome: "OpUm", ativo: true },
  { id: 2, nome: "OpDois", ativo: true },
];

const marcasSimcardComPlanos: MarcaSimcardRow[] = [
  {
    id: 1,
    nome: "Getrak",
    operadoraId: 1,
    temPlanos: true,
    operadora: { id: 1, nome: "OpUm" },
    planos: [
      { id: 100, planoMb: 50, ativo: true },
      { id: 101, planoMb: 128, ativo: false },
    ],
  },
  {
    id: 2,
    nome: "OutraMarca",
    operadoraId: 1,
    temPlanos: true,
    operadora: { id: 1, nome: "OpUm" },
    planos: [{ id: 200, planoMb: 10, ativo: true }],
  },
];

const marcasSimSemPlano: MarcaSimcardRow[] = [
  {
    id: 3,
    nome: "SemPlano",
    operadoraId: 1,
    temPlanos: false,
    operadora: { id: 1, nome: "OpUm" },
    planos: [],
  },
];

type HarnessProps = {
  overrides?: Partial<FormDataCadastroIndividual>;
  watchTipo?: "RASTREADOR" | "SIM";
  watchMarca?: string;
  watchOperadora?: string;
  watchIdentificador?: string;
  idJaExiste?: { identificador: string; lote?: { referencia: string } | null } | null;
  idValido?: boolean;
  modelosLocal?: MarcaModeloCatalog[];
  marcasSimLocal?: MarcaSimcardRow[];
};

function TecnicaHarness({
  overrides = {},
  watchTipo = "RASTREADOR",
  watchMarca = "",
  watchOperadora = "",
  watchIdentificador = "",
  idJaExiste = null,
  idValido = false,
  modelosLocal = modelosDisponiveis,
  marcasSimLocal = marcasSimcardComPlanos,
}: HarnessProps) {
  const form = useForm<FormDataCadastroIndividual>({
    defaultValues: {
      ...cadastroIndividualDefaultValues,
      ...overrides,
    },
  });
  return (
    <IdentificacaoTecnicaSection
      form={form}
      watchTipo={watchTipo}
      watchMarca={watchMarca}
      watchOperadora={watchOperadora}
      watchIdentificador={watchIdentificador}
      idJaExiste={idJaExiste}
      idValido={idValido}
      marcasAtivas={marcasAtivas}
      modelosDisponiveis={modelosLocal}
      operadorasAtivas={operadorasAtivas}
      marcasSimcardFiltradas={marcasSimLocal}
    />
  );
}

describe("IdentificacaoTecnicaSection", () => {
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

  it("ajusta o rótulo IMEI vs ICCID conforme o tipo (incluindo a mensagem de duplicata)", () => {
    const { rerender } = render(
      <TecnicaHarness
        watchTipo="RASTREADOR"
        idJaExiste={{ identificador: "x", lote: null }}
        idValido
        watchIdentificador="1"
      />,
    );
    expect(
      screen.getByText(/Atenção: Este IMEI já consta no sistema/),
    ).toBeInTheDocument();
    rerender(
      <TecnicaHarness
        watchTipo="SIM"
        idJaExiste={{ identificador: "x", lote: null }}
        idValido
        watchIdentificador="1"
        overrides={{ tipo: "SIM" }}
      />,
    );
    expect(
      screen.getByText(/Atenção: Este ICCID já consta no sistema/),
    ).toBeInTheDocument();
  });

  it("duplicata sem lote: mensagem base sem sufixo de lote; duplicata com lote inclui a referência", () => {
    const { rerender } = render(
      <TecnicaHarness
        idJaExiste={{ identificador: "1", lote: null }}
        idValido
        watchIdentificador="x"
      />,
    );
    expect(
      screen.getByText(/já consta no sistema/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Vinculado ao Lote/)).not.toBeInTheDocument();
    rerender(
      <TecnicaHarness
        idJaExiste={{ identificador: "1", lote: { referencia: "LOTE-Z" } }}
        idValido
        watchIdentificador="x"
      />,
    );
    expect(
      screen.getByText(/Vinculado ao Lote LOTE-Z/),
    ).toBeInTheDocument();
  });

  it("com duplicata, a borda do input continua de erro mesmo se idValido for true (duplicata tem prioridade)", () => {
    const { container } = render(
      <TecnicaHarness
        idJaExiste={{ identificador: "1", lote: null }}
        idValido
        watchIdentificador="123456789012345"
      />,
    );
    const input = container.querySelector("input");
    expect(input?.className).toMatch(/border-red-500/);
    expect(input?.className).not.toMatch(/emerald-500/);
  });

  it("não exibe o aviso âmbar de tamanho quando o identificador é só espaços (trim vazio)", () => {
    render(
      <TecnicaHarness
        idValido={false}
        watchIdentificador="   "
      />,
    );
    expect(
      screen.queryByText(/IMEI deve ter 15 dígitos/),
    ).not.toBeInTheDocument();
  });

  it("exige formato inválido (não vazio após trim) para mostrar o aviso âmbar", () => {
    render(
      <TecnicaHarness
        idJaExiste={null}
        idValido={false}
        watchIdentificador="12"
      />,
    );
    expect(
      screen.getByText(/IMEI deve ter 15 dígitos/),
    ).toBeInTheDocument();
  });

  it("id válido sem duplicata: borda e ícone de sucesso, sem mensagem de erro", () => {
    const { container } = render(
      <TecnicaHarness
        idJaExiste={null}
        idValido
        watchIdentificador="123456789012345"
      />,
    );
    const input = container.querySelector("input");
    expect(input?.className).toMatch(/emerald-500/);
    expect(container.querySelector('[data-icon="check_circle"]')).toBeInTheDocument();
    expect(
      screen.queryByText(/já consta no sistema/),
    ).not.toBeInTheDocument();
  });

  it("ao trocar tipo para SIM, zera rastreador e força INFINITY; ao voltar para RASTREADOR, zera campos de SIM", async () => {
    const user = userEvent.setup();
    const formRef: { current: ReturnType<typeof useForm<FormDataCadastroIndividual>> | null } = {
      current: null,
    };
    function TipoSinc() {
      const form = useForm<FormDataCadastroIndividual>({
        defaultValues: {
          ...cadastroIndividualDefaultValues,
          tipo: "RASTREADOR",
          marca: "MarcaA",
          modelo: "ModeloX",
          operadora: "OpUm",
        },
      });
      const tipoW = form.watch("tipo");
      const marcaW = form.watch("marca");
      const opW = form.watch("operadora");
      const idW = form.watch("identificador");
      formRef.current = form;
      return (
        <IdentificacaoTecnicaSection
          form={form}
          watchTipo={tipoW}
          watchMarca={marcaW}
          watchOperadora={opW}
          watchIdentificador={idW}
          idJaExiste={null}
          idValido={false}
          marcasAtivas={marcasAtivas}
          modelosDisponiveis={modelosDisponiveis}
          operadorasAtivas={operadorasAtivas}
          marcasSimcardFiltradas={marcasSimcardComPlanos}
        />
      );
    }
    render(<TipoSinc />);
    const f = formRef.current!;
    await user.click(screen.getAllByRole("combobox")[0]!);
    await user.click(await screen.findByRole("option", { name: /^Simcard$/i }));

    expect(f.getValues("tipo")).toBe("SIM");
    expect(f.getValues("marca")).toBe("");
    expect(f.getValues("modelo") ?? "").toBe("");
    expect(f.getValues("proprietario")).toBe("INFINITY");
    expect(f.getValues("clienteId")).toBeNull();

    await user.click(screen.getAllByRole("combobox")[0]!);
    await user.click(await screen.findByRole("option", { name: /^Rastreador$/i }));
    expect(f.getValues("tipo")).toBe("RASTREADOR");
    expect(f.getValues("operadora")).toBe("");
    expect(f.getValues("marcaSimcardId") ?? "").toBe("");
    expect(f.getValues("planoSimcardId") ?? "").toBe("");
  });

  it("rastreador: trocar marca dispara setValue e zera o modelo selecionado", async () => {
    const user = userEvent.setup();
    const formRef: { current: ReturnType<typeof useForm<FormDataCadastroIndividual>> | null } = {
      current: null,
    };
    function H() {
      const form = useForm<FormDataCadastroIndividual>({
        defaultValues: {
          ...cadastroIndividualDefaultValues,
          marca: "MarcaA",
          modelo: "ModeloX",
        },
      });
      const tipoW = form.watch("tipo");
      const marcaW = form.watch("marca");
      const opW = form.watch("operadora");
      const idW = form.watch("identificador");
      formRef.current = form;
      return (
        <IdentificacaoTecnicaSection
          form={form}
          watchTipo={tipoW}
          watchMarca={marcaW}
          watchOperadora={opW}
          watchIdentificador={idW}
          idJaExiste={null}
          idValido={false}
          marcasAtivas={marcasAtivas}
          modelosDisponiveis={modelosDisponiveis}
          operadorasAtivas={operadorasAtivas}
          marcasSimcardFiltradas={[]}
        />
      );
    }
    render(<H />);
    await user.click(screen.getAllByRole("combobox")[1]!);
    await user.click(await screen.findByRole("option", { name: "MarcaB" }));
    expect(formRef.current?.getValues("marca")).toBe("MarcaB");
    expect(formRef.current?.getValues("modelo") ?? "").toBe("");
  });

  it("rastreador: select de modelo fica desabilitado até existir marca", () => {
    render(
      <TecnicaHarness
        watchTipo="RASTREADOR"
        watchMarca=""
        overrides={{ marca: "", modelo: "" }}
      />,
    );
    expect(screen.getAllByRole("combobox")[2]!).toBeDisabled();
  });

  it("simcard: com operadora vazia, o select de marca do simcard fica desabilitado", () => {
    render(
      <TecnicaHarness
        watchTipo="SIM"
        watchOperadora=""
        overrides={{ tipo: "SIM", operadora: "" }}
      />,
    );
    const marcas = screen.getAllByRole("combobox");
    const marcaSimTrigger = marcas[2]!;
    expect(marcaSimTrigger).toBeDisabled();
  });

  it("simcard: trocar operadora zera marca e plano do simcard", async () => {
    const user = userEvent.setup();
    const formRef: { current: ReturnType<typeof useForm<FormDataCadastroIndividual>> | null } = {
      current: null,
    };
    function H() {
      const form = useForm<FormDataCadastroIndividual>({
        defaultValues: {
          ...cadastroIndividualDefaultValues,
          tipo: "SIM",
          operadora: "OpUm",
          marcaSimcardId: "1",
          planoSimcardId: "100",
        },
      });
      const tipoW = form.watch("tipo");
      const opW = form.watch("operadora");
      const idW = form.watch("identificador");
      formRef.current = form;
      return (
        <IdentificacaoTecnicaSection
          form={form}
          watchTipo={tipoW}
          watchMarca=""
          watchOperadora={opW}
          watchIdentificador={idW}
          idJaExiste={null}
          idValido={false}
          marcasAtivas={marcasAtivas}
          modelosDisponiveis={[]}
          operadorasAtivas={operadorasAtivas}
          marcasSimcardFiltradas={marcasSimcardComPlanos}
        />
      );
    }
    render(<H />);
    await user.click(screen.getAllByRole("combobox")[1]!);
    await user.click(await screen.findByRole("option", { name: "OpDois" }));
    const f = formRef.current!;
    expect(f.getValues("operadora")).toBe("OpDois");
    expect(f.getValues("marcaSimcardId") ?? "").toBe("");
    expect(f.getValues("planoSimcardId") ?? "").toBe("");
  });

  it("simcard: ao trocar a marca do simcard, o plano é resetado; ao escolher plano, o valor fica no formulário", async () => {
    const user = userEvent.setup();
    const formRef: { current: ReturnType<typeof useForm<FormDataCadastroIndividual>> | null } = {
      current: null,
    };
    function H() {
      const form = useForm<FormDataCadastroIndividual>({
        defaultValues: {
          ...cadastroIndividualDefaultValues,
          tipo: "SIM",
          operadora: "OpUm",
          marcaSimcardId: "1",
          planoSimcardId: "100",
        },
      });
      const tipoW = form.watch("tipo");
      const opW = form.watch("operadora");
      const idW = form.watch("identificador");
      formRef.current = form;
      return (
        <IdentificacaoTecnicaSection
          form={form}
          watchTipo={tipoW}
          watchMarca=""
          watchOperadora={opW}
          watchIdentificador={idW}
          idJaExiste={null}
          idValido={false}
          marcasAtivas={marcasAtivas}
          modelosDisponiveis={[]}
          operadorasAtivas={operadorasAtivas}
          marcasSimcardFiltradas={marcasSimcardComPlanos}
        />
      );
    }
    render(<H />);
    const combos = () => screen.getAllByRole("combobox");
    await user.click(combos()[2]!);
    await user.click(await screen.findByRole("option", { name: "OutraMarca" }));
    let f = formRef.current!;
    expect(f.getValues("marcaSimcardId")).toBe("2");
    expect(f.getValues("planoSimcardId") ?? "").toBe("");

    await user.click(combos()[2]!);
    await user.click(await screen.findByRole("option", { name: "Getrak" }));
    f = formRef.current!;
    await user.click(combos()[3]!);
    await user.click(await screen.findByRole("option", { name: "50 MB" }));
    expect(f.getValues("planoSimcardId")).toBe("100");
  });

  it("simcard: se a marca não tem planos (ou temPlanos false), o bloco Plano não é renderizado", () => {
    const { rerender } = render(
      <TecnicaHarness
        watchTipo="SIM"
        watchOperadora="OpUm"
        overrides={{
          tipo: "SIM",
          operadora: "OpUm",
          marcaSimcardId: "3",
        }}
        marcasSimLocal={marcasSimSemPlano}
      />,
    );
    expect(screen.queryByText(/^Plano$/i)).not.toBeInTheDocument();
    rerender(
      <TecnicaHarness
        watchTipo="SIM"
        watchOperadora="OpUm"
        overrides={{
          tipo: "SIM",
          operadora: "OpUm",
          marcaSimcardId: "1",
        }}
        marcasSimLocal={[
          {
            id: 1,
            nome: "SóNome",
            operadoraId: 1,
            temPlanos: true,
            operadora: { id: 1, nome: "OpUm" },
            planos: [],
          },
        ]}
      />,
    );
    expect(screen.queryByText(/^Plano$/i)).not.toBeInTheDocument();
  });
});
