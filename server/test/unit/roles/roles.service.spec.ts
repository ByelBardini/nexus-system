import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RolesService } from 'src/roles/roles.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  describe('findAllWithSectors', () => {
    it('retorna lista de cargos com setor e permissões', async () => {
      const cargos = [{ id: 1, nome: 'Admin', setor: { nome: 'Administrativo' }, cargoPermissoes: [] }];
      prisma.cargo.findMany.mockResolvedValue(cargos);

      const result = await service.findAllWithSectors();

      expect(result).toEqual(cargos);
      expect(prisma.cargo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: expect.objectContaining({ setor: true }) }),
      );
    });
  });

  describe('findAllPaginated', () => {
    it('retorna resultado paginado com usuariosVinculados mapeado', async () => {
      const cargos = [
        { id: 1, nome: 'Admin', setor: {}, cargoPermissoes: [], _count: { usuarioCargos: 3 } },
      ];
      prisma.cargo.findMany.mockResolvedValue(cargos);
      prisma.cargo.count.mockResolvedValue(1);

      const result = await service.findAllPaginated({ page: 1, limit: 15 });

      expect(result.data[0]).toMatchObject({ id: 1, nome: 'Admin', usuariosVinculados: 3 });
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('filtra por search no nome', async () => {
      prisma.cargo.findMany.mockResolvedValue([]);
      prisma.cargo.count.mockResolvedValue(0);

      await service.findAllPaginated({ search: 'admin', page: 1, limit: 15 });

      expect(prisma.cargo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ nome: expect.any(Object) }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('lança NotFoundException quando cargo não existe', async () => {
      prisma.cargo.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow('Cargo não encontrado');
    });

    it('retorna cargo com usuariosVinculados quando encontrado', async () => {
      const cargo = {
        id: 1,
        nome: 'Admin',
        setor: {},
        cargoPermissoes: [],
        _count: { usuarioCargos: 5 },
      };
      prisma.cargo.findUnique.mockResolvedValue(cargo);

      const result = await service.findById(1);

      expect(result).toMatchObject({ id: 1, nome: 'Admin', usuariosVinculados: 5 });
    });
  });

  describe('create', () => {
    it('cria cargo com valores padrão para categoria e ativo', async () => {
      const novoCargo = { id: 1, nome: 'Atendente', code: 'ATEND', setor: {}, cargoPermissoes: [] };
      prisma.cargo.create.mockResolvedValue(novoCargo);

      const result = await service.create({ nome: 'Atendente', code: 'ATEND', setorId: 1 });

      expect(result).toEqual(novoCargo);
      expect(prisma.cargo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ categoria: 'OPERACIONAL', ativo: true }),
        }),
      );
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando cargo não existe', async () => {
      prisma.cargo.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nome: 'Novo' })).rejects.toThrow(NotFoundException);
    });

    it('atualiza cargo existente', async () => {
      prisma.cargo.findUnique.mockResolvedValue({ id: 1, nome: 'Admin' });
      const updated = { id: 1, nome: 'Admin Atualizado', setor: {}, cargoPermissoes: [] };
      prisma.cargo.update.mockResolvedValue(updated);

      const result = await service.update(1, { nome: 'Admin Atualizado' });

      expect(result).toEqual(updated);
      expect(prisma.cargo.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { nome: 'Admin Atualizado' } }),
      );
    });
  });

  describe('updateRolePermissions', () => {
    it('limpa permissões existentes e insere as novas dentro de uma transação', async () => {
      const cargo = { id: 1, nome: 'Admin', cargoPermissoes: [] };
      prisma.cargoPermissao.deleteMany.mockResolvedValue({ count: 2 });
      prisma.cargoPermissao.createMany.mockResolvedValue({ count: 3 });
      prisma.cargo.findUniqueOrThrow.mockResolvedValue(cargo);

      await service.updateRolePermissions(1, [10, 11, 12]);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.cargo.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('não chama createMany quando lista de permissões é vazia', async () => {
      prisma.cargoPermissao.deleteMany.mockResolvedValue({ count: 0 });
      prisma.cargo.findUniqueOrThrow.mockResolvedValue({ id: 1, cargoPermissoes: [] });

      await service.updateRolePermissions(1, []);

      expect(prisma.cargoPermissao.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getUserRoles', () => {
    it('lança NotFoundException quando usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.getUserRoles(999)).rejects.toThrow(NotFoundException);
      await expect(service.getUserRoles(999)).rejects.toThrow('Usuário não encontrado');
    });

    it('retorna cargos do usuário', async () => {
      const usuario = {
        id: 1,
        usuarioCargos: [
          { cargo: { id: 1, nome: 'Admin' } },
          { cargo: { id: 2, nome: 'Operador' } },
        ],
      };
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      const result = await service.getUserRoles(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, nome: 'Admin' });
    });
  });

  describe('updateUserRoles', () => {
    it('lança NotFoundException quando usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.updateUserRoles(999, [1])).rejects.toThrow(NotFoundException);
    });

    it('substitui cargos do usuário dentro de uma transação', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 1 });
      prisma.usuarioCargo.deleteMany.mockResolvedValue({ count: 1 });
      prisma.usuarioCargo.createMany.mockResolvedValue({ count: 2 });
      prisma.usuario.findUniqueOrThrow.mockResolvedValue({ id: 1, usuarioCargos: [] });

      await service.updateUserRoles(1, [2, 3]);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
