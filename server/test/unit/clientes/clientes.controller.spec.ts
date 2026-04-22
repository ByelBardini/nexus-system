import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from 'src/clientes/clientes.controller';
import { ClientesService } from 'src/clientes/clientes.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('ClientesController', () => {
  let controller: ClientesController;
  let service: ClientesService;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [{ provide: ClientesService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientesController>(ClientesController);
    service = module.get<ClientesService>(ClientesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('chama service.findAll sem subclientes por padrão', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({
        includeSubclientes: false,
      });
    });

    it('inclui subclientes quando subclientes=1', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll('1');

      expect(service.findAll).toHaveBeenCalledWith({
        includeSubclientes: true,
      });
    });

    it('inclui subclientes quando subclientes=true', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll('true');

      expect(service.findAll).toHaveBeenCalledWith({
        includeSubclientes: true,
      });
    });
  });

  describe('findOne', () => {
    it('converte id para número e chama service.findOne', async () => {
      const cliente = { id: 1, nome: 'Cliente A' };
      (service.findOne as jest.Mock).mockResolvedValue(cliente);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(cliente);
    });
  });

  describe('create', () => {
    it('chama service.create com o DTO', async () => {
      const dto = { nome: 'Novo Cliente' };
      const created = { id: 1, ...dto };
      (service.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('converte id e chama service.update', async () => {
      const dto = { nome: 'Atualizado' };
      (service.update as jest.Mock).mockResolvedValue({
        id: 4,
        nome: 'Atualizado',
      });

      await controller.update('4', dto as any);

      expect(service.update).toHaveBeenCalledWith(4, dto);
    });

    it('propaga BadRequestException do service (ex.: contato de outro cliente)', async () => {
      (service.update as jest.Mock).mockRejectedValue(
        new BadRequestException('Contato não pertence a este cliente'),
      );

      await expect(
        controller.update('2', { contatos: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
