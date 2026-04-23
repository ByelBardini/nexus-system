import type { ClienteComSubclientes, OpcaoDestinoCliente } from "@/types/pedidos-novo-destino";
import type {
  ClienteResumo,
  SubclienteResumo,
  TecnicoResumo,
} from "../shared/pedidos-rastreador.types";
import type { FormNovoPedido } from "./novo-pedido-rastreador.schema";

export type { ClienteComSubclientes, OpcaoDestinoCliente };

/** Converte o valor do select (ex.: "cliente-1", "subcliente-2") em ids. */
export function parseDestinoClienteString(destinoCliente: string | undefined):
  | { clienteId: number; subclienteId?: never }
  | { subclienteId: number; clienteId?: never }
  | Record<string, never> {
  if (
    !destinoCliente ||
    (!destinoCliente.startsWith("cliente-") &&
      !destinoCliente.startsWith("subcliente-"))
  ) {
    return {};
  }
  const [tipo, idStr] = destinoCliente.split("-");
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return {};
  return tipo === "cliente" ? { clienteId: id } : { subclienteId: id };
}

export function buildOpcoesClienteFromList(
  clientes: ClienteComSubclientes[],
): OpcaoDestinoCliente[] {
  const opts: OpcaoDestinoCliente[] = [];
  clientes.forEach((c) => {
    opts.push({ tipo: "cliente", id: c.id, label: c.nome, item: c });
    (c.subclientes ?? []).forEach((s) => {
      opts.push({
        tipo: "subcliente",
        id: s.id,
        label: `${s.nome} — ${c.nome}`,
        item: { ...s, cliente: c },
      });
    });
  });
  return opts;
}

export function resolveDestinatarioSelecionado(
  params: {
    tipoDestino: FormNovoPedido["tipoDestino"];
    tecnicoId: number | undefined;
    clienteId?: number;
    subclienteId?: number;
    tecnicos: TecnicoResumo[];
    clientes: ClienteComSubclientes[];
    opcoesCliente: OpcaoDestinoCliente[];
  },
):
  | TecnicoResumo
  | ClienteComSubclientes
  | (SubclienteResumo & { cliente?: ClienteResumo })
  | null {
  const { tipoDestino, tecnicoId, clienteId, subclienteId, tecnicos, clientes, opcoesCliente } =
    params;
  if (tipoDestino === "TECNICO" || tipoDestino === "MISTO") {
    return tecnicos.find((t) => t.id === tecnicoId) ?? null;
  }
  if (clienteId) {
    return clientes.find((c) => c.id === clienteId) ?? null;
  }
  if (subclienteId) {
    return (
      opcoesCliente.find(
        (o) => o.tipo === "subcliente" && o.id === subclienteId,
      )?.item ?? null
    );
  }
  return null;
}

export function formatCidadeEstadoDoDestinatario(
  destinatarioSelecionado: unknown,
): string | null {
  if (
    !destinatarioSelecionado ||
    typeof destinatarioSelecionado !== "object" ||
    !("cidade" in destinatarioSelecionado) ||
    !("estado" in destinatarioSelecionado)
  ) {
    return null;
  }
  const d = destinatarioSelecionado as {
    cidade?: string | null;
    estado?: string | null;
  };
  if (d.cidade && d.estado) {
    return `${d.cidade}, ${d.estado}`;
  }
  return d.cidade ?? "-";
}

export function formatFilialClienteDoSubcliente(
  destinatarioSelecionado: unknown,
): string | null {
  if (!destinatarioSelecionado || typeof destinatarioSelecionado !== "object")
    return null;
  if (!("cliente" in destinatarioSelecionado)) return null;
  return (
    (destinatarioSelecionado as { cliente?: ClienteResumo }).cliente?.nome ??
    "-"
  );
}

/** Filtra modelos pela marca; se não houver marca, devolve a lista completa. */
export function filterModelosPorMarca<T extends { marcaId: number }>(
  modelos: T[],
  marcaEquipamentoId: number | undefined,
): T[] {
  if (!marcaEquipamentoId) return modelos;
  return modelos.filter((m) => m.marcaId === marcaEquipamentoId);
}

export function getDestinatarioDisplayNome(
  destinatario: unknown,
): string | null {
  if (destinatario == null) return null;
  if (typeof destinatario === "object" && "nome" in destinatario) {
    const n = (destinatario as { nome?: unknown }).nome;
    return typeof n === "string" ? n : null;
  }
  return null;
}
