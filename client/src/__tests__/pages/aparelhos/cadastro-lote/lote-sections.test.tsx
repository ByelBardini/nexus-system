import { zodResolver } from "@hookform/resolvers/zod";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, type ReactNode } from "react";
import { useForm, FormProvider, type Resolver, type UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { formatarMoeda, formatarMoedaDeCentavos } from "@/lib/format";
import type { ClienteLista } from "@/types/aparelhos-catalog";
import { LoteIdentificacaoSection } from "@/pages/aparelhos/cadastro-lote/LoteIdentificacaoSection";
import { LoteIdentificadoresSection } from "@/pages/aparelhos/cadastro-lote/LoteIdentificadoresSection";
import { LotePropriedadeTipoSection } from "@/pages/aparelhos/cadastro-lote/LotePropriedadeTipoSection";
import { LoteValoresSection } from "@/pages/aparelhos/cadastro-lote/LoteValoresSection";
import { LoteAbaterDividaSection } from "@/pages/aparelhos/cadastro-lote/LoteAbaterDividaSection";
import { LoteSimcardPlanoField } from "@/pages/aparelhos/cadastro-lote/LoteSimcardPlanoField";
import { CadastroLoteResumoPanel } from "@/pages/aparelhos/cadastro-lote/CadastroLoteResumoPanel";
import {
  loteFormDefaultValues,
  loteFormSchema,
  type LoteFormValues,
} from "@/pages/aparelhos/cadastro-lote/schema";
import type { DebitoRastreadorApi } from "@/pages/aparelhos/shared/debito-rastreador";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} />
  ),
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: ({
    onChange,
  }: {
    onChange: (id: number | undefined) => void;
  }) => (
    <button
      type="button"
      data-testid="select-cliente-apply"
      onClick={() => onChange(7)}
    >
      Aplicar cliente 7
    </button>
  ),
}));

function FormStateText<K extends keyof LoteFormValues>({
  form,
  name,
}: {
  form: UseFormReturn<LoteFormValues>;
  name: K;
}) {
  const v = form.watch(name);
  const text =
    v === null || v === undefined
      ? "null"
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
  return (
    <span className="sr-only" data-testid={`st-${String(name)}`}>
      {text}
    </span>
  );
}

type HarnessOpts = {
  defaultValues?: Partial<LoteFormValues>;
  children: (form: UseFormReturn<LoteFormValues>) => ReactNode;
};

function LoteTestHarness({ defaultValues, children }: HarnessOpts) {
  const f = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: { ...loteFormDefaultValues, ...defaultValues },
  });
  return <FormProvider {...f}>{children(f)}</FormProvider>;
}

function IdentForm() {
  const f = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: { ...loteFormDefaultValues, referencia: "X" },
  });
  return (
    <FormProvider {...f}>
      <LoteIdentificacaoSection form={f} />
    </FormProvider>
  );
}

function IdentFormComErroRef() {
  const f = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: { ...loteFormDefaultValues, referencia: "ok" },
  });
  useEffect(() => {
    f.setError("referencia", { type: "manual", message: "Referência inválida" });
  }, [f]);
  return (
    <FormProvider {...f}>
      <LoteIdentificacaoSection form={f} />
    </FormProvider>
  );
}

describe("LoteIdentificacaoSection", () => {
  it("renderiza bloco com referência, NF e data", () => {
    render(<IdentForm />);
    expect(screen.getByText(/Identificação do Lote/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LT-2026-001/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument();
  });

  it("sincroniza nota fiscal digitada com o react-hook-form", async () => {
    const user = userEvent.setup();
    render(
      <LoteTestHarness defaultValues={{ referencia: "OK", notaFiscal: "" }}>
        {(f) => (
          <>
            <LoteIdentificacaoSection form={f} />
            <FormStateText form={f} name="notaFiscal" />
          </>
        )}
      </LoteTestHarness>,
    );
    await user.type(
      screen.getByPlaceholderText(/123456/),
      "55",
    );
    expect(screen.getByTestId("st-notaFiscal")).toHaveTextContent("55");
  });

  it("exibe mensagem de erro de referência quando setError for aplicado", async () => {
    render(<IdentFormComErroRef />);
    expect(
      await screen.findByText("Referência inválida"),
    ).toBeInTheDocument();
  });
});

function PropSimSection() {
  const f = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: { ...loteFormDefaultValues, tipo: "SIM" },
  });
  return (
    <FormProvider {...f}>
      <LotePropriedadeTipoSection
        form={f}
        clientes={[]}
        marcasAtivas={[{ id: 1, nome: "A", ativo: true }]}
        operadorasAtivas={[{ id: 1, nome: "Op", ativo: true }]}
        modelosDisponiveis={[]}
        marcasSimcardFiltradas={[]}
        watchTipo="SIM"
        watchProprietario="INFINITY"
        watchMarca=""
        watchOperadora=""
        watchClienteId={null}
        watchMarcaSimcard={undefined}
      />
    </FormProvider>
  );
}

function PropRastreadorWrapper({
  defaultOverrides,
}: {
  defaultOverrides?: Partial<LoteFormValues>;
}) {
  const f = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: { ...loteFormDefaultValues, ...defaultOverrides },
  });
  const cliente: ClienteLista = { id: 7, nome: "Cliente Lote" };
  return (
    <FormProvider {...f}>
      <LotePropriedadeTipoSection
        form={f}
        clientes={[cliente]}
        marcasAtivas={[{ id: 10, nome: "MarcaX", ativo: true }]}
        operadorasAtivas={[{ id: 20, nome: "OpA", ativo: true }]}
        modelosDisponiveis={[
          {
            id: 30,
            nome: "ModY",
            ativo: true,
            marca: { id: 10, nome: "MarcaX" },
          },
        ]}
        marcasSimcardFiltradas={[
          {
            id: 40,
            nome: "MarcaSim",
            operadoraId: 20,
            temPlanos: true,
            operadora: { id: 20, nome: "OpA" },
            planos: [],
          },
        ]}
        watchTipo={f.watch("tipo")}
        watchProprietario={f.watch("proprietarioTipo")}
        watchMarca={f.watch("marca")}
        watchOperadora={f.watch("operadora")}
        watchClienteId={f.watch("clienteId")}
        watchMarcaSimcard={f.watch("marcaSimcard")}
      />
      <FormStateText form={f} name="proprietarioTipo" />
      <FormStateText form={f} name="clienteId" />
      <FormStateText form={f} name="tipo" />
      <FormStateText form={f} name="marca" />
      <FormStateText form={f} name="modelo" />
    </FormProvider>
  );
}

/** Duas marcas e modelos para testar reset de modelo ao trocar fabricante. */
function PropRastreadorDuasMarcas({
  defaultOverrides,
}: {
  defaultOverrides?: Partial<LoteFormValues>;
}) {
  const f = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: { ...loteFormDefaultValues, ...defaultOverrides },
  });
  return (
    <FormProvider {...f}>
      <LotePropriedadeTipoSection
        form={f}
        clientes={[]}
        marcasAtivas={[
          { id: 10, nome: "Alpha", ativo: true },
          { id: 11, nome: "Beta", ativo: true },
        ]}
        operadorasAtivas={[{ id: 20, nome: "OpA", ativo: true }]}
        modelosDisponiveis={[
          {
            id: 30,
            nome: "ModAlpha",
            ativo: true,
            marca: { id: 10, nome: "Alpha" },
          },
          {
            id: 31,
            nome: "ModBeta",
            ativo: true,
            marca: { id: 11, nome: "Beta" },
          },
        ]}
        marcasSimcardFiltradas={[]}
        watchTipo={f.watch("tipo")}
        watchProprietario={f.watch("proprietarioTipo")}
        watchMarca={f.watch("marca")}
        watchOperadora={f.watch("operadora")}
        watchClienteId={f.watch("clienteId")}
        watchMarcaSimcard={f.watch("marcaSimcard")}
      />
      <FormStateText form={f} name="marca" />
      <FormStateText form={f} name="modelo" />
    </FormProvider>
  );
}

function PropSimComOperadora() {
  const f = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: {
      ...loteFormDefaultValues,
      tipo: "SIM",
      operadora: "20",
    },
  });
  return (
    <FormProvider {...f}>
      <LotePropriedadeTipoSection
        form={f}
        clientes={[]}
        marcasAtivas={[]}
        operadorasAtivas={[{ id: 20, nome: "OpA", ativo: true }]}
        modelosDisponiveis={[]}
        marcasSimcardFiltradas={[
          {
            id: 40,
            nome: "Getrak",
            operadoraId: 20,
            temPlanos: false,
            operadora: { id: 20, nome: "OpA" },
            planos: [],
          },
        ]}
        watchTipo={f.watch("tipo")}
        watchProprietario={f.watch("proprietarioTipo")}
        watchMarca={f.watch("marca")}
        watchOperadora={f.watch("operadora")}
        watchClienteId={f.watch("clienteId")}
        watchMarcaSimcard={f.watch("marcaSimcard")}
      />
    </FormProvider>
  );
}

function PropRastreadorComErroMarca() {
  const f = useForm<LoteFormValues>({
    defaultValues: {
      ...loteFormDefaultValues,
      tipo: "RASTREADOR",
      proprietarioTipo: "INFINITY",
      marca: "",
    },
  });
  useEffect(() => {
    f.setError("marca", { type: "manual", message: "Marca custom error" });
  }, [f]);
  return (
    <FormProvider {...f}>
      <LotePropriedadeTipoSection
        form={f}
        clientes={[]}
        marcasAtivas={[{ id: 10, nome: "MarcaX", ativo: true }]}
        operadorasAtivas={[]}
        modelosDisponiveis={[]}
        marcasSimcardFiltradas={[]}
        watchTipo="RASTREADOR"
        watchProprietario="INFINITY"
        watchMarca=""
        watchOperadora=""
        watchClienteId={null}
        watchMarcaSimcard={undefined}
      />
    </FormProvider>
  );
}

function PropSimComErroOperadora() {
  const f = useForm<LoteFormValues>({
    defaultValues: {
      ...loteFormDefaultValues,
      tipo: "SIM",
      operadora: "20",
    },
  });
  useEffect(() => {
    f.setError("operadora", { type: "manual", message: "Operadora requerida" });
  }, [f]);
  return (
    <FormProvider {...f}>
      <LotePropriedadeTipoSection
        form={f}
        clientes={[]}
        marcasAtivas={[]}
        operadorasAtivas={[{ id: 20, nome: "OpA", ativo: true }]}
        modelosDisponiveis={[]}
        marcasSimcardFiltradas={[]}
        watchTipo="SIM"
        watchProprietario="INFINITY"
        watchMarca=""
        watchOperadora="20"
        watchClienteId={null}
        watchMarcaSimcard=""
      />
    </FormProvider>
  );
}

describe("LotePropriedadeTipoSection", () => {
  it("mostra aviso de Infinity para SIM e botões de tipo", () => {
    render(<PropSimSection />);
    expect(
      screen.getByText(/Simcards são sempre registrados no estoque da Infinity/i),
    ).toBeInTheDocument();
    const r = screen.getByRole("button", { name: /^Rastreador$/i });
    const s = screen.getByRole("button", { name: /^Simcard$/i });
    expect(r).toHaveAttribute("type", "button");
    expect(s).toHaveAttribute("type", "button");
  });

  it("no RASTREADOR, alterna para Cliente, define proprietário e permite escolher cliente (mock)", async () => {
    const user = userEvent.setup();
    render(
      <PropRastreadorWrapper
        defaultOverrides={{ tipo: "RASTREADOR", proprietarioTipo: "INFINITY" }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^Cliente$/i }));
    expect(screen.getByTestId("st-proprietarioTipo")).toHaveTextContent("CLIENTE");
    expect(screen.getByTestId("st-clienteId")).toHaveTextContent("null");
    await user.click(screen.getByTestId("select-cliente-apply"));
    await waitFor(() =>
      expect(screen.getByTestId("st-clienteId")).toHaveTextContent("7"),
    );
  });

  it("botão Infinity limpa o cliente selecionado (estado do form)", async () => {
    const user = userEvent.setup();
    render(
      <PropRastreadorWrapper
        defaultOverrides={{
          tipo: "RASTREADOR",
          proprietarioTipo: "CLIENTE",
          clienteId: 7,
        }}
      />,
    );
    expect(screen.getByTestId("st-clienteId")).toHaveTextContent("7");
    await user.click(screen.getByRole("button", { name: /^Infinity$/i }));
    await waitFor(() =>
      expect(screen.getByTestId("st-clienteId")).toHaveTextContent("null"),
    );
  });

  it("trocar SIM reseta rastreador, força estoque Infinity e exige fluxo de operadora", async () => {
    const user = userEvent.setup();
    render(
      <PropRastreadorWrapper
        defaultOverrides={{ tipo: "RASTREADOR", operadora: "", marca: "10" }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^Simcard$/i }));
    await waitFor(() =>
      expect(screen.getByTestId("st-tipo")).toHaveTextContent("SIM"),
    );
    expect(screen.getByTestId("st-proprietarioTipo")).toHaveTextContent(
      "INFINITY",
    );
    const marca = screen.getByTestId("st-marca").textContent;
    expect(
      marca === "" || marca === "null",
    ).toBe(true);
    const combos = screen.getAllByRole("combobox");
    expect(combos).toHaveLength(2);
    expect(combos[0]).not.toBeDisabled();
    expect(combos[1]).toBeDisabled();
  });

  it("ao mudar a marca no select, o modelo salvo no form é limpo (regra de dependência)", async () => {
    const user = userEvent.setup();
    render(
      <PropRastreadorDuasMarcas
        defaultOverrides={{
          tipo: "RASTREADOR",
          proprietarioTipo: "INFINITY",
          marca: "10",
          modelo: "30",
        }}
      />,
    );
    expect(screen.getByTestId("st-modelo")).toHaveTextContent("30");
    const combos = screen.getAllByRole("combobox");
    await user.click(combos[0]!);
    const beta = await screen.findByRole("option", { name: /^Beta$/i });
    await user.click(beta);
    await waitFor(() =>
      expect(screen.getByTestId("st-modelo")).toHaveTextContent(""),
    );
    expect(screen.getByTestId("st-marca")).toHaveTextContent("11");
  });

  it("exibe seletores de marca e modelo e mensagem de modelo quando Marca ainda vazia", () => {
    render(
      <PropRastreadorWrapper
        defaultOverrides={{
          tipo: "RASTREADOR",
          proprietarioTipo: "INFINITY",
          marca: "",
        }}
      />,
    );
    const [marca, modelo] = screen.getAllByRole("combobox");
    expect(marca).toBeInTheDocument();
    expect(marca).not.toBeDisabled();
    expect(modelo).toBeDisabled();
    expect(
      within(modelo.closest("div")!).getByText(
        /Selecione o fabricante primeiro/i,
      ),
    ).toBeInTheDocument();
  });

  it("em SIM com operadora, exibe placeholder de marca do simcard", () => {
    render(<PropSimComOperadora />);
    expect(
      screen.getByText(/Ex: Getrak, 1nce/i),
    ).toBeInTheDocument();
  });

  it("exibe mensagem de erro de marca (Controller fieldState) quando setError", async () => {
    render(<PropRastreadorComErroMarca />);
    expect(
      await screen.findByText("Marca custom error"),
    ).toBeInTheDocument();
  });

  it("exibe mensagem de erro de operadora (SIM) quando setError", async () => {
    render(<PropSimComErroOperadora />);
    expect(
      await screen.findByText("Operadora requerida"),
    ).toBeInTheDocument();
  });
});

function IdSectionDup() {
  const idV = "123456789012345";
  const f = { validos: [idV], duplicados: [idV], invalidos: [], jaExistentes: [] };
  const form = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema) as Resolver<LoteFormValues>,
    defaultValues: { ...loteFormDefaultValues, idsTexto: `${idV}\n${idV}` },
  });
  return (
    <FormProvider {...form}>
      <LoteIdentificadoresSection
        form={form}
        watchTipo="RASTREADOR"
        watchDefinirIds
        watchIdsTexto={`${idV}\n${idV}`}
        idValidation={f}
        erroQuantidade={null}
      />
    </FormProvider>
  );
}

function IdIccid() {
  const form = useForm<LoteFormValues>({
    defaultValues: { ...loteFormDefaultValues, tipo: "SIM" },
  });
  return (
    <FormProvider {...form}>
      <LoteIdentificadoresSection
        form={form}
        watchTipo="SIM"
        watchDefinirIds={false}
        watchIdsTexto=""
        idValidation={{
          validos: [],
          duplicados: [],
          invalidos: [],
          jaExistentes: [],
        }}
        erroQuantidade={null}
      />
    </FormProvider>
  );
}

function IdResumoFlags() {
  const form = useForm<LoteFormValues>({
    defaultValues: { ...loteFormDefaultValues, idsTexto: "x" },
  });
  return (
    <FormProvider {...form}>
      <LoteIdentificadoresSection
        form={form}
        watchTipo="RASTREADOR"
        watchDefinirIds
        watchIdsTexto="1"
        idValidation={{
          validos: [""],
          duplicados: [],
          invalidos: ["bad"],
          jaExistentes: ["taken"],
        }}
        erroQuantidade={null}
      />
    </FormProvider>
  );
}

function IdToggleQuant() {
  const form = useForm<LoteFormValues>({
    defaultValues: { ...loteFormDefaultValues, definirIds: false, quantidade: 3 },
  });
  return (
    <FormProvider {...form}>
      <LoteIdentificadoresSection
        form={form}
        watchTipo="RASTREADOR"
        watchDefinirIds={form.watch("definirIds")}
        watchIdsTexto={form.watch("idsTexto") ?? ""}
        idValidation={{
          validos: [],
          duplicados: [],
          invalidos: [],
          jaExistentes: [],
        }}
        erroQuantidade={null}
      />
      <FormStateText form={form} name="definirIds" />
      <FormStateText form={form} name="quantidade" />
    </FormProvider>
  );
}

function IdApenasEspacosNosIds() {
  const form = useForm<LoteFormValues>({
    defaultValues: { ...loteFormDefaultValues, idsTexto: "  \n\t  " },
  });
  return (
    <FormProvider {...form}>
      <LoteIdentificadoresSection
        form={form}
        watchTipo="RASTREADOR"
        watchDefinirIds
        watchIdsTexto={form.watch("idsTexto") ?? ""}
        idValidation={{
          validos: [],
          duplicados: [],
          invalidos: [],
          jaExistentes: [],
        }}
        erroQuantidade={null}
      />
    </FormProvider>
  );
}

describe("LoteIdentificadoresSection", () => {
  it("exibe resumo de válidos/duplicados: uma linha duplicada gera 1 válido e 1 duplicado (exibido)", () => {
    const { container } = render(<IdSectionDup />);
    const resumo = container.querySelector(".border-dashed");
    expect(resumo).toBeTruthy();
    const uns = resumo
      ? within(resumo as HTMLElement).getAllByText("1", { exact: true })
      : [];
    expect(uns.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Válidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicados/i)).toBeInTheDocument();
  });

  it("rotula identificadores como ICCID quando o tipo é SIM", () => {
    render(<IdIccid />);
    const h = screen.getByRole("heading", { level: 3 });
    expect(h).toHaveTextContent(/ICCID/);
  });

  it("exibe contadores de inválidos e já cadastrados quando o resumo de IDs é exibido", () => {
    render(<IdResumoFlags />);
    expect(screen.getByText(/Inválidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Já cadastrados/i)).toBeInTheDocument();
  });

  it("toggle Definir IDs atualiza o form; quantidade vazia no input vira 0 (parseInt com fallback)", async () => {
    const user = userEvent.setup();
    render(<IdToggleQuant />);
    expect(screen.getByTestId("st-definirIds")).toHaveTextContent("false");
    const defRow = screen.getByText(/Definir IDs agora\?/i).parentElement;
    const btn = defRow?.querySelector("button[type='button']");
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    await user.click(btn!);
    await waitFor(() =>
      expect(screen.getByTestId("st-definirIds")).toHaveTextContent("true"),
    );
    expect(
      await screen.findByPlaceholderText(/IMEIs/i),
    ).toBeInTheDocument();
    const qtd = document.querySelector('input[placeholder="0"]');
    expect(qtd).toBeInstanceOf(HTMLInputElement);
    fireEvent.change(qtd!, { target: { value: "" } });
    await waitFor(() =>
      expect(screen.getByTestId("st-quantidade")).toHaveTextContent("0"),
    );
  });

  it("não exibe a faixa de resumo (válidos/duplicados) quando ids do form são só whitespace (alinhado ao form.watch do fluxo real)", () => {
    const { container } = render(<IdApenasEspacosNosIds />);
    expect(container.querySelector(".border-dashed")).toBeNull();
  });

  it("mostra aviso de erro de quantidade quando fornecido", () => {
    const ErrQtd = () => {
      const form = useForm<LoteFormValues>({
        defaultValues: loteFormDefaultValues,
      });
      return (
        <FormProvider {...form}>
          <LoteIdentificadoresSection
            form={form}
            watchTipo="RASTREADOR"
            watchDefinirIds
            watchIdsTexto="x"
            idValidation={{
              validos: [""],
              duplicados: [],
              invalidos: [],
              jaExistentes: [],
            }}
            erroQuantidade="Quantidade informada (2) não corresponde"
          />
        </FormProvider>
      );
    };
    render(<ErrQtd />);
    expect(
      screen.getByText(/Quantidade informada \(2\)/i),
    ).toBeInTheDocument();
  });
});

function ValoresWrap() {
  const form = useForm<LoteFormValues>({
    defaultValues: {
      ...loteFormDefaultValues,
      valorUnitario: 10000,
    },
  });
  return (
    <FormProvider {...form}>
      <LoteValoresSection form={form} valorTotal={200} />
    </FormProvider>
  );
}

describe("LoteValoresSection", () => {
  it("exibe rótulo de valor total e total calculado (read-only) com o mesmo formato de formatarMoeda, sem o prefixo R$", () => {
    const valor = 200;
    const esperado = formatarMoeda(valor).replace("R$", "").trim();
    render(<ValoresWrap />);
    expect(screen.getByText(/Valor Total do Lote/i)).toBeInTheDocument();
    const readOnly = screen
      .getAllByRole("textbox")
      .find((el) => (el as HTMLInputElement).readOnly);
    expect(readOnly).toBeDefined();
    expect(readOnly).toHaveValue(esperado);
  });
});

const debitoMock: DebitoRastreadorApi = {
  id: 1,
  devedorTipo: "INFINITY",
  devedorClienteId: null,
  devedorCliente: null,
  credorTipo: "INFINITY",
  credorClienteId: null,
  credorCliente: null,
  marcaId: 1,
  marca: { id: 1, nome: "M" },
  modeloId: 1,
  modelo: { id: 1, nome: "X" },
  quantidade: 5,
};

const debitoComCredor: DebitoRastreadorApi = {
  ...debitoMock,
  credorCliente: { id: 8, nome: "Financeira Alfa" },
};

const debitoComCredor2: DebitoRastreadorApi = {
  ...debitoComCredor,
  id: 2,
  modelo: { id: 2, nome: "Z" },
  quantidade: 3,
};

function AbaterInterativo() {
  const form = useForm<LoteFormValues>({
    defaultValues: {
      ...loteFormDefaultValues,
      tipo: "RASTREADOR",
      abaterDivida: true,
      abaterDebitoId: 1,
      abaterQuantidade: 2,
    },
  });
  return (
    <FormProvider {...form}>
      <LoteAbaterDividaSection
        form={form}
        watchTipo={form.watch("tipo")}
        watchAbaterDivida={form.watch("abaterDivida")}
        watchAbaterDebitoId={form.watch("abaterDebitoId")}
        debitosFiltrados={[debitoComCredor]}
        selectedDebito={debitoComCredor}
        quantidadeFinal={5}
      />
    </FormProvider>
  );
}

function AbaterComErroDebito() {
  const form = useForm<LoteFormValues>({
    defaultValues: {
      ...loteFormDefaultValues,
      tipo: "RASTREADOR",
      abaterDivida: true,
    },
  });
  useEffect(() => {
    form.setError("abaterDebitoId", { message: "Escolha um débito" });
  }, [form]);
  return (
    <FormProvider {...form}>
      <LoteAbaterDividaSection
        form={form}
        watchTipo="RASTREADOR"
        watchAbaterDivida
        watchAbaterDebitoId={null}
        debitosFiltrados={[debitoComCredor]}
        selectedDebito={null}
        quantidadeFinal={2}
      />
    </FormProvider>
  );
}

function AbaterComErroQtd() {
  const form = useForm<LoteFormValues>({
    defaultValues: {
      ...loteFormDefaultValues,
      tipo: "RASTREADOR",
      abaterDivida: true,
      abaterDebitoId: 1,
      abaterQuantidade: null,
    },
  });
  useEffect(() => {
    form.setError("abaterQuantidade", { message: "Qtd inválida" });
  }, [form]);
  return (
    <FormProvider {...form}>
      <LoteAbaterDividaSection
        form={form}
        watchTipo="RASTREADOR"
        watchAbaterDivida
        watchAbaterDebitoId={1}
        debitosFiltrados={[debitoComCredor]}
        selectedDebito={debitoComCredor}
        quantidadeFinal={1}
      />
    </FormProvider>
  );
}

function AbaterEmpty() {
  const form = useForm<LoteFormValues>({
    defaultValues: loteFormDefaultValues,
  });
  return (
    <FormProvider {...form}>
      <LoteAbaterDividaSection
        form={form}
        watchTipo="RASTREADOR"
        watchAbaterDivida={false}
        watchAbaterDebitoId={null}
        debitosFiltrados={[]}
        selectedDebito={null}
        quantidadeFinal={1}
      />
    </FormProvider>
  );
}

function AbaterSimEdge() {
  const form = useForm<LoteFormValues>({ defaultValues: loteFormDefaultValues });
  return (
    <FormProvider {...form}>
      <LoteAbaterDividaSection
        form={form}
        watchTipo="SIM"
        watchAbaterDivida
        watchAbaterDebitoId={1}
        debitosFiltrados={[debitoMock]}
        selectedDebito={debitoMock}
        quantidadeFinal={1}
      />
    </FormProvider>
  );
}

describe("LoteAbaterDividaSection", () => {
  it("não renderiza nada se não houver débitos", () => {
    const { container } = render(<AbaterEmpty />);
    expect(container.firstChild).toBeNull();
  });

  it("não renderiza no modo SIM ainda com débitos (edge case)", () => {
    const { container } = render(<AbaterSimEdge />);
    expect(container.firstChild).toBeNull();
  });

  it("exibe vinculação ao credor, máximo e permite abrir o seletor de débito", async () => {
    const user = userEvent.setup();
    render(<AbaterInterativo />);
    const credorEls = await screen.findAllByText(/Financeira Alfa/);
    expect(credorEls.length).toBeGreaterThan(0);
    expect(screen.getByText(/máx:\s*5/)).toBeInTheDocument();
    const combo = screen.getByRole("combobox");
    await user.click(combo);
    expect(
      await screen.findByRole("option", { name: /Infinity deve 5x M X/ }),
    ).toBeInTheDocument();
  });

  it("exibe erro de validação do débito a abater", async () => {
    render(<AbaterComErroDebito />);
    expect(
      await screen.findByText("Escolha um débito"),
    ).toBeInTheDocument();
  });

  it("exibe erro de validação da quantidade a abater", async () => {
    render(<AbaterComErroQtd />);
    expect(await screen.findByText("Qtd inválida")).toBeInTheDocument();
  });

  it("ao trocar o débito no select, reexecuta onValueChange e zera a quantidade", async () => {
    const user = userEvent.setup();
    const lista = [debitoComCredor, debitoComCredor2];
    function ComDoisDebitos() {
      const form = useForm<LoteFormValues>({
        defaultValues: {
          ...loteFormDefaultValues,
          tipo: "RASTREADOR",
          abaterDivida: true,
          abaterDebitoId: 1,
          abaterQuantidade: 2,
        },
      });
      const abaterId = form.watch("abaterDebitoId");
      const selected =
        lista.find((d) => d.id === abaterId) ?? null;
      return (
        <FormProvider {...form}>
          <LoteAbaterDividaSection
            form={form}
            watchTipo="RASTREADOR"
            watchAbaterDivida={form.watch("abaterDivida")}
            watchAbaterDebitoId={abaterId}
            debitosFiltrados={lista}
            selectedDebito={selected}
            quantidadeFinal={5}
          />
        </FormProvider>
      );
    }
    render(<ComDoisDebitos />);
    const combo = screen.getByRole("combobox");
    await user.click(combo);
    const outro = await screen.findByRole("option", {
      name: /Z\s*→/,
    });
    await user.click(outro);
    const q = screen.getByPlaceholderText("0");
    expect(q).toHaveValue(null);
  });

  it("em quantidade a abater, valor vazio no input zera a quantidade", () => {
    function QtdVazia() {
      const form = useForm<LoteFormValues>({
        defaultValues: {
          ...loteFormDefaultValues,
          tipo: "RASTREADOR",
          abaterDivida: true,
          abaterDebitoId: 1,
          abaterQuantidade: 1,
        },
      });
      return (
        <FormProvider {...form}>
          <LoteAbaterDividaSection
            form={form}
            watchTipo="RASTREADOR"
            watchAbaterDivida
            watchAbaterDebitoId={1}
            debitosFiltrados={[debitoComCredor]}
            selectedDebito={debitoComCredor}
            quantidadeFinal={5}
          />
        </FormProvider>
      );
    }
    render(<QtdVazia />);
    const q = screen.getByPlaceholderText("0");
    fireEvent.change(q, { target: { value: "" } });
    expect(q).toHaveValue(null);
  });

  it("desliga o abatimento e zera abaterDivida, débito e quantidade no formulário", async () => {
    const user = userEvent.setup();
    function LigaAbater() {
      const form = useForm<LoteFormValues>({
        defaultValues: {
          ...loteFormDefaultValues,
          tipo: "RASTREADOR",
          abaterDivida: true,
          abaterDebitoId: 1,
          abaterQuantidade: 1,
        },
      });
      return (
        <FormProvider {...form}>
          <LoteAbaterDividaSection
            form={form}
            watchTipo="RASTREADOR"
            watchAbaterDivida={form.watch("abaterDivida")}
            watchAbaterDebitoId={form.watch("abaterDebitoId")}
            debitosFiltrados={[debitoComCredor]}
            selectedDebito={debitoComCredor}
            quantidadeFinal={2}
          />
          <FormStateText form={form} name="abaterDivida" />
          <FormStateText form={form} name="abaterDebitoId" />
          <FormStateText form={form} name="abaterQuantidade" />
        </FormProvider>
      );
    }
    render(<LigaAbater />);
    expect(screen.getByTestId("st-abaterDivida")).toHaveTextContent("true");
    const toggle = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("rounded-full"));
    expect(toggle).toBeDefined();
    await user.click(toggle!);
    expect(
      screen.queryByText(/Débito a Abater/i),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("st-abaterDivida")).toHaveTextContent("false");
      expect(screen.getByTestId("st-abaterDebitoId")).toHaveTextContent("null");
      expect(screen.getByTestId("st-abaterQuantidade")).toHaveTextContent("null");
    });
  });

  it("quando o credor do débito é Infinity, o texto de vínculo usa o fallback Infinity", () => {
    const debitoSóInfinity: DebitoRastreadorApi = {
      ...debitoComCredor,
      credorCliente: null,
    };
    function VinculoInfinity() {
      const form = useForm<LoteFormValues>({
        defaultValues: {
          ...loteFormDefaultValues,
          abaterDivida: true,
          abaterDebitoId: 1,
          abaterQuantidade: 1,
        },
      });
      return (
        <FormProvider {...form}>
          <LoteAbaterDividaSection
            form={form}
            watchTipo="RASTREADOR"
            watchAbaterDivida
            watchAbaterDebitoId={1}
            debitosFiltrados={[debitoSóInfinity]}
            selectedDebito={debitoSóInfinity}
            quantidadeFinal={1}
          />
        </FormProvider>
      );
    }
    const { container } = render(<VinculoInfinity />);
    const emStrong = Array.from(
      container.querySelectorAll("strong"),
    ).find((el) => el.textContent === "Infinity");
    expect(emStrong).toBeInstanceOf(HTMLElement);
  });

  it("máx. a abater respeita min(débito, quantidadeFinal||9999): lote 0 ainda limita a 9999, não ao débito", () => {
    const grande: DebitoRastreadorApi = {
      ...debitoComCredor,
      id: 3,
      quantidade: 50_000,
    };
    function Max9999() {
      const form = useForm<LoteFormValues>({
        defaultValues: {
          ...loteFormDefaultValues,
          abaterDivida: true,
          abaterDebitoId: 3,
          abaterQuantidade: 1,
        },
      });
      return (
        <FormProvider {...form}>
          <LoteAbaterDividaSection
            form={form}
            watchTipo="RASTREADOR"
            watchAbaterDivida
            watchAbaterDebitoId={3}
            debitosFiltrados={[grande]}
            selectedDebito={grande}
            quantidadeFinal={0}
          />
        </FormProvider>
      );
    }
    render(<Max9999 />);
    expect(screen.getByText(/máx:\s*9999/)).toBeInTheDocument();
  });
});

function PlanoSóInativos() {
  const form = useForm<LoteFormValues>({ defaultValues: loteFormDefaultValues });
  return (
    <FormProvider {...form}>
      <LoteSimcardPlanoField
        form={form}
        marcasSimcardFiltradas={[
          {
            id: 9,
            nome: "M",
            operadoraId: 1,
            temPlanos: true,
            operadora: { id: 1, nome: "O" },
            planos: [{ id: 1, planoMb: 100, ativo: false }],
          },
        ]}
        watchMarcaSimcard="9"
      />
    </FormProvider>
  );
}

function PlanoComAtivo() {
  const form = useForm<LoteFormValues>({
    defaultValues: { ...loteFormDefaultValues, planoSimcard: "" },
  });
  return (
    <FormProvider {...form}>
      <LoteSimcardPlanoField
        form={form}
        marcasSimcardFiltradas={[
          {
            id: 9,
            nome: "M",
            operadoraId: 1,
            temPlanos: true,
            operadora: { id: 1, nome: "O" },
            planos: [{ id: 2, planoMb: 50, ativo: true }],
          },
        ]}
        watchMarcaSimcard="9"
      />
    </FormProvider>
  );
}

describe("LoteSimcardPlanoField", () => {
  it("não exibe plano se só houver planos inativos", () => {
    const { container } = render(<PlanoSóInativos />);
    expect(container.querySelector('[role="combobox"]')).toBeNull();
  });

  it("exibe select de plano quando há plano ativo", () => {
    render(<PlanoComAtivo />);
    const plano = screen.getByText(/^Plano$/i);
    expect(
      within(plano.closest("div")!.parentElement!).getByRole("combobox"),
    ).toBeInTheDocument();
  });
});

describe("CadastroLoteResumoPanel", () => {
  it("esconde bloco de IDs se não houver válidos, mesmo com definirIds ativo", () => {
    render(
      <CadastroLoteResumoPanel
        watchReferencia="R1"
        watchNotaFiscal=""
        watchTipo="RASTREADOR"
        watchMarca="1"
        watchModelo="2"
        watchOperadora=""
        watchValorUnitario={1000}
        watchDefinirIds
        clienteSelecionado={undefined}
        marcasAtivas={[{ id: 1, nome: "M", ativo: true }]}
        modelosDisponiveis={[
          { id: 2, nome: "Mod", ativo: true, marca: { id: 1, nome: "M" } },
        ]}
        operadorasAtivas={[]}
        quantidadeFinal={0}
        valorTotal={0}
        idValidation={{ validos: [], duplicados: [], invalidos: [], jaExistentes: [] }}
      />,
    );
    expect(screen.getByText("R1")).toBeInTheDocument();
    expect(screen.queryByText(/IDs Válidos/i)).not.toBeInTheDocument();
  });

  it("marca ou modelo inexistente no catálogo aparece como em dash (—), não vazio", () => {
    render(
      <CadastroLoteResumoPanel
        watchReferencia="X"
        watchNotaFiscal="N"
        watchTipo="RASTREADOR"
        watchMarca="999"
        watchModelo="888"
        watchOperadora=""
        watchValorUnitario={100}
        watchDefinirIds={false}
        clienteSelecionado={undefined}
        marcasAtivas={[{ id: 1, nome: "M", ativo: true }]}
        modelosDisponiveis={[]}
        operadorasAtivas={[]}
        quantidadeFinal={1}
        valorTotal={1}
        idValidation={{ validos: [], duplicados: [], invalidos: [], jaExistentes: [] }}
      />,
    );
    const tracos = screen.getAllByText("—");
    expect(tracos.length).toBeGreaterThanOrEqual(2);
  });

  it("em lote SIM: o painel contém exatamente os textos de formatarMoeda* (normalizado) e NF com trim; IDs válidos", () => {
    const vu = 500;
    const total = 1500;
    const { container } = render(
      <CadastroLoteResumoPanel
        watchReferencia="L-SIM"
        watchNotaFiscal="  88  "
        watchTipo="SIM"
        watchMarca=""
        watchModelo=""
        watchOperadora="2"
        watchValorUnitario={vu}
        watchDefinirIds
        clienteSelecionado={{ id: 1, nome: "Cliente A" }}
        marcasAtivas={[]}
        modelosDisponiveis={[]}
        operadorasAtivas={[{ id: 2, nome: "Operadora B", ativo: true }]}
        quantidadeFinal={3}
        valorTotal={total}
        idValidation={{ validos: ["a"], duplicados: [], invalidos: [], jaExistentes: [] }}
      />,
    );
    const flat = (container.textContent ?? "").replace(/\s/g, "");
    const nu = formatarMoedaDeCentavos(vu).replace(/\s/g, "");
    const nt = formatarMoeda(total).replace(/\s/g, "");
    expect(flat).toContain(nu);
    expect(flat).toContain(nt);
    expect(screen.getByText(/Simcard/)).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("Operadora B")).toBeInTheDocument();
    expect(screen.getByText(/1 identificadores/i)).toBeInTheDocument();
  });
});
