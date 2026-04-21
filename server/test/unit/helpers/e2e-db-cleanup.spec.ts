import { PrismaService } from 'src/prisma/prisma.service';
import { cleanupE2eTecnicos } from '../../helpers/e2e-db-cleanup';

describe('cleanupE2eTecnicos', () => {
  it('chama deleteMany com prefixo de nome E2E', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const prisma = { tecnico: { deleteMany } } as unknown as PrismaService;

    await cleanupE2eTecnicos(prisma);

    expect(deleteMany).toHaveBeenCalledWith({
      where: { nome: { startsWith: 'E2E' } },
    });
  });
});
