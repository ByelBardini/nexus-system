import {
  normalizarPlaca,
  placaNormalizadaOuNull,
} from 'src/veiculos/veiculos.helpers';

describe('veiculos.helpers', () => {
  describe('normalizarPlaca', () => {
    it('remove hífens e espaços e converte para maiúsculas', () => {
      expect(normalizarPlaca('abc-1d23')).toBe('ABC1D23');
      expect(normalizarPlaca('  xyz 9w84 ')).toBe('XYZ9W84');
    });

    it('remove caracteres não alfanuméricos', () => {
      expect(normalizarPlaca('A.B*C@1#D$23')).toBe('ABC1D23');
    });

    it('trunca para no máximo 7 caracteres', () => {
      expect(normalizarPlaca('ABCDEFGH')).toBe('ABCDEFG');
      expect(normalizarPlaca('1234567890')).toBe('1234567');
    });

    it('retorna string vazia para entrada vazia', () => {
      expect(normalizarPlaca('')).toBe('');
    });

    it('preserva letras e números válidos', () => {
      expect(normalizarPlaca('QHJ2500')).toBe('QHJ2500');
    });
  });

  describe('placaNormalizadaOuNull', () => {
    it('retorna null quando há menos de 7 caracteres alfanuméricos', () => {
      expect(placaNormalizadaOuNull('ABC12')).toBeNull();
      expect(placaNormalizadaOuNull('')).toBeNull();
      expect(placaNormalizadaOuNull('   ')).toBeNull();
    });

    it('retorna null quando após normalizar sobram menos de 7 (apenas separadores)', () => {
      expect(placaNormalizadaOuNull('A-B-C-1-2')).toBeNull();
    });

    it('retorna placa normalizada quando há exatamente 7 após normalizar', () => {
      expect(placaNormalizadaOuNull('abc-1d23')).toBe('ABC1D23');
      expect(placaNormalizadaOuNull('QHJ2500')).toBe('QHJ2500');
    });

    it('aceita 7 caracteres mesmo com muitos separadores na entrada', () => {
      expect(placaNormalizadaOuNull('a-b-c-1-d-2-3')).toBe('ABC1D23');
    });

    it('trunca antes de validar tamanho — mais de 7 alnum usa só os 7 primeiros', () => {
      expect(placaNormalizadaOuNull('ABCDEFGH')).toBe('ABCDEFG');
    });
  });
});
