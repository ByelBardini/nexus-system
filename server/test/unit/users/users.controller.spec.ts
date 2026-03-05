import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const serviceMock = {
    findAll: jest.fn(),
    findAllPaginated: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delega para usersService.findAll', async () => {
      const lista = [{ id: 1, nome: 'Alice' }];
      (service.findAll as jest.Mock).mockResolvedValue(lista);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(lista);
    });
  });

  describe('findAllPaginated', () => {
    it('converte query strings e chama service com parâmetros corretos', async () => {
      const paginado = { data: [], total: 0, page: 2, totalPages: 0 };
      (service.findAllPaginated as jest.Mock).mockResolvedValue(paginado);

      await controller.findAllPaginated('alice', 'true', '2', '20');

      expect(service.findAllPaginated).toHaveBeenCalledWith({
        search: 'alice',
        ativo: true,
        page: 2,
        limit: 20,
      });
    });

    it('usa defaults quando query strings não informadas', async () => {
      (service.findAllPaginated as jest.Mock).mockResolvedValue({});

      await controller.findAllPaginated();

      expect(service.findAllPaginated).toHaveBeenCalledWith({
        search: undefined,
        ativo: undefined,
        page: 1,
        limit: 15,
      });
    });

    it('converte ativo=false corretamente', async () => {
      (service.findAllPaginated as jest.Mock).mockResolvedValue({});

      await controller.findAllPaginated(undefined, 'false');

      expect(service.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: false }),
      );
    });
  });

  describe('findOne', () => {
    it('converte id de string para número e chama o service', async () => {
      const user = { id: 5, nome: 'Alice' };
      (service.findOne as jest.Mock).mockResolvedValue(user);

      const result = await controller.findOne('5');

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(user);
    });
  });

  describe('create', () => {
    it('chama service.create com o DTO', async () => {
      const dto = { nome: 'Alice', email: 'alice@test.com', password: '123' };
      const created = { id: 1, nome: 'Alice' };
      (service.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('converte id e chama service.update', async () => {
      const dto = { nome: 'Alice Atualizada' };
      const updated = { id: 3, nome: 'Alice Atualizada' };
      (service.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update('3', dto as any);

      expect(service.update).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('resetPassword', () => {
    it('converte id e chama service.resetPassword', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({ message: 'Senha resetada com sucesso' });

      const result = await controller.resetPassword('7');

      expect(service.resetPassword).toHaveBeenCalledWith(7);
      expect(result).toEqual({ message: 'Senha resetada com sucesso' });
    });
  });
});
