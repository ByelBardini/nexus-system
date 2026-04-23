import { toPrismaContatoWriteData } from 'src/clientes/clientes.contato.helpers';

describe('toPrismaContatoWriteData', () => {
  it('mapeia nome e campos opcionais quando informados', () => {
    const result = toPrismaContatoWriteData({
      nome: 'Maria',
      celular: '11999998888',
      email: 'm@x.com',
    });

    expect(result).toEqual({
      nome: 'Maria',
      celular: '11999998888',
      email: 'm@x.com',
    });
  });

  it('preserva celular e email undefined quando omitidos', () => {
    const result = toPrismaContatoWriteData({ nome: 'João' });

    expect(result).toEqual({
      nome: 'João',
      celular: undefined,
      email: undefined,
    });
  });

  it('ignora propriedades extras (ex.: id) quando objeto vem do DTO de update', () => {
    const result = toPrismaContatoWriteData({
      nome: 'X',
      celular: '11',
      id: 99,
    } as { nome: string; celular?: string; email?: string; id?: number });

    expect(result).toEqual({ nome: 'X', celular: '11', email: undefined });
    expect(result).not.toHaveProperty('id');
  });
});
