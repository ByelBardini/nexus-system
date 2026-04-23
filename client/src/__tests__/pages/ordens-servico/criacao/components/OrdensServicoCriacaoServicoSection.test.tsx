import { useLayoutEffect, type MutableRefObject } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrdensServicoCriacaoServicoSection } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoServicoSection";
import {
  criacaoOsFormSchema,
  criacaoOsDefaultValues,
  type CriacaoOsFormData,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";
import type { AparelhoRastreadorList } from "@/pages/ordens-servico/criacao/ordens-servico-criacao.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/IdAparelhoSearch", () => ({
  IdAparelhoSearch: (p: {
    rastreadores: unknown[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <div
      data-testid="idap"
      data-rastreadores-count={p.rastreadores.length}
      data-value={p.value}
    >
      <input
        data-testid="idap-mirror"
        readOnly
        value={p.value}
        title={p.placeholder}
      />
      <button
        type="button"
        data-testid="idap-apply"
        onClick={() => p.onChange("RAST-99")}
      >
        aplicar
      </button>
    </div>
  ),
}));

type HarnessProps = {
  defaultValuesPatch?: Partial<CriacaoOsFormData>;
  showDetalhesRevisaoRetirada?: boolean;
  rastreadoresInstalados?: AparelhoRastreadorList[];
  onMountSetTipoError?: boolean;
  /** Sincronizado após o layout: use para getValues/asserções. */
  formRef?: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null>;
};

function ServicoSectionHarness({
  formRef,
  defaultValuesPatch,
  showDetalhesRevisaoRetirada = false,
  rastreadoresInstalados = [] as AparelhoRastreadorList[],
  onMountSetTipoError = false,
}: HarnessProps) {
  const f = useForm({
    resolver: zodResolver(criacaoOsFormSchema),
    defaultValues: { ...criacaoOsDefaultValues, ...defaultValuesPatch },
  });
  const tipo = f.watch("tipo");
  useLayoutEffect(() => {
    if (formRef) {
      formRef.current = f;
    }
    return () => {
      if (formRef) {
        formRef.current = null;
      }
    };
  }, [f, formRef]);
  useLayoutEffect(() => {
    if (!onMountSetTipoError) return;
    f.setError("tipo", { type: "manual", message: "Erro de validação" });
  }, [f, onMountSetTipoError]);
  return (
    <FormProvider {...f}>
      <OrdensServicoCriacaoServicoSection
        form={f}
        tipo={tipo}
        showDetalhesRevisaoRetirada={showDetalhesRevisaoRetirada}
        rastreadoresInstalados={rastreadoresInstalados}
      />
    </FormProvider>
  );
}

/**
 * O grid com as três categorias fica irmão imediato do rótulo "Tipo de Serviço".
 */
function getCategoriaGrid() {
  const label = screen.getByText(/tipo de serviço/i, { selector: "label" });
  return label.parentElement?.querySelector(".grid") as HTMLElement | null;
}

/** Cenário: formulário com REVISAO mas a prop `tipo` passada desincronizada (bug no pai). */
function ServicoComPropTipoIncompativel() {
  const f = useForm({
    resolver: zodResolver(criacaoOsFormSchema),
    defaultValues: { ...criacaoOsDefaultValues, tipo: "REVISAO" },
  });
  return (
    <FormProvider {...f}>
      <OrdensServicoCriacaoServicoSection
        form={f}
        tipo={undefined}
        showDetalhesRevisaoRetirada={false}
        rastreadoresInstalados={[]}
      />
    </FormProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("OrdensServicoCriacaoServicoSection", () => {
  it("a partir de REVISÃO, Instalação aplica INSTALACAO_COM_BLOQUEIO e o destaque acompanha o estado do formulário", async () => {
    const u = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null> = {
      current: null,
    };
    render(
      <ServicoSectionHarness
        formRef={formRef}
        defaultValuesPatch={{ tipo: "REVISAO" }}
      />,
    );
    const grid = getCategoriaGrid();
    expect(grid).toBeTruthy();
    const instBtn = within(grid!).getByRole("button", { name: /instalação/i });
    const revBtn = within(grid!).getByRole("button", { name: /revisão/i });
    expect(revBtn).toHaveClass("bg-erp-blue");
    expect(instBtn).not.toHaveClass("bg-erp-blue");

    await u.click(instBtn);
    expect(formRef.current?.getValues("tipo")).toBe("INSTALACAO_COM_BLOQUEIO");
    expect(instBtn).toHaveClass("bg-erp-blue");
    expect(
      screen.getByRole("button", { name: /^com bloqueio$/i }),
    ).toHaveClass("bg-erp-blue");
    expect(
      screen.getByRole("button", { name: /^sem bloqueio$/i }),
    ).not.toHaveClass("bg-erp-blue");
  });

  it("grava 'RETIRADA' e 'REVISAO' literais; Instalação não fica ativa nesses modos", async () => {
    const u = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null> = {
      current: null,
    };
    render(
      <ServicoSectionHarness
        formRef={formRef}
        defaultValuesPatch={{ tipo: "REVISAO" }}
      />,
    );
    const grid = getCategoriaGrid()!;
    await u.click(within(grid).getByRole("button", { name: /retirada/i }));
    expect(formRef.current?.getValues("tipo")).toBe("RETIRADA");
    const retBtn = within(grid).getByRole("button", { name: /retirada/i });
    const instMain = within(grid).getByRole("button", { name: /instalação/i });
    expect(retBtn).toHaveClass("bg-erp-blue");
    expect(instMain).not.toHaveClass("bg-erp-blue");

    await u.click(within(grid).getByRole("button", { name: /revisão/i }));
    expect(formRef.current?.getValues("tipo")).toBe("REVISAO");
    expect(
      within(grid).getByRole("button", { name: /revisão/i }),
    ).toHaveClass("bg-erp-blue");
  });

  it("em INSTALACAO_SEM_BLOQUEIO o card Instalação permanece ativo; o subdestaque fica em 'Sem bloqueio'", () => {
    const formRef: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null> = {
      current: null,
    };
    render(
      <ServicoSectionHarness
        formRef={formRef}
        defaultValuesPatch={{ tipo: "INSTALACAO_SEM_BLOQUEIO" }}
      />,
    );
    const grid = getCategoriaGrid()!;
    const instMain = within(grid).getByRole("button", { name: /instalação/i });
    expect(instMain).toHaveClass("bg-erp-blue");
    const semBloq = screen.getByRole("button", { name: /^sem bloqueio$/i });
    const comBloq = screen.getByRole("button", { name: /^com bloqueio$/i });
    expect(semBloq).toHaveClass("bg-erp-blue");
    expect(comBloq).not.toHaveClass("bg-erp-blue");
  });

  it("sub-botões com/sem bloqueio alternam o tipo sem desativar a categoria instalação", async () => {
    const u = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null> = {
      current: null,
    };
    render(
      <ServicoSectionHarness
        formRef={formRef}
        defaultValuesPatch={{ tipo: "INSTALACAO_COM_BLOQUEIO" }}
      />,
    );
    await u.click(screen.getByRole("button", { name: /^sem bloqueio$/i }));
    expect(formRef.current?.getValues("tipo")).toBe("INSTALACAO_SEM_BLOQUEIO");
    expect(
      screen.getByRole("button", { name: /^sem bloqueio$/i }),
    ).toHaveClass("bg-erp-blue");
    await u.click(screen.getByRole("button", { name: /^com bloqueio$/i }));
    expect(formRef.current?.getValues("tipo")).toBe("INSTALACAO_COM_BLOQUEIO");
    const grid = getCategoriaGrid()!;
    expect(
      within(grid).getByRole("button", { name: /instalação/i }),
    ).toHaveClass("bg-erp-blue");
  });

  it("com tipo legado (prefixo INSTALACAO_ fora de COM/SEM) mostra o sub-bloco sem subdestaque (evita falso 'com bloqueio')", () => {
    render(
      <ServicoSectionHarness
        defaultValuesPatch={{ tipo: "INSTALACAO_LEGACY" }}
      />,
    );
    const grid = getCategoriaGrid()!;
    expect(
      within(grid).getByRole("button", { name: /instalação/i }),
    ).toHaveClass("bg-erp-blue");
    const comBloq = screen.getByRole("button", { name: /^com bloqueio$/i });
    const semBloq = screen.getByRole("button", { name: /^sem bloqueio$/i });
    expect(comBloq).not.toHaveClass("bg-erp-blue");
    expect(semBloq).not.toHaveClass("bg-erp-blue");
  });

  it("com tipo vazio, nenhum card fica com destaque e o sub-bloco de instalação some", () => {
    render(
      <ServicoSectionHarness
        defaultValuesPatch={{ tipo: "" }}
      />,
    );
    const grid = getCategoriaGrid()!;
    for (const re of [/instalação/i, /revisão/i, /retirada/i]) {
      const btn = within(grid).getByRole("button", { name: re });
      expect(btn).not.toHaveClass("bg-erp-blue");
    }
    expect(screen.queryByRole("button", { name: /^com bloqueio$/i })).toBeNull();
  });

  it("com tipo inesperado (ex.: payload antigo 'DESLOCAMENTO'), nenhum card fica com destaque e não exibe sub-bloco de instalação", () => {
    render(
      <ServicoSectionHarness
        defaultValuesPatch={{ tipo: "DESLOCAMENTO" }}
      />,
    );
    const grid = getCategoriaGrid()!;
    for (const re of [/instalação/i, /revisão/i, /retirada/i]) {
      expect(
        within(grid).getByRole("button", { name: re }),
      ).not.toHaveClass("bg-erp-blue");
    }
    expect(screen.queryByRole("button", { name: /^com bloqueio$/i })).toBeNull();
  });

  it("desacoplamento: se o pai passar tipo=undefined, o destaque deixa de refletir o valor interno do RHF (regressão visível)", () => {
    render(<ServicoComPropTipoIncompativel />);
    const grid = getCategoriaGrid()!;
    const revBtn = within(grid).getByRole("button", { name: /revisão/i });
    expect(revBtn).not.toHaveClass("bg-erp-blue");
  });

  it("não monta IdAparelhoSearch quando showDetalhesRevisaoRetirada é false", () => {
    render(
      <ServicoSectionHarness
        defaultValuesPatch={{ tipo: "RETIRADA" }}
        showDetalhesRevisaoRetirada={false}
      />,
    );
    expect(screen.queryByTestId("idap")).toBeNull();
  });

  it("com detalhes: repassa rastreadores, espelha idAparelho no mock e aplica o valor (setValue) ao 'aplicar'", () => {
    const formRef: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null> = {
      current: null,
    };
    const rast: AparelhoRastreadorList[] = [
      { id: 1, tipo: "RAST", status: "OK" },
    ];
    render(
      <ServicoSectionHarness
        formRef={formRef}
        defaultValuesPatch={{ tipo: "RETIRADA", idAparelho: "EXISTING-ID" }}
        showDetalhesRevisaoRetirada
        rastreadoresInstalados={rast}
      />,
    );
    const idap = screen.getByTestId("idap");
    expect(idap).toHaveAttribute("data-rastreadores-count", "1");
    expect(idap).toHaveAttribute("data-value", "EXISTING-ID");
    expect(
      (screen.getByTestId("idap-mirror") as HTMLInputElement).value,
    ).toBe("EXISTING-ID");
  });

  it("integração: localInstalacao, idAparelho e pós-chave batem com getValues; toggle alterna vazio → SIM → NAO → …", async () => {
    const u = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null> = {
      current: null,
    };
    render(
      <ServicoSectionHarness
        formRef={formRef}
        defaultValuesPatch={{
          tipo: "RETIRADA",
          idAparelho: undefined,
          localInstalacao: "",
          posChave: "",
        }}
        showDetalhesRevisaoRetirada
      />,
    );
    const local = screen.getByPlaceholderText("Ex: PAINEL FRONTAL");
    await u.type(local, "PAINEL-TEST");
    expect(formRef.current?.getValues("localInstalacao")).toBe("PAINEL-TEST");
    await u.click(screen.getByTestId("idap-apply"));
    expect(formRef.current?.getValues("idAparelho")).toBe("RAST-99");
    const toggle = () =>
      screen.getByRole("button", { name: /^não$|^sim$/i });
    expect(toggle().textContent).toMatch(/não/i);
    await u.click(toggle());
    expect(formRef.current?.getValues("posChave")).toBe("SIM");
    expect(toggle().textContent).toMatch(/sim/i);
    await u.click(toggle());
    expect(formRef.current?.getValues("posChave")).toBe("NAO");
    expect(toggle().textContent).toMatch(/não/i);
  });

  it("pós-chave: valor inicial SIM alterna para NAO no primeiro clique (mostra o botão 'Sim' com destaque)", async () => {
    const u = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<CriacaoOsFormData> | null> = {
      current: null,
    };
    render(
      <ServicoSectionHarness
        formRef={formRef}
        defaultValuesPatch={{ tipo: "RETIRADA", posChave: "SIM" }}
        showDetalhesRevisaoRetirada
      />,
    );
    const btn = screen.getByRole("button", { name: /^sim$/i });
    expect(btn).toHaveClass("bg-erp-blue");
    await u.click(btn);
    expect(formRef.current?.getValues("posChave")).toBe("NAO");
  });

  it("erro de validação de tipo: mostra a mensagem do RHF e classe destrutiva", () => {
    render(
      <ServicoSectionHarness onMountSetTipoError />,
    );
    const msg = screen.getByText("Erro de validação");
    expect(msg).toHaveClass("text-destructive");
  });
});
