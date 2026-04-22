import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, within } from "@testing-library/react";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
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
  SelectClienteSearch: () => <div data-testid="select-cliente" />,
}));

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

describe("LoteIdentificacaoSection", () => {
  it("renderiza bloco com referência, NF e data", () => {
    render(<IdentForm />);
    expect(screen.getByText(/Identificação do Lote/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LT-2026-001/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument();
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

describe("LotePropriedadeTipoSection", () => {
  it("mostra aviso de Infinity para SIM e botões de tipo", () => {
    render(<PropSimSection />);
    expect(
      screen.getByText(/Simcards são sempre registrados no estoque da Infinity/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Rastreador$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Simcard$/i)).toBeInTheDocument();
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

describe("LoteIdentificadoresSection", () => {
  it("exibe resumo de válidos/duplicados (edge: duplicado)", () => {
    render(<IdSectionDup />);
    expect(screen.getByText(/Válidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicados/i)).toBeInTheDocument();
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
  it("exibe rótulo de valor total e total calculado (read-only)", () => {
    render(<ValoresWrap />);
    expect(screen.getByText(/Valor Total do Lote/i)).toBeInTheDocument();
    const readOnly = screen
      .getAllByRole("textbox")
      .find((el) => (el as HTMLInputElement).readOnly);
    expect(readOnly).toBeDefined();
    expect(readOnly).toHaveValue("200,00");
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
  it("exibe rótulos e esconde bloco de IDs se não houver válidos", () => {
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
});
