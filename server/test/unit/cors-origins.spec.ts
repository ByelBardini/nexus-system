import { corsAllowedOriginsFromEnv } from 'src/cors-origins';

describe('corsAllowedOriginsFromEnv', () => {
  it('retorna padrão local quando env ausente ou vazia', () => {
    expect(corsAllowedOriginsFromEnv(undefined)).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    expect(corsAllowedOriginsFromEnv('')).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    expect(corsAllowedOriginsFromEnv('   ')).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
  });

  it('parseia lista separada por vírgula e remove espaços', () => {
    expect(
      corsAllowedOriginsFromEnv(
        'https://a.com, https://b.com , https://c.com',
      ),
    ).toEqual(['https://a.com', 'https://b.com', 'https://c.com']);
  });

  it('cai no padrão se após o trim não sobrar nenhuma origem', () => {
    expect(corsAllowedOriginsFromEnv(', ,  ')).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
  });
});
