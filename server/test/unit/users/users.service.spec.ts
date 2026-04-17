import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { createPrismaMock } from '../helpers/prisma-mock';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retorna lista de usuários sem senhaHash', async () => {
      const users = [
        { id: 1, nome: 'Alice', senhaHash: 'hash1', usuarioCargos: [] },
        { id: 2, nome: 'Bob', senhaHash: 'hash2', usuarioCargos: [] },
      ];
      prisma.usuario.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('senhaHash');
      expect(result[1]).not.toHaveProperty('senhaHash');
      expect(result[0]).toMatchObject({ id: 1, nome: 'Alice' });
    });
  });

  describe('findAllPaginated', () => {
    it('retorna resultado paginado com total e totalPages', async () => {
      const users = [
        { id: 1, nome: 'Alice', senhaHash: 'hash', usuarioCargos: [] },
      ];
      prisma.usuario.findMany.mockResolvedValue(users);
      prisma.usuario.count.mockResolvedValue(1);

      const result = await service.findAllPaginated({ page: 1, limit: 15 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('senhaHash');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('aplica filtro de search nos campos nome e email', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);
      prisma.usuario.count.mockResolvedValue(0);

      await service.findAllPaginated({ search: 'alice', page: 1, limit: 15 });

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('aplica filtro de ativo quando informado', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);
      prisma.usuario.count.mockResolvedValue(0);

      await service.findAllPaginated({ ativo: true, page: 1, limit: 15 });

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        }),
      );
    });

    it('calcula skip corretamente para página 2', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);
      prisma.usuario.count.mockResolvedValue(30);

      const result = await service.findAllPaginated({ page: 2, limit: 10 });

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const promise = service.findOne(999);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Usuário não encontrado');
    });

    it('retorna usuário sem senhaHash quando encontrado', async () => {
      const user = {
        id: 1,
        nome: 'Alice',
        senhaHash: 'hash',
        usuarioCargos: [],
      };
      prisma.usuario.findUnique.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(result).not.toHaveProperty('senhaHash');
      expect(result).toMatchObject({ id: 1, nome: 'Alice' });
    });
  });

  describe('create', () => {
    it('lança ConflictException quando email já está cadastrado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'alice@test.com',
      });

      const promise = service.create({
        nome: 'Alice',
        email: 'alice@test.com',
        password: '123',
      });
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('Email já cadastrado');
    });

    it('cria usuário e retorna sem senhaHash', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      const created = {
        id: 1,
        nome: 'Alice',
        email: 'alice@test.com',
        senhaHash: 'hash',
        ativo: true,
      };
      prisma.usuario.create.mockResolvedValue(created);

      const result = await service.create({
        nome: 'Alice',
        email: 'alice@test.com',
        password: 'senha123',
      });

      expect(result).not.toHaveProperty('senhaHash');
      expect(result).toMatchObject({ id: 1, nome: 'Alice' });
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nome: 'Alice',
            email: 'alice@test.com',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nome: 'Novo' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException quando novo email já pertence a outro usuário', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        nome: 'Alice',
        senhaHash: 'h',
        usuarioCargos: [],
      });
      prisma.usuario.findFirst.mockResolvedValue({
        id: 2,
        email: 'bob@test.com',
      });

      await expect(
        service.update(1, { email: 'bob@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('atualiza usuário e retorna sem senhaHash', async () => {
      const user = { id: 1, nome: 'Alice', senhaHash: 'h', usuarioCargos: [] };
      prisma.usuario.findUnique.mockResolvedValue(user);
      prisma.usuario.findFirst.mockResolvedValue(null);
      const updated = {
        id: 1,
        nome: 'Alice Atualizada',
        email: 'alice@test.com',
        senhaHash: 'h',
      };
      prisma.usuario.update.mockResolvedValue(updated);

      const result = await service.update(1, { nome: 'Alice Atualizada' });

      expect(result).not.toHaveProperty('senhaHash');
      expect(result).toMatchObject({ id: 1, nome: 'Alice Atualizada' });
    });
  });

  describe('resetPassword', () => {
    it('lança NotFoundException quando usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('reseta senha e retorna mensagem de sucesso', async () => {
      const user = {
        id: 1,
        nome: 'Alice',
        senhaHash: 'hash',
        usuarioCargos: [],
      };
      prisma.usuario.findUnique.mockResolvedValue(user);
      prisma.usuario.update.mockResolvedValue({ ...user });

      const result = await service.resetPassword(1);

      expect(result).toEqual({ message: 'Senha resetada com sucesso' });
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ senhaHash: expect.any(String) }),
        }),
      );
    });
  });

  describe('getPermissions', () => {
    it('retorna lista de códigos de permissões únicos', () => {
      const user = {
        id: 1,
        email: 'user@test.com',
        ativo: true,
        senhaHash: 'h',
        usuarioCargos: [
          {
            cargo: {
              cargoPermissoes: [
                { permissao: { code: 'AGENDAMENTO.OS.LISTAR' } },
                { permissao: { code: 'AGENDAMENTO.CLIENTE.LISTAR' } },
              ],
            },
          },
          {
            cargo: {
              cargoPermissoes: [
                { permissao: { code: 'AGENDAMENTO.OS.LISTAR' } },
              ],
            },
          },
        ],
      } as unknown as NonNullable<
        Awaited<ReturnType<typeof service.findByEmail>>
      >;

      const permissions = service.getPermissions(user);

      expect(permissions).toHaveLength(2);
      expect(permissions).toContain('AGENDAMENTO.OS.LISTAR');
      expect(permissions).toContain('AGENDAMENTO.CLIENTE.LISTAR');
    });

    it('retorna lista vazia quando usuário não tem cargos', () => {
      const user = {
        id: 1,
        email: 'user@test.com',
        ativo: true,
        senhaHash: 'h',
        usuarioCargos: [],
      } as unknown as NonNullable<
        Awaited<ReturnType<typeof service.findByEmail>>
      >;

      const permissions = service.getPermissions(user);

      expect(permissions).toEqual([]);
    });
  });
});
