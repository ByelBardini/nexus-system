/**
 * Script de migração one-time: move Aparelho(status=DESCARTADO) → AparelhoDescartado
 * e deleta os originais.
 *
 * Executar ANTES da migration 20260430110000_remove_descartado_enum.
 * Ao final confirma COUNT(*) = 0 antes de sair.
 *
 * Uso: npx ts-node prisma/scripts/migrar-descartados.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const LOTE = 50;

async function migrarLote(ids: number[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const aparelhos = await tx.aparelho.findMany({
      where: { id: { in: ids } },
    });

    for (const ap of aparelhos) {
      await tx.aparelhoDescartado.create({
        data: {
          aparelhoOrigemId: ap.id,
          tipo: ap.tipo,
          identificador: ap.identificador ?? null,
          proprietario: ap.proprietario,
          marca: ap.marca ?? null,
          modelo: ap.modelo ?? null,
          operadora: ap.operadora ?? null,
          marcaSimcardId: ap.marcaSimcardId ?? null,
          planoSimcardId: ap.planoSimcardId ?? null,
          loteId: ap.loteId ?? null,
          valorUnitario: ap.valorUnitario ?? null,
          tecnicoId: ap.tecnicoId ?? null,
          kitId: ap.kitId ?? null,
          simVinculadoId: ap.simVinculadoId ?? null,
          clienteId: ap.clienteId ?? null,
          subclienteId: ap.subclienteId ?? null,
          veiculoId: ap.veiculoId ?? null,
          observacao: ap.observacao ?? null,
          criadoEm: ap.criadoEm,
          categoriaFalha: null,
          motivoDefeito: null,
          responsavel: null,
          descartadoEm: null, // data não conhecida para registros migrados
        },
      });
      await tx.aparelho.delete({ where: { id: ap.id } });
    }
  });
}

async function main() {
  console.log('Iniciando migração de aparelhos DESCARTADOS...');

  const total = await prisma.aparelho.count({
    where: { status: 'DESCARTADO' },
  });
  console.log(`Total a migrar: ${total}`);

  let migrados = 0;
  let falhas = 0;

  while (true) {
    const lote = await prisma.aparelho.findMany({
      where: { status: 'DESCARTADO' },
      select: { id: true },
      take: LOTE,
    });

    if (lote.length === 0) break;

    const ids = lote.map((a) => a.id);
    try {
      await migrarLote(ids);
      migrados += ids.length;
      console.log(`Migrados: ${migrados}/${total}`);
    } catch (err) {
      falhas += ids.length;
      console.error(`Falha no lote ${ids.join(',')}: ${String(err)}`);
    }
  }

  const restantes = await prisma.aparelho.count({
    where: { status: 'DESCARTADO' },
  });

  console.log(`\nResumo: Migrados=${migrados}, Falhas=${falhas}, Restantes=${restantes}`);

  if (restantes > 0) {
    console.error('ATENÇÃO: ainda há registros DESCARTADOS. NÃO execute a migration 2.');
    process.exit(1);
  } else {
    console.log('OK: COUNT(*) = 0. Seguro executar a migration 20260430110000_remove_descartado_enum.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
