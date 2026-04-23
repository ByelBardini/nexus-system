import { describe, it, expect, vi } from "vitest";
import {
  isDadosSubclienteCompletos,
  resolveSubclienteIdFromForm,
  buildSubclienteCreate,
  buildSubclienteUpdate,
  precheckCriacaoOs,
  trimObservacoes,
  buildCriarOrdemServicoPayload,
  hasVeiculoDataCompletoParaApi,
  buscarOuCriarVeiculoId,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.payload";
import { criacaoOsDefaultValues } from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";
import type { CriacaoOsFormData } from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";

const base = (): CriacaoOsFormData => ({
  ...criacaoOsDefaultValues,
  tipo: "INSTALACAO_COM_BLOQUEIO",
  subclienteNome: "João",
  subclienteCep: "01310100",
  subclienteCidade: "São Paulo",
  subclienteEstado: "SP",
  subclienteTelefone: "11999999999",
  ordemInstalacao: "INFINITY",
  isNovoSubcliente: true,
});

describe("isDadosSubclienteCompletos", () => {
  it("retorna true quando telefone tem ≥10 dígitos e campos mínimos", () => {
    expect(
      isDadosSubclienteCompletos({
        ...base(),
        subclienteTelefone: "(11) 99999-9999",
      }),
    ).toBe(true);
  });

  it("retorna false se faltar cidade", () => {
    expect(
      isDadosSubclienteCompletos({ ...base(), subclienteCidade: "" }),
    ).toBe(false);
  });

  it("retorna false se telefone tiver <10 dígitos", () => {
    expect(
      isDadosSubclienteCompletos({
        ...base(),
        subclienteTelefone: "123",
      }),
    ).toBe(false);
  });
});

describe("resolveSubclienteIdFromForm", () => {
  it("retorna id quando existente e não é novo", () => {
    expect(
      resolveSubclienteIdFromForm({
        ...base(),
        isNovoSubcliente: false,
        subclienteId: 7,
      }),
    ).toBe(7);
  });

  it("retorna undefined para novo subcliente", () => {
    expect(resolveSubclienteIdFromForm(base())).toBeUndefined();
  });

  it("retorna undefined se id for zero", () => {
    expect(
      resolveSubclienteIdFromForm({
        ...base(),
        isNovoSubcliente: false,
        subclienteId: 0,
      }),
    ).toBeUndefined();
  });
});

describe("buildSubclienteCreate / buildSubclienteUpdate", () => {
  it("cobrança INFINITY força INFINITY no create", () => {
    const p = buildSubclienteCreate({
      ...base(),
      ordemInstalacao: "INFINITY",
    });
    expect(p?.cobrancaTipo).toBe("INFINITY");
  });

  it("cobrança no create em modo CLIENTE usa subclienteCobranca", () => {
    const p = buildSubclienteCreate({
      ...base(),
      ordemInstalacao: "CLIENTE",
      subclienteCobranca: "CLIENTE",
    });
    expect(p?.cobrancaTipo).toBe("CLIENTE");
  });

  it("update só quando existente, id e dados completos", () => {
    const u = buildSubclienteUpdate({ ...base(), isNovoSubcliente: false }, 9);
    expect(u).toBeDefined();
    expect(u?.nome).toBe("João");
  });

  it("não cria update se for novo", () => {
    expect(buildSubclienteUpdate(base(), 9)).toBeUndefined();
  });
});

describe("precheckCriacaoOs", () => {
  it("falha em CLIENTE sem clienteOrdemId", () => {
    const r = precheckCriacaoOs(
      { ...base(), ordemInstalacao: "CLIENTE", clienteOrdemId: undefined },
      1,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorMessage).toMatch(/Selecione o cliente/);
  });

  it("falha em INFINITY sem clienteInfinity", () => {
    const r = precheckCriacaoOs(base(), null);
    expect(r.ok).toBe(false);
  });

  it("falha em INFINITY com id zero", () => {
    const r = precheckCriacaoOs(base(), 0);
    expect(r.ok).toBe(false);
  });

  it("ok INFINITY com id válido", () => {
    const r = precheckCriacaoOs(base(), 99);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.clienteIdFinal).toBe(99);
  });

  it("ok CLIENTE com id válido", () => {
    const r = precheckCriacaoOs(
      {
        ...base(),
        ordemInstalacao: "CLIENTE",
        clienteOrdemId: 5,
      },
      null,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.clienteIdFinal).toBe(5);
  });
});

describe("buildCriarOrdemServicoPayload", () => {
  it("não envia subclienteId se houver subclienteCreate", () => {
    const data = { ...base(), tecnicoId: 3, idAparelho: " R1 " };
    const sc = { ...buildSubclienteCreate(data)! };
    const p = buildCriarOrdemServicoPayload(data, {
      clienteIdFinal: 1,
      subclienteId: 2,
      subclienteCreate: sc,
      subclienteUpdate: undefined,
      veiculoId: 4,
      observacoes: " x ",
    });
    expect(p.subclienteId).toBeUndefined();
    expect(p.tecnicoId).toBe(3);
    expect(p.idAparelho).toBe("R1");
  });

  it("omite técnico se id inválido", () => {
    const p = buildCriarOrdemServicoPayload(
      { ...base(), tecnicoId: 0 },
      {
        clienteIdFinal: 1,
        subclienteId: undefined,
        subclienteCreate: undefined,
        subclienteUpdate: undefined,
        veiculoId: undefined,
        observacoes: undefined,
      },
    );
    expect(p.tecnicoId).toBeUndefined();
  });
});

describe("trimObservacoes", () => {
  it("retorna undefined para vazio", () => {
    expect(trimObservacoes("  ")).toBeUndefined();
  });
  it("preserva texto", () => {
    expect(trimObservacoes(" a ")).toBe("a");
  });
});

describe("hasVeiculoDataCompletoParaApi", () => {
  it("falso se placa curta (sem 7+ alfanum)", () => {
    expect(
      hasVeiculoDataCompletoParaApi({
        ...base(),
        veiculoPlaca: "AB",
        veiculoMarca: "A",
        veiculoModelo: "B",
        veiculoAno: "1",
        veiculoCor: "C",
      }),
    ).toBe(false);
  });

  it("verdadeiro com placa normalizada e campos", () => {
    expect(
      hasVeiculoDataCompletoParaApi({
        ...base(),
        veiculoPlaca: "ABC-1D23",
        veiculoMarca: "VW",
        veiculoModelo: "Gol",
        veiculoAno: "2019",
        veiculoCor: "Preto",
      }),
    ).toBe(true);
  });
});

describe("buscarOuCriarVeiculoId", () => {
  it("retorna undefined sem dados de veículo", async () => {
    const post = vi.fn();
    const id = await buscarOuCriarVeiculoId(
      { ...criacaoOsDefaultValues, tipo: "REVISAO" },
      post,
    );
    expect(id).toBeUndefined();
    expect(post).not.toHaveBeenCalled();
  });

  it("retorna id quando API responde", async () => {
    const post = vi.fn().mockResolvedValue({ id: 10 });
    const id = await buscarOuCriarVeiculoId(
      {
        ...criacaoOsDefaultValues,
        tipo: "REVISAO",
        veiculoPlaca: "ABC1D23",
        veiculoMarca: "A",
        veiculoModelo: "B",
        veiculoAno: "2020",
        veiculoCor: "C",
      },
      post,
    );
    expect(id).toBe(10);
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ placa: "ABC1D23" }),
    );
  });

  it("engole erro e retorna undefined", async () => {
    const post = vi.fn().mockRejectedValue(new Error("falha"));
    const id = await buscarOuCriarVeiculoId(
      {
        ...criacaoOsDefaultValues,
        tipo: "REVISAO",
        veiculoPlaca: "ABC1D23",
        veiculoMarca: "A",
        veiculoModelo: "B",
        veiculoAno: "2020",
        veiculoCor: "C",
      },
      post,
    );
    expect(id).toBeUndefined();
  });
});
