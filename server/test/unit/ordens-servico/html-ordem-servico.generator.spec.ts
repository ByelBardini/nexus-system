import { Test, TestingModule } from '@nestjs/testing';
import { HtmlOrdemServicoGenerator } from 'src/ordens-servico/html-ordem-servico.generator';
import { StatusOS, TipoOS } from '@prisma/client';

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

    describe('REVISÃO — emissão vs dados de teste (regressão IMEI/local)', () => {
      const osRevisaoBase = {
        ...osBase,
        tipo: 'REVISAO' as const,
        idAparelho: 'IMEI_SAIDA_EMISSAO',
        idEntrada: 'IMEI_ENTRADA_TESTE',
        localInstalacao: 'Local emissão',
        posChave: 'SIM' as const,
        localInstalacaoEntrada: 'Local testes',
        posChaveEntrada: 'NAO' as const,
      };

      it('antes dos testes mostra só bloco de emissão (ID a substituir = idAparelho)', () => {
        const result = generator.gerar({
          ...osRevisaoBase,
          status: StatusOS.AGENDADO,
        });

        expect(result).toContain('ID a substituir:');
        expect(result).toContain('IMEI_SAIDA_EMISSAO');
        expect(result).toContain('Local emissão');
        expect(result).toContain(
          'Pós-Chave:</span> <span class="field-value">Sim',
        );
        expect(result).not.toContain('IMEI_ENTRADA_TESTE');
        expect(result).not.toContain('Local testes');
      });

      it('após testes mantém emissão na primeira linha e usa *Entrada na segunda (PDF)', () => {
        const result = generator.gerar({
          ...osRevisaoBase,
          status: StatusOS.TESTES_REALIZADOS,
        });

        const idxSubstituir = result.indexOf('IMEI_SAIDA_EMISSAO');
        const idxEntrada = result.indexOf('IMEI_ENTRADA_TESTE');
        expect(idxSubstituir).toBeGreaterThan(-1);
        expect(idxEntrada).toBeGreaterThan(-1);
        expect(idxSubstituir).toBeLessThan(idxEntrada);

        expect(result).toContain('Local emissão');
        expect(result).toContain('Local testes');
        expect(result).toMatch(
          /ID de entrada:[\s\S]*IMEI_ENTRADA_TESTE[\s\S]*Local testes[\s\S]*Pós-Chave:[\s\S]*Não/,
        );
      });

      it('com idEntrada ausente, ID de entrada faz fallback para idAparelho', () => {
        const result = generator.gerar({
          ...osRevisaoBase,
          idEntrada: null,
          status: StatusOS.TESTES_REALIZADOS,
        });

        expect(result).toContain('ID de entrada:');
        const matches = result.match(/IMEI_SAIDA_EMISSAO/g);
        expect(matches?.length).toBeGreaterThanOrEqual(2);
      });

      it('sem localInstalacaoEntrada, bloco de entrada usa local de emissão', () => {
        const result = generator.gerar({
          ...osRevisaoBase,
          localInstalacaoEntrada: null,
          status: StatusOS.TESTES_REALIZADOS,
        });

        expect(result).toContain('Local emissão');
        expect(result).not.toContain('Local testes');
      });
    });

    describe('TipoOS — ramos do template (edge cases pós-enum)', () => {
      it('RETIRADA exibe ID a retirar e não ID a substituir', () => {
        const result = generator.gerar({
          ...osBase,
          tipo: TipoOS.RETIRADA,
          status: StatusOS.AGENDADO,
          idAparelho: 'IMEI_RETIRAR',
        });

        expect(result).toContain('ID a retirar:');
        expect(result).toContain('IMEI_RETIRAR');
        expect(result).not.toContain('ID a substituir:');
      });

      it('DESLOCAMENTO não adiciona sufixo "e Detalhes" ao título da seção', () => {
        const result = generator.gerar({
          ...osBase,
          tipo: TipoOS.DESLOCAMENTO,
          status: StatusOS.AGENDADO,
        });

        expect(result).not.toContain('Tipo de Serviço e Detalhes');
      });

      it('INSTALACAO_SEM_BLOQUEIO inclui "e Detalhes" no título (enum explícito)', () => {
        const result = generator.gerar({
          ...osBase,
          tipo: TipoOS.INSTALACAO_SEM_BLOQUEIO,
          status: StatusOS.AGENDADO,
        });

        expect(result).toContain('Tipo de Serviço e Detalhes');
      });

      it('string de tipo desconhecida cai no ramo genérico (não quebra com TipoOS)', () => {
        const result = generator.gerar({
          ...osBase,
          tipo: 'TIPO_INVENTADO' as any,
          status: StatusOS.AGENDADO,
        });

        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('TIPO_INVENTADO');
        expect(result).not.toContain('ID a retirar:');
        expect(result).not.toContain('ID a substituir:');
      });
    });
  });
});
