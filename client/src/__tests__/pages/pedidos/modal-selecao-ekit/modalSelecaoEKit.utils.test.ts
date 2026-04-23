import { describe, expect, it } from "vitest";
import type { PedidoRastreadorView } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import type {
  KitDetalhe,
  AparelhoNoKit,
  KitVinculado,
} from "@/pages/pedidos/shared/pedidos-config-types";
import type { PedidoRastreadorApi } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import {
  buildAparelhosDisponiveisApiPath,
  buildKitIdsEmOutrosPedidos,
  buildOpcoesMarcaModelo,
  buildOpcoesOperadora,
  computeAparelhosParaAdicionar,
  filterAparelhosParaSelecao,
  filterKitsCompativeisComPedido,
  filterKitsDisponiveisParaSelecao,
  filterKitsPorTextoBusca,
} from "@/pages/pedidos/modal-selecao-ekit/modal-selecao-ekit.utils";
import {
  buildKitDetalhe,
  buildAparelhoNoKit,
} from "./modal-selecao-ekit.fixtures";

describe("buildKitIdsEmOutrosPedidos", () => {
  it("retorna vazio sem pedidoId", () => {
    expect(
      buildKitIdsEmOutrosPedidos(undefined, {
        1: [{ id: 1, nome: "k", quantidade: 1 }],
      }),
    ).toEqual(new Set());
  });

  it("retorna vazio sem kitsPorPedido", () => {
    expect(buildKitIdsEmOutrosPedidos(1, undefined)).toEqual(new Set());
  });

  it("ignora kits do próprio pedido e agrega dos demais", () => {
    const kits: Record<number, KitVinculado[]> = {
      10: [{ id: 1, nome: "A", quantidade: 1 }],
      20: [
        { id: 2, nome: "B", quantidade: 1 },
        { id: 3, nome: "C", quantidade: 1 },
      ],
    };
    expect(buildKitIdsEmOutrosPedidos(10, kits)).toEqual(new Set([2, 3]));
  });

  it("pedido isolado não bloqueia nenhum id", () => {
    expect(
      buildKitIdsEmOutrosPedidos(99, {
        99: [{ id: 7, nome: "k", quantidade: 1 }],
      }),
    ).toEqual(new Set());
  });
});

describe("filterKitsDisponiveisParaSelecao", () => {
  it("exclui kit concluído e kit em outro pedido", () => {
    const bloqueados = new Set([2]);
    const kits: KitDetalhe[] = [
      buildKitDetalhe({ id: 1, kitConcluido: false }),
      buildKitDetalhe({ id: 2, nome: "B", kitConcluido: false }),
      buildKitDetalhe({ id: 3, nome: "C", kitConcluido: true }),
    ];
    const out = filterKitsDisponiveisParaSelecao(kits, bloqueados);
    expect(out.map((k) => k.id)).toEqual([1]);
  });

  it("lista vazia permanece vazia", () => {
    expect(filterKitsDisponiveisParaSelecao([], new Set())).toEqual([]);
  });
});

describe("filterKitsCompativeisComPedido", () => {
  const pedidoBase: PedidoRastreadorView = {
    id: 1,
    codigo: "P",
    destinatario: "D",
    tipo: "cliente",
    quantidade: 1,
    status: "em_configuracao",
  };

  it("sem requisitos no pedido retorna todos disponíveis", () => {
    const kits = [
      buildKitDetalhe({ id: 1, modelos: ["Other"], operadoras: ["Claro"] }),
    ];
    expect(filterKitsCompativeisComPedido(kits, { ...pedidoBase })).toEqual(
      kits,
    );
  });

  it("kit vazio (qtd 0) passa mesmo com requisitos", () => {
    const kits = [
      buildKitDetalhe({
        id: 1,
        quantidade: 0,
        modelos: ["X"],
        marcas: [],
        operadoras: [],
      }),
    ];
    const pedido: PedidoRastreadorView = {
      ...pedidoBase,
      marcaModelo: "M / X",
      operadora: "Vivo",
    };
    expect(filterKitsCompativeisComPedido(kits, pedido)).toEqual(kits);
  });

  it("kit sem metadados de filtro passa", () => {
    const kits = [
      buildKitDetalhe({
        id: 1,
        quantidade: 1,
        marcas: [],
        modelos: [],
        operadoras: [],
      }),
    ];
    const pedido: PedidoRastreadorView = {
      ...pedidoBase,
      marcaModelo: "A / B",
      operadora: "Vivo",
    };
    expect(filterKitsCompativeisComPedido(kits, pedido)).toEqual(kits);
  });

  it("rejeita quando modelos do kit não batem com modelo do pedido", () => {
    const kits = [
      buildKitDetalhe({
        id: 1,
        quantidade: 1,
        modelos: ["A", "B"],
        marcas: [],
        operadoras: [],
      }),
    ];
    const pedido: PedidoRastreadorView = {
      ...pedidoBase,
      marcaModelo: "Marca / Z",
    };
    expect(filterKitsCompativeisComPedido(kits, pedido)).toEqual([]);
  });

  it("com só marca no pedido (sem modelo) valida marcas do kit", () => {
    const kits = [
      buildKitDetalhe({
        id: 1,
        quantidade: 1,
        marcas: ["Ford"],
        modelos: [],
        operadoras: [],
      }),
    ];
    const ok: PedidoRastreadorView = {
      ...pedidoBase,
      marcaModelo: "Ford",
    };
    const bad: PedidoRastreadorView = {
      ...pedidoBase,
      marcaModelo: "GM",
    };
    expect(filterKitsCompativeisComPedido(kits, ok)).toEqual(kits);
    expect(filterKitsCompativeisComPedido(kits, bad)).toEqual([]);
  });

  it("operadora do pedido deve coincidir quando kit tem operadoras", () => {
    const kits = [
      buildKitDetalhe({
        id: 1,
        quantidade: 1,
        marcas: [],
        modelos: [],
        operadoras: ["Vivo"],
      }),
    ];
    const pedido: PedidoRastreadorView = {
      ...pedidoBase,
      operadora: "Claro",
    };
    expect(filterKitsCompativeisComPedido(kits, pedido)).toEqual([]);
  });

  it("pedido null trata como sem requisitos", () => {
    const kits = [buildKitDetalhe({ id: 1, modelos: ["X"] })];
    expect(filterKitsCompativeisComPedido(kits, null)).toEqual(kits);
  });
});

describe("filterKitsPorTextoBusca", () => {
  const kits = [
    buildKitDetalhe({ id: 1, nome: "Alpha", modelosOperadoras: "M1 / Tim" }),
    buildKitDetalhe({ id: 2, nome: "Beta", modelosOperadoras: "M2" }),
  ];

  it("string só espaços não filtra", () => {
    expect(filterKitsPorTextoBusca(kits, "   ")).toEqual(kits);
  });

  it("filtra por nome case-insensitive", () => {
    expect(filterKitsPorTextoBusca(kits, "alpha").map((k) => k.id)).toEqual([
      1,
    ]);
  });

  it("filtra por modelosOperadoras", () => {
    expect(filterKitsPorTextoBusca(kits, "tim").map((k) => k.id)).toEqual([1]);
  });

  it("nenhum match retorna vazio", () => {
    expect(filterKitsPorTextoBusca(kits, "zzz")).toEqual([]);
  });
});

describe("buildAparelhosDisponiveisApiPath", () => {
  it("sem filtros retorna path base", () => {
    expect(buildAparelhosDisponiveisApiPath(null, null, false, false)).toBe(
      "/aparelhos/pareamento/aparelhos-disponiveis",
    );
  });

  it("não-MISTO com clienteId nos filtros inclui clienteId", () => {
    expect(
      buildAparelhosDisponiveisApiPath(
        { itens: [] } as unknown as PedidoRastreadorApi,
        { clienteId: 5 },
        false,
        false,
      ),
    ).toBe("/aparelhos/pareamento/aparelhos-disponiveis?clienteId=5");
  });

  it("showAllClientes ignora clienteId nos filtros", () => {
    expect(
      buildAparelhosDisponiveisApiPath(null, { clienteId: 5 }, false, true),
    ).toBe("/aparelhos/pareamento/aparelhos-disponiveis");
  });

  it("MISTO agrega clienteIds e includeInfinity", () => {
    const api: PedidoRastreadorApi = {
      id: 1,
      codigo: "x",
      tipoDestino: "MISTO",
      tecnicoId: null,
      clienteId: null,
      subclienteId: null,
      quantidade: 1,
      status: "EM_CONFIGURACAO",
      urgencia: "MEDIA",
      observacao: null,
      criadoPorId: 1,
      criadoEm: "",
      atualizadoEm: "",
      entregueEm: null,
      itens: [
        {
          id: 1,
          proprietario: "CLIENTE",
          clienteId: 7,
          quantidade: 1,
          cliente: null,
        },
        {
          id: 2,
          proprietario: "INFINITY",
          clienteId: null,
          quantidade: 1,
          cliente: null,
        },
      ],
    };
    const path = buildAparelhosDisponiveisApiPath(api, null, true, false);
    expect(path).toContain("clienteIds=7");
    expect(path).toContain("includeInfinity=true");
  });

  it("MISTO sem itens não adiciona clienteIds", () => {
    const api: PedidoRastreadorApi = {
      id: 1,
      codigo: "x",
      tipoDestino: "MISTO",
      tecnicoId: null,
      clienteId: null,
      subclienteId: null,
      quantidade: 1,
      status: "EM_CONFIGURACAO",
      urgencia: "MEDIA",
      observacao: null,
      criadoPorId: 1,
      criadoEm: "",
      atualizadoEm: "",
      entregueEm: null,
    };
    expect(buildAparelhosDisponiveisApiPath(api, null, true, false)).toBe(
      "/aparelhos/pareamento/aparelhos-disponiveis",
    );
  });

  it("inclui ids de equipamento e operadora dos filtros", () => {
    expect(
      buildAparelhosDisponiveisApiPath(
        null,
        {
          modeloEquipamentoId: 3,
          marcaEquipamentoId: 4,
          operadoraId: 9,
        },
        false,
        false,
      ),
    ).toBe(
      "/aparelhos/pareamento/aparelhos-disponiveis?modeloEquipamentoId=3&marcaEquipamentoId=4&operadoraId=9",
    );
  });
});

describe("computeAparelhosParaAdicionar e opções / filtro de lista", () => {
  const disp: AparelhoNoKit[] = [
    buildAparelhoNoKit({ id: 1 }),
    buildAparelhoNoKit({ id: 2 }),
    buildAparelhoNoKit({ id: 3 }),
  ];

  it("remove ids já presentes no kit", () => {
    expect(computeAparelhosParaAdicionar(disp, [2])).toHaveLength(2);
    expect(computeAparelhosParaAdicionar(disp, [2]).map((a) => a.id)).toEqual([
      1, 3,
    ]);
  });

  it("buildOpcoesMarcaModelo ordena e deduplica", () => {
    const list = [
      buildAparelhoNoKit({ id: 1, marca: "B", modelo: "M2" }),
      buildAparelhoNoKit({ id: 2, marca: "A", modelo: "M1" }),
      buildAparelhoNoKit({ id: 3, marca: "B", modelo: "M2" }),
    ];
    expect(buildOpcoesMarcaModelo(list)).toEqual(["A / M1", "B / M2"]);
  });

  it("buildOpcoesOperadora usa sim quando operadora nula", () => {
    const list = [
      buildAparelhoNoKit({
        id: 1,
        operadora: null,
        simVinculado: { identificador: "s", operadora: "Tim" },
      }),
    ];
    expect(buildOpcoesOperadora(list)).toEqual(["Tim"]);
  });

  it("filterAparelhosParaSelecao por busca parcial em IMEI", () => {
    const list = [
      buildAparelhoNoKit({ id: 1, identificador: "999111" }),
      buildAparelhoNoKit({ id: 2, identificador: "000" }),
    ];
    expect(
      filterAparelhosParaSelecao(list, {
        buscaAparelho: "111",
        filtroMarcaModelo: "",
        filtroOperadora: "",
        filtroCliente: "",
      }).map((a) => a.id),
    ).toEqual([1]);
  });

  it("filtro cliente Infinity alinha com label de opções", () => {
    const list = [
      buildAparelhoNoKit({
        id: 1,
        proprietario: "INFINITY",
        cliente: undefined,
        tecnico: undefined,
      }),
    ];
    const filtrados = filterAparelhosParaSelecao(list, {
      buscaAparelho: "",
      filtroMarcaModelo: "",
      filtroOperadora: "",
      filtroCliente: "Infinity",
    });
    expect(filtrados).toHaveLength(1);
  });
});
