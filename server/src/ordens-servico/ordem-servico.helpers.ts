import { Prisma } from '@prisma/client';

/** Escopo da busca textual/numerica de ordens de serviço. */
export type OrdemServicoSearchScope = 'listagem' | 'emTestes';

/**
 * Cláusulas OR compartilhadas entre telas; `emTestes` inclui snapshot e IMEIs.
 * Recebe termo já trimado e não vazio (o serviço só chama após `search?.trim()`).
 */
export function buildOrdemServicoSearchOrClauses(
  termo: string,
  scope: OrdemServicoSearchScope,
): Prisma.OrdemServicoWhereInput[] {
  if (!termo) {
    throw new Error(
      'buildOrdemServicoSearchOrClauses: termo não pode ser vazio',
    );
  }
  const isNum = !Number.isNaN(Number(termo));
  const base: Prisma.OrdemServicoWhereInput[] = [
    ...(isNum ? [{ numero: Number(termo) }] : []),
    { cliente: { nome: { contains: termo } } },
    { subcliente: { nome: { contains: termo } } },
    { veiculo: { placa: { contains: termo } } },
    { tecnico: { nome: { contains: termo } } },
  ];
  if (scope === 'emTestes') {
    return [
      ...base,
      { subclienteSnapshotNome: { contains: termo } },
      { idAparelho: { contains: termo } },
      { idEntrada: { contains: termo } },
    ];
  }
  return base;
}

/**
 * Próximo número sequencial de OS dentro de uma transação Prisma.
 */
export async function proximoNumeroOrdemServico(
  tx: Prisma.TransactionClient,
): Promise<number> {
  const max = await tx.ordemServico.aggregate({ _max: { numero: true } });
  return (max._max.numero ?? 0) + 1;
}
