import { PrismaService } from 'src/prisma/prisma.service';

const PREFIXO_NOME_TECNICO_E2E = 'E2E';

export async function cleanupE2eTecnicos(prisma: PrismaService): Promise<void> {
  await prisma.tecnico.deleteMany({
    where: { nome: { startsWith: PREFIXO_NOME_TECNICO_E2E } },
  });
}
