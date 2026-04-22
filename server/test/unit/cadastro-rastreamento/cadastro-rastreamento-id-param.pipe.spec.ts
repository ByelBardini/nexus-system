import { ArgumentMetadata, BadRequestException, ParseIntPipe } from '@nestjs/common';

/**
 * O controller `cadastro-rastreamento` usa `@Param('id', ParseIntPipe)` em iniciar/concluir.
 * Cobre bordas do pipe sem subir a API HTTP.
 */
describe('ParseIntPipe (param :id — cadastro-rastreamento)', () => {
  const pipe = new ParseIntPipe();
  const meta: ArgumentMetadata = {
    type: 'param',
    metatype: Number,
    data: 'id',
  };

  it.each([
    ['1', 1],
    ['42', 42],
    ['0', 0],
  ])("aceita string inteira %s → %i", async (raw, expected) => {
    await expect(pipe.transform(raw, meta)).resolves.toBe(expected);
  });

  it('rejeita não numérico puro (abc) com BadRequest', async () => {
    await expect(pipe.transform('abc', meta)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejeita string vazia', async () => {
    await expect(pipe.transform('', meta)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejeita decimal (não é string numérica inteira strict do Nest)', async () => {
    await expect(pipe.transform('3.14', meta)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejeita inteiro com espaços laterais (strict)', async () => {
    await expect(pipe.transform('  5  ', meta)).rejects.toThrow(
      BadRequestException,
    );
  });
});
