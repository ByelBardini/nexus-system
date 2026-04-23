import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrdensServicoCriacaoHeader } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoHeader";
import { OrdensServicoCriacaoObservacoesSection } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoObservacoesSection";
import { OrdensServicoCriacaoVeiculoSection } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoVeiculoSection";
import { OrdensServicoCriacaoTecnicoSection } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoTecnicoSection";
import { OrdensServicoCriacaoSidebar } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoSidebar";
import { OrdensServicoCriacaoClienteSection } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoClienteSection";
import {
  criacaoOsFormSchema,
  criacaoOsDefaultValues,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";
import { mapCriacaoOsWatchFields } from "@/pages/ordens-servico/criacao/ordens-servico-criacao.derived";
import { computeCriacaoOsDerivedFlags } from "@/pages/ordens-servico/criacao/ordens-servico-criacao.derived";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/SelectTecnicoSearch", () => ({
  SelectTecnicoSearch: () => <div data-testid="stec" />,
}));

vi.mock("@/components/SubclienteNomeAutocomplete", () => ({
  SubclienteNomeAutocomplete: () => <div data-testid="subauto" />,
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: () => <div data-testid="clisel" />,
}));

vi.mock("@/components/InputCEP", () => ({
  InputCEP: (p: { onAddressFound: (a: { logradouro: string }) => void }) => (
    <button
      type="button"
      data-testid="mock-cep"
      onClick={() =>
        p.onAddressFound({
          logradouro: "L",
          bairro: "B",
          complemento: "",
          localidade: "C",
          uf: "SP",
          cep: "000",
        } as never)
      }
    >
      cep
    </button>
  ),
}));

function FormShell({
  defaultTipo = "REVISAO" as const,
  children,
}: {
  defaultTipo?: "REVISAO" | "RETIRADA" | "INSTALACAO_COM_BLOQUEIO";
  children: (f: ReturnType<typeof useForm>) => React.ReactNode;
}) {
  const f = useForm({
    resolver: zodResolver(criacaoOsFormSchema),
    defaultValues: { ...criacaoOsDefaultValues, tipo: defaultTipo },
  });
  return <FormProvider {...f}>{children(f)}</FormProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe("OrdensServicoCriacaoHeader", () => {
  it("desabilita emitir sem permissão", () => {
    const onEmit = vi.fn();
    render(
      <MemoryRouter>
        <OrdensServicoCriacaoHeader
          userName="A"
          canCreate={false}
          isFormValid
          isPending={false}
          onCancel={vi.fn()}
          onEmitir={onEmit}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: /emitir ordem/i }),
    ).toBeDisabled();
  });

  it("aciona onEmitir com permissão e formulário válido", async () => {
    const u = userEvent.setup();
    const onEmit = vi.fn();
    render(
      <MemoryRouter>
        <OrdensServicoCriacaoHeader
          userName="A"
          canCreate
          isFormValid
          isPending={false}
          onCancel={vi.fn()}
          onEmitir={onEmit}
        />
      </MemoryRouter>,
    );
    await u.click(screen.getByRole("button", { name: /emitir ordem/i }));
    expect(onEmit).toHaveBeenCalled();
  });
});

describe("OrdensServicoCriacaoObservacoesSection", () => {
  it("renderiza textarea vinculada", () => {
    render(
      <FormShell>
        {(f) => <OrdensServicoCriacaoObservacoesSection form={f} />}
      </FormShell>,
    );
    expect(document.querySelector("textarea")).toBeTruthy();
  });
});

describe("OrdensServicoCriacaoVeiculoSection", () => {
  it("mostra loader quando consultaPlacaLoading", () => {
    render(
      <FormShell>
        {(f) => (
          <OrdensServicoCriacaoVeiculoSection form={f} consultaPlacaLoading />
        )}
      </FormShell>,
    );
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });
});

describe("OrdensServicoCriacaoTecnicoSection", () => {
  it("exibe seletor e grid de preços", () => {
    render(
      <FormShell>
        {(f) => (
          <OrdensServicoCriacaoTecnicoSection
            form={f}
            tecnicos={[{ id: 1, nome: "T", precos: { revisao: 10 } }]}
            tecnicoSelecionado={{ id: 1, nome: "T", precos: { revisao: 10 } }}
          />
        )}
      </FormShell>,
    );
    expect(screen.getByTestId("stec")).toBeInTheDocument();
    expect(screen.getByText(/revisão/i)).toBeInTheDocument();
  });
});

describe("OrdensServicoCriacaoClienteSection", () => {
  it("chama onSubclienteAddressFound ao 'preencher' CEP mock", async () => {
    const u = userEvent.setup();
    const onAddr = vi.fn();
    render(
      <FormShell>
        {(f) => (
          <OrdensServicoCriacaoClienteSection
            form={f}
            ordemInstalacao="INFINITY"
            clientes={[]}
            subclientes={[]}
            ufs={[]}
            municipios={[]}
            onSubclienteAddressFound={onAddr}
          />
        )}
      </FormShell>,
    );
    await u.click(screen.getByTestId("mock-cep"));
    expect(onAddr).toHaveBeenCalled();
  });
});

function mockWatched() {
  const arr: (string | number | boolean | undefined)[] = new Array(15);
  arr[8] = "INFINITY";
  arr[11] = "ABC1";
  arr[12] = "M";
  arr[13] = "O";
  arr[14] = "INSTALACAO_COM_BLOQUEIO";
  return mapCriacaoOsWatchFields(arr);
}

describe("OrdensServicoCriacaoSidebar", () => {
  it("mostra resumo e checklist", () => {
    const watched = mockWatched();
    const derived = computeCriacaoOsDerivedFlags(watched, 1);
    render(
      <OrdensServicoCriacaoSidebar
        ordemInstalacao="INFINITY"
        clienteSelecionado={null}
        tipo="INSTALACAO_COM_BLOQUEIO"
        watched={watched}
        derived={derived}
        canCreate
        isPending={false}
        onEmitir={vi.fn()}
      />,
    );
    expect(screen.getByText(/resumo da ordem/i)).toBeInTheDocument();
    expect(screen.getByText(/checklist de validação/i)).toBeInTheDocument();
  });
});
