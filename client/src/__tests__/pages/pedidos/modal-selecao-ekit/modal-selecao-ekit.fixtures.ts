import type {
  PedidoRastreadorView,
  PedidoRastreadorApi,
} from "@/pages/pedidos/shared/pedidos-rastreador.types";
import type {
  KitDetalhe,
  AparelhoNoKit,
  KitComAparelhos,
} from "@/pages/pedidos/shared/pedidos-config-types";

export function buildKitDetalhe(partial: Partial<KitDetalhe> = {}): KitDetalhe {
  return {
    id: 1,
    nome: "KIT-A",
    criadoEm: "2024-01-01T12:00:00.000Z",
    kitConcluido: false,
    quantidade: 2,
    modelosOperadoras: "X / Vivo",
    marcas: [],
    modelos: [],
    operadoras: [],
    ...partial,
  };
}

export function buildPedidoView(
  partial: Partial<PedidoRastreadorView> = {},
): PedidoRastreadorView {
  return {
    id: 10,
    codigo: "PED-001",
    destinatario: "Cliente X",
    tipo: "cliente",
    quantidade: 5,
    status: "em_configuracao",
    ...partial,
  };
}

export function buildPedidoApiMisto(
  partial: Partial<PedidoRastreadorApi> = {},
): PedidoRastreadorApi {
  return {
    id: 10,
    codigo: "PED-001",
    tipoDestino: "MISTO",
    tecnicoId: null,
    clienteId: null,
    subclienteId: null,
    quantidade: 5,
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
        proprietario: "INFINITY",
        clienteId: null,
        quantidade: 2,
        cliente: null,
      },
      {
        id: 2,
        proprietario: "CLIENTE",
        clienteId: 99,
        quantidade: 3,
        cliente: { id: 99, nome: "ACME" },
      },
    ],
    ...partial,
  };
}

export function buildAparelhoNoKit(
  partial: Partial<AparelhoNoKit> = {},
): AparelhoNoKit {
  return {
    id: 100,
    identificador: "IMEI-1",
    marca: "M1",
    modelo: "Mod1",
    operadora: "Vivo",
    status: "DISPONIVEL",
    ...partial,
  };
}

export function buildKitComAparelhos(
  partial: Partial<KitComAparelhos> = {},
): KitComAparelhos {
  return {
    id: 1,
    nome: "KIT-A",
    criadoEm: "",
    aparelhos: [],
    ...partial,
  };
}
