import { ProprietarioTipo } from '@prisma/client';

export type PedidoDestinoClienteFields = {
  clienteId: number | null;
  subclienteId: number | null;
  subcliente: { clienteId: number } | null;
};

/** Cliente efetivo do pedido (direto ou via subcliente). */
export function resolveTargetClienteId(
  pedido: PedidoDestinoClienteFields,
): number | null {
  return (
    pedido.clienteId ??
    (pedido.subclienteId && pedido.subcliente
      ? pedido.subcliente.clienteId
      : null) ??
    null
  );
}

export function resolveNonMistoClienteDestino(
  pedido: PedidoDestinoClienteFields,
): {
  proprietario: ProprietarioTipo;
  clienteId: number | null;
} {
  const targetClienteId = resolveTargetClienteId(pedido);
  return {
    proprietario: targetClienteId
      ? ProprietarioTipo.CLIENTE
      : ProprietarioTipo.INFINITY,
    clienteId: targetClienteId,
  };
}

export function resolveNonMistoTecnicoDestino(
  dtoDeClienteId: number | undefined,
  pedidoDeClienteId: number | null,
): { proprietario: ProprietarioTipo; clienteId: number | null } {
  const empresaId = dtoDeClienteId ?? pedidoDeClienteId ?? null;
  return {
    proprietario: empresaId
      ? ProprietarioTipo.CLIENTE
      : ProprietarioTipo.INFINITY,
    clienteId: empresaId,
  };
}
