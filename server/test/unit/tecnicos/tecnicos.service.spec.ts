import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TecnicosService } from 'src/tecnicos/tecnicos.service';
import { GeocodingService } from 'src/common/geocoding/geocoding.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('TecnicosService', () => {
  let service: TecnicosService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let geocoding: { geocode: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    geocoding = { geocode: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TecnicosService,
        { provide: PrismaService, useValue: prisma },
        { provide: GeocodingService, useValue: geocoding },
      ],
    }).compile();

    service = module.get<TecnicosService>(TecnicosService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retorna lista de técnicos com preços', async () => {
      const tecnicos = [
        { id: 1, nome: 'Carlos', precos: { instalacaoComBloqueio: 100 } },
        { id: 2, nome: 'Fabio', precos: null },
      ];
      prisma.tecnico.findMany.mockResolvedValue(tecnicos);

      const result = await service.findAll();

      expect(result).toEqual(tecnicos);
      expect(prisma.tecnico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nome: 'asc' },
          include: { precos: true },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando técnico não existe', async () => {
      prisma.tecnico.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Técnico não encontrado',
      );
    });

    it('retorna técnico quando encontrado', async () => {
      const tecnico = { id: 1, nome: 'Carlos', precos: null };
      prisma.tecnico.findUnique.mockResolvedValue(tecnico);

      const result = await service.findOne(1);

      expect(result).toEqual(tecnico);
    });
  });

  describe('create', () => {
    it('cria técnico sem preços', async () => {
      const dto = {
        nome: 'Novo Técnico',
        cpfCnpj: '123',
        telefone: '11999',
        ativo: true,
      };
      const created = { id: 1, ...dto };
      prisma.tecnico.create.mockResolvedValue(created);
      prisma.tecnico.findUnique.mockResolvedValue({ ...created, precos: null });

      const result = await service.create(dto as any);

      expect(result).toMatchObject({ id: 1, nome: 'Novo Técnico' });
      expect(prisma.precoTecnico.create).not.toHaveBeenCalled();
    });

    it('cria técnico com preços', async () => {
      const dto = {
        nome: 'Novo Técnico',
        cpfCnpj: '123',
        ativo: true,
        precos: { instalacaoComBloqueio: 150, instalacaoSemBloqueio: 100 },
      };
      const created = { id: 1, nome: 'Novo Técnico' };
      prisma.tecnico.create.mockResolvedValue(created);
      prisma.precoTecnico.create.mockResolvedValue({ id: 1, tecnicoId: 1 });
      prisma.tecnico.findUnique.mockResolvedValue({
        ...created,
        precos: { instalacaoComBloqueio: 150 },
      });

      await service.create(dto as any);

      expect(prisma.precoTecnico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tecnicoId: 1,
            instalacaoComBloqueio: 150,
          }),
        }),
      );
    });

    it('usa ativo=true como padrão quando não informado', async () => {
      const dto = { nome: 'Técnico', cpfCnpj: '123' };
      const created = { id: 1, nome: 'Técnico', ativo: true };
      prisma.tecnico.create.mockResolvedValue(created);
      prisma.tecnico.findUnique.mockResolvedValue({ ...created, precos: null });

      await service.create(dto as any);

      expect(prisma.tecnico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ativo: true }),
        }),
      );
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando técnico não existe', async () => {
      prisma.tecnico.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nome: 'Novo' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('atualiza técnico sem preços', async () => {
      prisma.tecnico.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Carlos',
        precos: null,
      });
      prisma.tecnico.update.mockResolvedValue({
        id: 1,
        nome: 'Carlos Atualizado',
      });

      await service.update(1, { nome: 'Carlos Atualizado' });

      expect(prisma.tecnico.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(prisma.precoTecnico.update).not.toHaveBeenCalled();
      expect(prisma.precoTecnico.create).not.toHaveBeenCalled();
    });

    it('atualiza preços existentes do técnico', async () => {
      const tecnico = {
        id: 1,
        nome: 'Carlos',
        precos: { tecnicoId: 1, instalacaoComBloqueio: 100 },
      };
      prisma.tecnico.findUnique.mockResolvedValue(tecnico);
      prisma.tecnico.update.mockResolvedValue({ id: 1, nome: 'Carlos' });
      prisma.precoTecnico.findUnique.mockResolvedValue({
        tecnicoId: 1,
        instalacaoComBloqueio: 100,
      });
      prisma.precoTecnico.update.mockResolvedValue({});

      await service.update(1, {
        precos: { instalacaoComBloqueio: 200 },
      } as any);

      expect(prisma.precoTecnico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tecnicoId: 1 },
          data: expect.objectContaining({ instalacaoComBloqueio: 200 }),
        }),
      );
    });

    it('cria preços quando técnico ainda não os possui', async () => {
      prisma.tecnico.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Carlos',
        precos: null,
      });
      prisma.tecnico.update.mockResolvedValue({ id: 1 });
      prisma.precoTecnico.findUnique.mockResolvedValue(null);
      prisma.precoTecnico.create.mockResolvedValue({});

      await service.update(1, {
        precos: { instalacaoComBloqueio: 150 },
      } as any);

      expect(prisma.precoTecnico.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tecnicoId: 1,
            instalacaoComBloqueio: 150,
          }),
        }),
      );
    });
  });

  describe('geocoding', () => {
    it('chama geocoding na criação e persiste lat/lng/precision/geocodedAt', async () => {
      geocoding.geocode.mockResolvedValueOnce({
        lat: -23.55,
        lng: -46.63,
        precision: 'EXATO',
      });
      const dto = {
        nome: 'Novo',
        cep: '01001-000',
        logradouro: 'Rua A',
        numero: '10',
        cidadeEndereco: 'São Paulo',
        estadoEndereco: 'SP',
      };
      prisma.tecnico.create.mockResolvedValue({ id: 1 });
      prisma.tecnico.update.mockResolvedValue({ id: 1 });
      prisma.tecnico.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Novo',
        precos: null,
      });

      await service.create(dto as any);

      expect(geocoding.geocode).toHaveBeenCalledWith(
        expect.objectContaining({
          cep: '01001-000',
          logradouro: 'Rua A',
          numero: '10',
          cidade: 'São Paulo',
          uf: 'SP',
        }),
      );
      expect(prisma.tecnico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            latitude: -23.55,
            longitude: -46.63,
            geocodingPrecision: 'EXATO',
            geocodedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('persiste null em lat/lng quando geocoding falha e não quebra o create', async () => {
      geocoding.geocode.mockResolvedValueOnce(null);
      prisma.tecnico.create.mockResolvedValue({ id: 1 });
      prisma.tecnico.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Sem Coord',
        precos: null,
      });

      const result = await service.create({
        nome: 'Sem Coord',
        cidadeEndereco: 'Xique-Xique',
        estadoEndereco: 'BA',
      } as any);

      expect(result).toMatchObject({ id: 1 });
      expect(prisma.tecnico.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            latitude: expect.any(Number),
          }),
        }),
      );
    });

    it('persiste precision CIDADE vindo do fallback', async () => {
      geocoding.geocode.mockResolvedValueOnce({
        lat: -12.97,
        lng: -38.5,
        precision: 'CIDADE',
      });
      prisma.tecnico.create.mockResolvedValue({ id: 5 });
      prisma.tecnico.update.mockResolvedValue({ id: 5 });
      prisma.tecnico.findUnique.mockResolvedValue({
        id: 5,
        nome: 'Bahiano',
        precos: null,
      });

      await service.create({
        nome: 'Bahiano',
        cidadeEndereco: 'Salvador',
        estadoEndereco: 'BA',
      } as any);

      expect(prisma.tecnico.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            latitude: -12.97,
            longitude: -38.5,
            geocodingPrecision: 'CIDADE',
          }),
        }),
      );
    });

    it('não chama geocoding no update quando endereço não mudou', async () => {
      const existing = {
        id: 1,
        nome: 'Carlos',
        cep: '01001-000',
        logradouro: 'Rua A',
        numero: '10',
        cidadeEndereco: 'São Paulo',
        estadoEndereco: 'SP',
        precos: null,
      };
      prisma.tecnico.findUnique.mockResolvedValue(existing);
      prisma.tecnico.update.mockResolvedValue(existing);

      await service.update(1, {
        nome: 'Carlos Silva',
        cep: '01001-000',
        logradouro: 'Rua A',
        numero: '10',
        cidadeEndereco: 'São Paulo',
        estadoEndereco: 'SP',
      } as any);

      expect(geocoding.geocode).not.toHaveBeenCalled();
    });

    it('chama geocoding no update quando CEP mudou', async () => {
      const existing = {
        id: 1,
        nome: 'Carlos',
        cep: '01001-000',
        logradouro: 'Rua A',
        numero: '10',
        cidadeEndereco: 'São Paulo',
        estadoEndereco: 'SP',
        precos: null,
      };
      prisma.tecnico.findUnique.mockResolvedValue(existing);
      prisma.tecnico.update.mockResolvedValue(existing);
      geocoding.geocode.mockResolvedValueOnce({
        lat: -22.9,
        lng: -43.2,
        precision: 'EXATO',
      });

      await service.update(1, {
        cep: '20040-000',
        logradouro: 'Rua A',
        numero: '10',
        cidadeEndereco: 'São Paulo',
        estadoEndereco: 'SP',
      } as any);

      expect(geocoding.geocode).toHaveBeenCalledTimes(1);
    });
  });
});
