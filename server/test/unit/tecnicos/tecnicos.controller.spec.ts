import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TecnicosController } from 'src/tecnicos/tecnicos.controller';
import { TecnicosService } from 'src/tecnicos/tecnicos.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('TecnicosController', () => {
  let controller: TecnicosController;
  let service: TecnicosService;

  const serviceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TecnicosController],
      providers: [{ provide: TecnicosService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TecnicosController>(TecnicosController);
    service = module.get<TecnicosService>(TecnicosService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delega para tecnicosService.findAll', async () => {
      const lista = [{ id: 1, nome: 'Carlos' }];
      (service.findAll as jest.Mock).mockResolvedValue(lista);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(lista);
    });
  });

  describe('findOne', () => {
    it('converte id para número e chama service.findOne', async () => {
      const tecnico = { id: 5, nome: 'Carlos' };
      (service.findOne as jest.Mock).mockResolvedValue(tecnico);

      const result = await controller.findOne('5');

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(tecnico);
    });

    it('propaga NotFoundException do service', async () => {
      (service.findOne as jest.Mock).mockRejectedValue(
        new NotFoundException('Técnico não encontrado'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('999')).rejects.toThrow(
        'Técnico não encontrado',
      );
    });
  });

  describe('create', () => {
    it('chama service.create com o DTO', async () => {
      const dto = { nome: 'Novo Técnico', cpfCnpj: '123' };
      const created = { id: 1, ...dto };
      (service.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('converte id e chama service.update', async () => {
      const dto = { nome: 'Carlos Atualizado' };
      (service.update as jest.Mock).mockResolvedValue({
        id: 3,
        nome: 'Carlos Atualizado',
      });

      await controller.update('3', dto as any);

      expect(service.update).toHaveBeenCalledWith(3, dto);
    });

    it('passa NaN para service quando id não é numérico', async () => {
      const dto = { nome: 'X' };
      (service.update as jest.Mock).mockRejectedValue(
        new NotFoundException('Técnico não encontrado'),
      );

      await expect(controller.update('abc', dto as any)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.update).toHaveBeenCalledWith(NaN, dto);
    });
  });
});
