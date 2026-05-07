/** Include Prisma compartilhado para leitura de pedidos de rastreador. */
export const PEDIDO_RASTREADOR_INCLUDE_BASE = {
  tecnico: true,
  cliente: true,
  subcliente: { include: { cliente: true } },
  deCliente: true,
  marcaEquipamento: true,
  modeloEquipamento: { include: { marca: true } },
  operadora: true,
  criadoPor: true,
  itens: {
    include: {
      cliente: { select: { id: true, nome: true, cor: true } },
      marcaEquipamento: true,
      modeloEquipamento: { include: { marca: true } },
      operadora: true,
    },
  },
} as const;
