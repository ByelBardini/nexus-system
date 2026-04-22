import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from 'src/roles/roles.controller';
import { RolesService } from 'src/roles/roles.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CategoriaCargo } from '@prisma/client';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const serviceMock = {
    findAllWithSectors: jest.fn(),
    findAllPaginated: jest.fn(),
    findAllSetores: jest.fn(),
    findAllPermissions: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateRolePermissions: jest.fn(),
    getUserRoles: jest.fn(),
    updateUserRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delega para rolesService.findAllWithSectors', async () => {
      const lista = [{ id: 1, nome: 'Admin' }];
      (service.findAllWithSectors as jest.Mock).mockResolvedValue(lista);

      const result = await controller.findAll();

      expect(service.findAllWithSectors).toHaveBeenCalled();
      expect(result).toEqual(lista);
    });
  });

  describe('findAllPaginated', () => {
    it('converte page e limit para número e chama service', async () => {
      (service.findAllPaginated as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findAllPaginated(
        'busca',
        CategoriaCargo.OPERACIONAL,
        '2',
        '25',
      );

      expect(service.findAllPaginated).toHaveBeenCalledWith({
        search: 'busca',
        categoria: CategoriaCargo.OPERACIONAL,
        page: 2,
        limit: 25,
      });
    });

    it('usa defaults quando page e limit não informados', async () => {
      (service.findAllPaginated as jest.Mock).mockResolvedValue({});

      await controller.findAllPaginated();

      expect(service.findAllPaginated).toHaveBeenCalledWith({
        search: undefined,
        categoria: undefined,
        page: 1,
        limit: 15,
      });
    });
  });

  describe('findById', () => {
    it('converte id para número e chama service', async () => {
      const cargo = { id: 3, nome: 'Operador', usuariosVinculados: 2 };
      (service.findById as jest.Mock).mockResolvedValue(cargo);

      const result = await controller.findById(3);

      expect(service.findById).toHaveBeenCalledWith(3);
      expect(result).toEqual(cargo);
    });
  });

  describe('create', () => {
    it('chama service.create com os dados do body', async () => {
      const body = { nome: 'Atendente', code: 'ATEND', setorId: 1 };
      const created = { id: 1, ...body };
      (service.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(body);

      expect(service.create).toHaveBeenCalledWith(body);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('converte id e chama service.update', async () => {
      const body = { nome: 'Atualizado', ativo: false };
      (service.update as jest.Mock).mockResolvedValue({ id: 5, ...body });

      await controller.update(5, body);

      expect(service.update).toHaveBeenCalledWith(5, body);
    });
  });

  describe('updatePermissions', () => {
    it('converte id e chama service.updateRolePermissions', async () => {
      (service.updateRolePermissions as jest.Mock).mockResolvedValue({});

      await controller.updatePermissions(2, { permissionIds: [10, 11] });

      expect(service.updateRolePermissions).toHaveBeenCalledWith(2, [10, 11]);
    });
  });

  describe('getUserRoles', () => {
    it('converte userId para número e chama service', async () => {
      (service.getUserRoles as jest.Mock).mockResolvedValue([
        { id: 1, nome: 'Admin' },
      ]);

      await controller.getUserRoles(10);

      expect(service.getUserRoles).toHaveBeenCalledWith(10);
    });
  });

  describe('updateUserRoles', () => {
    it('converte userId e chama service.updateUserRoles', async () => {
      (service.updateUserRoles as jest.Mock).mockResolvedValue({});

      await controller.updateUserRoles(8, { roleIds: [1, 2] });

      expect(service.updateUserRoles).toHaveBeenCalledWith(8, [1, 2]);
    });
  });
});
