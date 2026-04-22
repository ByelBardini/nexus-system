import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListDebitosDto } from 'src/debitos-rastreadores/dto/list-debitos.dto';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(ListDebitosDto, plain);
  return validate(dto);
}

describe('ListDebitosDto', () => {
  it('aceita payload vazio (defaults aplicados no service)', async () => {
    const errors = await validateDto({});
    expect(errors.length).toBe(0);
  });

  it('rejeita page menor que 1', async () => {
    const errors = await validateDto({ page: 0 });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejeita page negativa', async () => {
    const errors = await validateDto({ page: -1 });
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejeita limit menor que 1', async () => {
    const errors = await validateDto({ limit: 0 });
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('aceita page e limit válidos', async () => {
    const errors = await validateDto({ page: 1, limit: 50 });
    expect(errors.length).toBe(0);
  });

  it('rejeita devedorTipo inválido', async () => {
    const errors = await validateDto({ devedorTipo: 'LOJA' });
    expect(errors.some((e) => e.property === 'devedorTipo')).toBe(true);
  });

  it('aceita devedorTipo e credorTipo do enum Prisma', async () => {
    const errors = await validateDto({
      devedorTipo: 'INFINITY',
      credorTipo: 'CLIENTE',
    });
    expect(errors.length).toBe(0);
  });

  it('converte incluirHistoricos da string "true" para boolean', async () => {
    const dto = plainToInstance(ListDebitosDto, {
      incluirHistoricos: 'true',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.incluirHistoricos).toBe(true);
  });

  it('converte incluirHistoricos da string "false" para boolean', async () => {
    const dto = plainToInstance(ListDebitosDto, {
      incluirHistoricos: 'false',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.incluirHistoricos).toBe(false);
  });

  it('rejeita incluirHistoricos quando não é boolean válido', async () => {
    const errors = await validateDto({ incluirHistoricos: 'sim' });
    expect(errors.some((e) => e.property === 'incluirHistoricos')).toBe(true);
  });

  it('rejeita status fora do conjunto permitido', async () => {
    const errors = await validateDto({ status: 'pendente' });
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});
