import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import {
  useForm,
  type MutableRefObject,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { describe, expect, it } from "vitest";
import { AbaterDividaSection } from "@/pages/aparelhos/cadastro-individual/AbaterDividaSection";
import {
  cadastroIndividualDefaultValues,
  cadastroIndividualSchema,
  type FormDataCadastroIndividual,
} from "@/pages/aparelhos/cadastro-individual/schema";
import type { DebitoRastreadorApi } from "@/pages/aparelhos/shared/debito-rastreador";
import { formatDebitoLabel } from "@/pages/aparelhos/shared/debito-rastreador";
import { zodResolver } from "@hookform/resolvers/zod";

const debito1: DebitoRastreadorApi = {
  id: 7,
  devedorTipo: "INFINITY",
  devedorClienteId: null,
  devedorCliente: null,
  credorTipo: "INFINITY",
  credorClienteId: null,
  credorCliente: null,
  marcaId: 1,
  marca: { id: 1, nome: "A" },
  modeloId: 2,
  modelo: { id: 2, nome: "B" },
  quantidade: 1,
};

const debito2: DebitoRastreadorApi = {
  ...debito1,
  id: 99,
  marca: { id: 3, nome: "X" },
  modelo: { id: 4, nome: "Y" },
};

/** Raiz visual do card (para queries escopadas e menos frágeis). */
function getSectionCard() {
  const heading = screen.getByRole("heading", { name: /abater dívida/i });
  const card = heading.closest("div.bg-white");
  if (!card) {
    throw new Error("Card da seção não encontrado");
  }
  return card;
}

function Harness({
  abaterDivida = false,
  abaterDebitoId = null,
  debitos = [debito1],
  watchAbaterDivida,
  selectedDebito = null,
  withAbaterDebitoError = false,
  formRef,
}: {
  abaterDivida?: boolean;
  abaterDebitoId?: number | null;
  debitos?: DebitoRastreadorApi[];
  watchAbaterDivida?: boolean;
  selectedDebito?: DebitoRastreadorApi | null;
  withAbaterDebitoError?: boolean;
  formRef?: MutableRefObject<UseFormReturn<FormDataCadastroIndividual> | null>;
}) {
  const form = useForm<FormDataCadastroIndividual>({
    resolver: zodResolver(
      cadastroIndividualSchema,
    ) as Resolver<FormDataCadastroIndividual>,
    defaultValues: {
      ...cadastroIndividualDefaultValues,
      abaterDivida,
      abaterDebitoId,
    },
  });

  if (formRef) {
    formRef.current = form;
  }

  useEffect(() => {
    if (withAbaterDebitoError) {
      form.setError("abaterDebitoId", {
        type: "manual",
        message: "Erro validação débito",
      });
    }
  }, [withAbaterDebitoError, form]);

  return (
    <AbaterDividaSection
      form={form}
      debitosFiltrados={debitos}
      watchAbaterDivida={watchAbaterDivida ?? abaterDivida}
      selectedDebito={selectedDebito}
    />
  );
}

describe("AbaterDividaSection", () => {
  it("renderiza título quando existe débito", () => {
    render(<Harness />);
    expect(
      screen.getByRole("heading", { name: /abater dívida/i }),
    ).toBeInTheDocument();
  });

  it("não renderiza o card quando a lista de débitos é vazia", () => {
    render(<Harness debitos={[]} />);
    expect(
      screen.queryByRole("heading", { name: /abater dívida/i }),
    ).not.toBeInTheDocument();
  });

  it("ao ligar abaterDivida não zera abaterDebitoId (só ao desligar)", async () => {
    const user = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<FormDataCadastroIndividual> | null> =
      { current: null };

    render(
      <Harness
        formRef={formRef}
        abaterDivida={false}
        abaterDebitoId={7}
        watchAbaterDivida={false}
      />,
    );

    const toggle = within(getSectionCard()).getByRole("button");
    await user.click(toggle);

    expect(formRef.current?.getValues("abaterDivida")).toBe(true);
    expect(formRef.current?.getValues("abaterDebitoId")).toBe(7);
  });

  it("ao desligar abaterDivida zera abaterDebitoId e reflete estado no toggle", async () => {
    const user = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<FormDataCadastroIndividual> | null> =
      { current: null };

    render(
      <Harness
        formRef={formRef}
        abaterDivida
        abaterDebitoId={7}
        watchAbaterDivida
      />,
    );

    const card = getSectionCard();
    const toggle = within(card).getByRole("button");
    expect(toggle).toHaveClass("bg-amber-500");

    await user.click(toggle);

    expect(formRef.current?.getValues("abaterDivida")).toBe(false);
    expect(formRef.current?.getValues("abaterDebitoId")).toBeNull();
    expect(toggle).toHaveClass("bg-slate-300");

    await user.click(toggle);
    expect(formRef.current?.getValues("abaterDivida")).toBe(true);
    expect(toggle).toHaveClass("bg-amber-500");
  });

  it("quando watchAbaterDivida é falso, esconde o bloco de débito mesmo com abaterDivida true no form", () => {
    render(
      <Harness
        abaterDivida
        abaterDebitoId={7}
        watchAbaterDivida={false}
      />,
    );

    expect(screen.getByRole("heading", { name: /abater dívida/i })).toBeInTheDocument();
    expect(screen.queryByText(/Débito a Abater/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("permite escolher um débito, trocar para outro e grava número no formulário", async () => {
    const user = userEvent.setup();
    const formRef: MutableRefObject<UseFormReturn<FormDataCadastroIndividual> | null> =
      { current: null };

    render(
      <Harness
        formRef={formRef}
        abaterDivida
        watchAbaterDivida
        debitos={[debito1, debito2]}
      />,
    );

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);

    const label1 = formatDebitoLabel(debito1);
    const label2 = formatDebitoLabel(debito2);
    expect(screen.getByRole("option", { name: label1 })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: label2 })).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: label1 }));
    expect(formRef.current?.getValues("abaterDebitoId")).toBe(7);

    await user.click(combobox);
    await user.click(screen.getByRole("option", { name: label2 }));
    expect(formRef.current?.getValues("abaterDebitoId")).toBe(99);
  });

  it("com erro no campo débito, aplica destaque no trigger e mostra a mensagem", async () => {
    render(
      <Harness
        abaterDivida
        watchAbaterDivida
        withAbaterDebitoError
      />,
    );

    const trigger = await screen.findByRole("combobox");
    expect(trigger.className).toMatch(/border-red-500/);
    expect(screen.getByText("Erro validação débito")).toBeInTheDocument();
  });

  it("com abater ativo e sem selectedDebito, não mostra aviso de credor", () => {
    render(<Harness abaterDivida watchAbaterDivida selectedDebito={null} />);
    expect(
      screen.queryByText(/Este aparelho será vinculado ao credor/i),
    ).not.toBeInTheDocument();
  });

  it("exibe aviso com nome do credor quando selectedDebito tem credorCliente", () => {
    const comCredor: DebitoRastreadorApi = {
      ...debito1,
      credorCliente: { id: 1, nome: "Credor Teste" },
    };
    render(
      <Harness
        abaterDivida
        watchAbaterDivida
        selectedDebito={comCredor}
      />,
    );
    const notice = screen.getByText(/Este aparelho será vinculado ao credor/i);
    expect(notice).toBeInTheDocument();
    expect(within(notice).getByText("Credor Teste")).toBeInTheDocument();
  });

  it("exibe Infinity no aviso quando credor é Infinity (sem credorCliente)", () => {
    render(
      <Harness abaterDivida watchAbaterDivida selectedDebito={debito1} />,
    );
    const notice = screen.getByText(/Este aparelho será vinculado ao credor/i);
    expect(within(notice).getByText("Infinity")).toBeInTheDocument();
  });

  it("com um único débito, o select lista exatamente uma opção", async () => {
    const user = userEvent.setup();
    render(
      <Harness abaterDivida watchAbaterDivida debitos={[debito1]} />,
    );

    await user.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveAccessibleName(formatDebitoLabel(debito1));
  });

  it("com abaterDebitoId null, o combobox mostra o placeholder até haver seleção", () => {
    render(
      <Harness
        abaterDivida
        watchAbaterDivida
        abaterDebitoId={null}
        debitos={[debito1]}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent(
      /Selecione o débito/i,
    );
  });
});
