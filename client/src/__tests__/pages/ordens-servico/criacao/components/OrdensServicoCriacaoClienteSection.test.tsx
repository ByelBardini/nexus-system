import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrdensServicoCriacaoClienteSection } from "@/pages/ordens-servico/criacao/components/OrdensServicoCriacaoClienteSection";
import {
  criacaoOsFormSchema,
  criacaoOsDefaultValues,
  type CriacaoOsFormData,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";
import type { SubclienteFull } from "@/types/ordens-servico-criacao";

const pickSubclienteOnSelect = vi.hoisted(() => {
  let payload: SubclienteFull = { id: 1, nome: "default" };
  return {
    get: () => payload,
    set: (p: SubclienteFull) => {
      payload = p;
    },
  };
});

const selectClienteLastProps = vi.hoisted(() => ({
  value: undefined as number | undefined,
  clientes: [] as { id: number; nome: string }[],
}));

const cepLastOnAddressFound = vi.hoisted(() => ({
  lastPayload: null as {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    cep: string;
  } | null,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: (p: {
    clientes: { id: number; nome: string }[];
    value: number | undefined;
    onChange: (n: number | undefined) => void;
  }) => {
    selectClienteLastProps.clientes = p.clientes;
    selectClienteLastProps.value = p.value;
    return (
      <div data-testid="clisel" data-clisel-count={p.clientes.length} />
    );
  },
}));

vi.mock("@/components/InputCEP", () => ({
  InputCEP: (p: {
    onAddressFound: (a: {
      logradouro: string;
      bairro: string;
      localidade: string;
      uf: string;
      cep: string;
    }) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-cep"
      onClick={() => {
        const payload = {
          logradouro: "Av. Teste",
          bairro: "Bairro X",
          complemento: "Ap 1",
          localidade: "Campinas",
          uf: "SP",
          cep: "13000-000",
        };
        cepLastOnAddressFound.lastPayload = payload;
        p.onAddressFound(payload);
      }}
    >
      simular-cep
    </button>
  ),
}));

vi.mock("@/components/SubclienteNomeAutocomplete", () => ({
  SubclienteNomeAutocomplete: (p: {
    onSelect: (s: SubclienteFull) => void;
    onSelectNovo: () => void;
    onChange: (nome: string) => void;
  }) => (
    <div>
      <button
        type="button"
        data-testid="sub-on-select"
        onClick={() => p.onSelect(pickSubclienteOnSelect.get())}
      >
        disparar onSelect
      </button>
      <button type="button" data-testid="sub-on-novo" onClick={p.onSelectNovo}>
        disparar onSelectNovo
      </button>
      <button
        type="button"
        data-testid="sub-on-change"
        onClick={() => p.onChange("texto-ao-digitar")}
      >
        disparar onChange
      </button>
    </div>
  ),
}));

const ufs: { id: number; sigla: string; nome: string }[] = [];
const municipios: { nome: string; codigo_ibge: string }[] = [];

const clientesFixtures = [
  { id: 10, nome: "Transportadora A" },
  { id: 20, nome: "Cliente B" },
];

type RenderOpts = {
  defaultValues?: Partial<CriacaoOsFormData>;
  clientes?: typeof clientesFixtures;
  onSubclienteAddressFound?: (e: {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    cep: string;
  }) => void;
};

function renderComOrdemSincronizada({
  defaultValues,
  clientes = clientesFixtures,
  onSubclienteAddressFound = vi.fn(),
}: RenderOpts = {}) {
  const ref: { f: ReturnType<typeof useForm<CriacaoOsFormData>> | null } = {
    f: null,
  };
  function Wrapper() {
    const f = useForm<CriacaoOsFormData>({
      resolver: zodResolver(criacaoOsFormSchema),
      defaultValues: { ...criacaoOsDefaultValues, ...defaultValues },
    });
    ref.f = f;
    const ordem = f.watch("ordemInstalacao");
    return (
      <FormProvider {...f}>
        <OrdensServicoCriacaoClienteSection
          form={f}
          ordemInstalacao={ordem}
          clientes={clientes}
          subclientes={[]}
          ufs={ufs as never}
          municipios={municipios as never}
          onSubclienteAddressFound={onSubclienteAddressFound}
        />
      </FormProvider>
    );
  }
  const utils = render(<Wrapper />);
  const getForm = () => {
    if (!ref.f) throw new Error("form ref não preenchido");
    return ref.f;
  };
  return { ...utils, getForm, onSubclienteAddressFound };
}

beforeEach(() => {
  selectClienteLastProps.value = undefined;
  selectClienteLastProps.clientes = [];
  cepLastOnAddressFound.lastPayload = null;
  pickSubclienteOnSelect.set({ id: 1, nome: "default" });
});

describe("OrdensServicoCriacaoClienteSection", () => {
  describe("ordem de instalação Infinity × Cliente", () => {
    it("em modo Cliente, repassa a lista mapeada (id e nome) para a busca de cliente", () => {
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: { ordemInstalacao: "CLIENTE" },
      });
      expect(selectClienteLastProps.clientes).toEqual([
        { id: 10, nome: "Transportadora A" },
        { id: 20, nome: "Cliente B" },
      ]);
      expect(getForm().getValues("clienteOrdemId")).toBeUndefined();
    });

    it("ao escolher Infinity, remove vínculo com cliente da ordem e destrava cadastro de subcliente novo (sem apagar endereço já preenchido)", async () => {
      const u = userEvent.setup();
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: {
          ordemInstalacao: "CLIENTE",
          clienteOrdemId: 7,
          isNovoSubcliente: false,
          subclienteId: 3,
          subclienteLogradouro: "Rua que o usuário já tinha digitado",
          subclienteBairro: "Bairro Y",
        },
      });
      await u.click(screen.getByRole("button", { name: /^infinity$/i }));
      const v = getForm().getValues();
      expect(v.ordemInstalacao).toBe("INFINITY");
      expect(v.clienteOrdemId).toBeUndefined();
      expect(v.isNovoSubcliente).toBe(true);
      expect(v.subclienteId).toBeUndefined();
      expect(v.subclienteLogradouro).toBe("Rua que o usuário já tinha digitado");
      expect(v.subclienteBairro).toBe("Bairro Y");
    });

    it("ao escolher Cliente, força subcliente novo e limpa vínculo com subcliente existente (não zera clienteOrdemId se já existir)", async () => {
      const u = userEvent.setup();
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: {
          ordemInstalacao: "INFINITY",
          clienteOrdemId: 5,
          subclienteId: 5,
        },
      });
      await u.click(screen.getByRole("button", { name: /^cliente$/i }));
      const v = getForm().getValues();
      expect(v.ordemInstalacao).toBe("CLIENTE");
      expect(v.isNovoSubcliente).toBe(true);
      expect(v.subclienteId).toBeUndefined();
      expect(v.clienteOrdemId).toBe(5);
    });

    it("alterna a UI: só mostra busca de cliente e bloco de cobrança após selecionar ordem Cliente", async () => {
      const u = userEvent.setup();
      renderComOrdemSincronizada();
      expect(screen.queryByTestId("clisel")).not.toBeInTheDocument();
      expect(screen.queryByText(/^cobrança$/i)).not.toBeInTheDocument();
      await u.click(screen.getByRole("button", { name: /^cliente$/i }));
      expect(screen.getByTestId("clisel")).toBeInTheDocument();
      expect(screen.getByText(/^cobrança$/i)).toBeInTheDocument();
    });
  });

  describe("CEP e endereço (integração com callback do pai)", () => {
    it("repassa o retorno do InputCEP para onSubclienteAddressFound", async () => {
      const u = userEvent.setup();
      const onAddr = vi.fn();
      const { getForm } = renderComOrdemSincronizada({
        onSubclienteAddressFound: onAddr,
      });
      expect(getForm().getValues("subclienteCep")).toBe("");
      await u.click(screen.getByTestId("mock-cep"));
      expect(cepLastOnAddressFound.lastPayload).toEqual({
        logradouro: "Av. Teste",
        bairro: "Bairro X",
        complemento: "Ap 1",
        localidade: "Campinas",
        uf: "SP",
        cep: "13000-000",
      });
      expect(onAddr).toHaveBeenCalledTimes(1);
      expect(onAddr).toHaveBeenCalledWith(cepLastOnAddressFound.lastPayload);
    });
  });

  describe("subcliente: seleção, novo e digitação", () => {
    it("onSelect: preenche endereço e contato; cobrança cai no padrão INFINITY se cobrancaTipo vier nulo (API parcial)", async () => {
      const u = userEvent.setup();
      pickSubclienteOnSelect.set({
        id: 50,
        nome: "Apenas Nome",
        cobrancaTipo: null,
        cep: null,
        logradouro: null,
        bairro: null,
        cidade: null,
        estado: null,
        cpf: null,
        email: null,
        telefone: null,
        complemento: null,
        numero: null,
      });
      const { getForm } = renderComOrdemSincronizada();
      await u.click(screen.getByTestId("sub-on-select"));
      const v = getForm().getValues();
      expect(v.isNovoSubcliente).toBe(false);
      expect(v.subclienteId).toBe(50);
      expect(v.subclienteNome).toBe("Apenas Nome");
      expect(v.subclienteCep).toBe("");
      expect(v.subclienteLogradouro).toBe("");
      expect(v.subclienteCobranca).toBe("INFINITY");
    });

    it("onSelect: preserva cobrança do subcliente quando cobrancaTipo é CLIENTE", async () => {
      const u = userEvent.setup();
      pickSubclienteOnSelect.set({
        id: 99,
        nome: "Sub Nome",
        cobrancaTipo: "CLIENTE",
        cep: "01001-000",
        logradouro: "Rua A",
        numero: "10",
        complemento: "Sala 1",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cpf: "123",
        email: "a@b.c",
        telefone: "11999999999",
      });
      const { getForm } = renderComOrdemSincronizada();
      await u.click(screen.getByTestId("sub-on-select"));
      const v = getForm().getValues();
      expect(v.subclienteCobranca).toBe("CLIENTE");
      expect(v.subclienteCidade).toBe("São Paulo");
    });

    it("onSelectNovo: zera rastreio e endereço (fluxo de criar outro após selecionado)", async () => {
      const u = userEvent.setup();
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: {
          subclienteId: 1,
          isNovoSubcliente: false,
          subclienteNome: "Legado",
          subclienteCep: "13000-000",
          subclienteLogradouro: "Rua",
          subclienteNumero: "1",
          subclienteComplemento: "Cj",
          subclienteBairro: "B",
          subclienteCidade: "C",
          subclienteEstado: "SP",
          subclienteCpf: "000",
          subclienteEmail: "x@y.z",
          subclienteTelefone: "11",
        },
      });
      await u.click(screen.getByTestId("sub-on-novo"));
      const v = getForm().getValues();
      expect(v.isNovoSubcliente).toBe(true);
      expect(v.subclienteId).toBeUndefined();
      expect(v.subclienteNome).toBe("");
      expect(v.subclienteCep).toBe("");
      expect(v.subclienteLogradouro).toBe("");
      expect(v.subclienteNumero).toBe("");
      expect(v.subclienteComplemento).toBe("");
      expect(v.subclienteBairro).toBe("");
      expect(v.subclienteCidade).toBe("");
      expect(v.subclienteEstado).toBe("");
      expect(v.subclienteCpf).toBe("");
      expect(v.subclienteEmail).toBe("");
      expect(v.subclienteTelefone).toBe("");
    });

    it("onChange: se havia subcliente vinculado, digitando novo nome desfaz o vínculo e marca como cadastro novo", async () => {
      const u = userEvent.setup();
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: { subclienteId: 42, isNovoSubcliente: false },
      });
      await u.click(screen.getByTestId("sub-on-change"));
      expect(getForm().getValues("subclienteNome")).toBe("texto-ao-digitar");
      expect(getForm().getValues("subclienteId")).toBeUndefined();
      expect(getForm().getValues("isNovoSubcliente")).toBe(true);
    });

    it("onChange: sem subcliente vinculado, só atualiza o nome (não força isNovoSubcliente)", async () => {
      const u = userEvent.setup();
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: {
          subclienteId: undefined,
          isNovoSubcliente: true,
        },
      });
      const antes = getForm().getValues("isNovoSubcliente");
      await u.click(screen.getByTestId("sub-on-change"));
      expect(getForm().getValues("subclienteNome")).toBe("texto-ao-digitar");
      expect(getForm().getValues("isNovoSubcliente")).toBe(antes);
    });

    it("onChange: com subclienteId 0 (falsy), não entra no branch que desfaz vínculo — documenta semântica de form.watch", async () => {
      const u = userEvent.setup();
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: {
          subclienteId: 0,
          isNovoSubcliente: false,
        },
      });
      await u.click(screen.getByTestId("sub-on-change"));
      expect(getForm().getValues("subclienteNome")).toBe("texto-ao-digitar");
      expect(getForm().getValues("subclienteId")).toBe(0);
      expect(getForm().getValues("isNovoSubcliente")).toBe(false);
    });
  });

  describe("cobrança (somente ordem Cliente na UI)", () => {
    it("faz ida e volta entre as duas opções, mantendo o valor coerente no form (rótulos distintos do botão Infinity da ordem)", async () => {
      const u = userEvent.setup();
      const { getForm } = renderComOrdemSincronizada({
        defaultValues: { ordemInstalacao: "CLIENTE" },
      });
      expect(getForm().getValues("subclienteCobranca")).toBe("INFINITY");
      await u.click(
        screen.getByRole("button", { name: /direto cliente/i }),
      );
      expect(getForm().getValues("subclienteCobranca")).toBe("CLIENTE");
      await u.click(
        screen.getByRole("button", { name: /infinity \(padrão\)/i }),
      );
      expect(getForm().getValues("subclienteCobranca")).toBe("INFINITY");
    });

    it("não renderiza opções de cobrança enquanto a ordem for Infinity", () => {
      renderComOrdemSincronizada();
      expect(screen.queryByText(/^cobrança$/i)).not.toBeInTheDocument();
    });
  });
});
