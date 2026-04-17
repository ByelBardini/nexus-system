import { Test, TestingModule } from '@nestjs/testing';
import { HtmlOrdemServicoGenerator } from 'src/ordens-servico/html-ordem-servico.generator';
import { StatusOS } from '@prisma/client';

const osBase = {
  id: 1,
  numero: 42,
  tipo: 'INSTALACAO_COM_BLOQUEIO' as const,
  status: StatusOS.AGENDADO,
  observacoes: 'Obs da OS',
  criadoEm: new Date('2025-01-15'),
  cliente: { id: 1, nome: 'Cliente ABC', nomeFantasia: 'Cliente ABC' },
  subcliente: {
    id: 2,
    nome: 'João Silva',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    telefone: '11999998888',
    email: 'joao@email.com',
    cpf: '12345678900',
    cobrancaTipo: 'INFINITY',
  },
  veiculo: {
    id: 3,
    placa: 'ABC1D23',
    marca: 'Fiat',
    modelo: 'Uno',
    ano: 2020,
    cor: 'Branco',
  },
  tecnico: {
    id: 4,
    nome: 'Carlos Técnico',
    cidade: 'Criciúma',
    estado: 'SC',
    telefone: '11988887777',
  },
  criadoPor: { id: 1, nome: 'Igor' },
};

describe('HtmlOrdemServicoGenerator', () => {
  let generator: HtmlOrdemServicoGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlOrdemServicoGenerator],
    }).compile();

    generator = module.get<HtmlOrdemServicoGenerator>(
      HtmlOrdemServicoGenerator,
    );
  });

  describe('gerar', () => {
    it('retorna HTML com estrutura válida', () => {
      const result = generator.gerar(osBase);

      expect(typeof result).toBe('string');
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('</html>');
    });

    it('inclui número da OS no conteúdo', () => {
      const result = generator.gerar(osBase);

      expect(result).toContain('000000042');
      expect(result).toContain('42');
    });

    it('inclui dados do cliente e subcliente', () => {
      const result = generator.gerar(osBase);

      expect(result).toMatch(/Cliente ABC|João Silva/);
    });

    it('inclui tipo de serviço sem checkboxes', () => {
      const result = generator.gerar(osBase);

      expect(result).toContain('Instalação com bloqueio');
      expect(result).not.toContain('[X]');
    });

    it('lida com subcliente nulo', () => {
      const osSemSub = { ...osBase, subcliente: null };

      const result = generator.gerar(osSemSub);

      expect(result).toContain('<!DOCTYPE html>');
    });

    it('não exibe seção de execução quando status não é FINALIZADO', () => {
      const result = generator.gerar({ ...osBase, status: StatusOS.AGENDADO });

      expect(result).not.toContain('Data da execução do serviço');
    });

    it('exibe seção de execução quando status é FINALIZADO', () => {
      const result = generator.gerar({
        ...osBase,
        status: StatusOS.FINALIZADO,
      });

      expect(result).toContain('Data da execução do serviço');
      expect(result).toContain('Execução do Serviço');
    });

    it('formata telefone do subcliente no formato (XX) XXXXX-XXXX', () => {
      const result = generator.gerar({
        ...osBase,
        subcliente: { ...osBase.subcliente, telefone: '11999998888' },
      });

      expect(result).toContain('(11) 99999-8888');
    });

    it('formata CPF do subcliente no formato 000.000.000-00', () => {
      const result = generator.gerar({
        ...osBase,
        subcliente: { ...osBase.subcliente, cpf: '12345678900' },
      });

      expect(result).toContain('123.456.789-00');
    });

    it('formata telefone do técnico no formato (XX) XXXXX-XXXX', () => {
      const result = generator.gerar({
        ...osBase,
        tecnico: { ...osBase.tecnico, telefone: '11988887777' },
      });

      expect(result).toContain('(11) 98888-7777');
    });

    it('formata CEP do subcliente no formato 00000-000', () => {
      const result = generator.gerar({
        ...osBase,
        subcliente: {
          ...osBase.subcliente,
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310100',
        },
      });

      expect(result).toContain('01310-100');
    });

    it('exibe - quando telefone é nulo', () => {
      const result = generator.gerar({
        ...osBase,
        subcliente: { ...osBase.subcliente, telefone: null },
        tecnico: { ...osBase.tecnico, telefone: null },
      });

      expect(result).toContain('<!DOCTYPE html>');
    });
  });
});
