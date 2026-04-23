import { Prisma } from '@prisma/client';

/** Relações comuns entre listagem e detalhe (sem histórico). */
export const debitoRastreadorClienteMarcaModeloInclude = {
  devedorCliente: { select: { id: true, nome: true } },
  credorCliente: { select: { id: true, nome: true } },
  marca: { select: { id: true, nome: true } },
  modelo: { select: { id: true, nome: true } },
} satisfies Prisma.DebitoRastreadorInclude;

export function buildDebitoRastreadorFindInclude(
  incluirHistoricos: boolean,
): Prisma.DebitoRastreadorInclude {
  if (!incluirHistoricos) {
    return { ...debitoRastreadorClienteMarcaModeloInclude };
  }
  return {
    ...debitoRastreadorClienteMarcaModeloInclude,
    historicos: {
      orderBy: { criadoEm: 'asc' },
      include: {
        pedido: { select: { id: true, codigo: true } },
        lote: { select: { id: true, referencia: true } },
        aparelho: { select: { id: true, identificador: true } },
        ordemServico: { select: { id: true, numero: true } },
      },
    },
  };
}
