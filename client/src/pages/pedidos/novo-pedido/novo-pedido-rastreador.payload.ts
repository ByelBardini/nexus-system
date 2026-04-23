import type { FormNovoPedido } from "./novo-pedido-rastreador.schema";

/**
 * Corpo JSON para POST /pedidos-rastreadores (alinhado ao que o modal enviava).
 */
export function buildNovoPedidoRastreadorPostJson(
  data: FormNovoPedido,
): object {
  if (data.tipoDestino === "MISTO") {
    return {
      tipoDestino: "MISTO",
      tecnicoId: data.tecnicoId,
      dataSolicitacao: data.dataSolicitacao,
      urgencia: data.urgencia ?? "MEDIA",
      observacao: data.observacao ?? undefined,
      itens: data.itensMisto?.map((item) => ({
        proprietario: item.proprietario,
        clienteId: item.proprietario === "CLIENTE" ? item.clienteId : undefined,
        quantidade: item.quantidade,
        marcaEquipamentoId: data.marcaModeloEspecifico
          ? data.marcaEquipamentoId
          : item.marcaModeloEspecifico
            ? item.marcaEquipamentoId
            : undefined,
        modeloEquipamentoId: data.marcaModeloEspecifico
          ? data.modeloEquipamentoId
          : item.marcaModeloEspecifico
            ? item.modeloEquipamentoId
            : undefined,
        operadoraId: data.operadoraEspecifica
          ? data.operadoraId
          : item.operadoraEspecifica
            ? item.operadoraId
            : undefined,
      })),
    };
  }
  const dest = data.destinoCliente ?? "";
  const [tipo, idStr] = dest.split("-");
  const id = parseInt(idStr, 10);
  const isCliente = tipo === "cliente" && !Number.isNaN(id);
  const isSubcliente = tipo === "subcliente" && !Number.isNaN(id);
  return {
    tipoDestino: data.tipoDestino,
    tecnicoId: data.tipoDestino === "TECNICO" ? data.tecnicoId : undefined,
    clienteId: data.tipoDestino === "CLIENTE" && isCliente ? id : undefined,
    subclienteId:
      data.tipoDestino === "CLIENTE" && isSubcliente ? id : undefined,
    dataSolicitacao: data.dataSolicitacao,
    deClienteId:
      data.tipoDestino === "TECNICO" && data.deCliente
        ? data.deClienteId
        : undefined,
    marcaEquipamentoId: data.marcaModeloEspecifico
      ? data.marcaEquipamentoId
      : undefined,
    modeloEquipamentoId: data.marcaModeloEspecifico
      ? data.modeloEquipamentoId
      : undefined,
    operadoraId: data.operadoraEspecifica ? data.operadoraId : undefined,
    quantidade: data.quantidade,
    urgencia: data.urgencia ?? "MEDIA",
    observacao: data.observacao ?? undefined,
  };
}
