import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    updateLastLogin: jest.fn(),
    getPermissions: jest.fn(),
    findById: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('lança UnauthorizedException quando usuário não existe', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      const promise = service.login('inexistente@test.com', '123');
      await expect(promise).rejects.toThrow(UnauthorizedException);
      await expect(promise).rejects.toThrow('Credenciais inválidas');
    });

    it('lança UnauthorizedException quando usuário está inativo', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        ativo: false,
        senhaHash: 'hash',
        usuarioCargos: [],
      });

      await expect(service.login('user@test.com', '123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando senha é inválida', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        ativo: true,
        senhaHash: await bcrypt.hash('correta', 10),
        usuarioCargos: [],
      });

      await expect(service.login('user@test.com', 'errada')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('retorna accessToken, user e permissions com credenciais válidas', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      const user = {
        id: 1,
        nome: 'Usuário Teste',
        email: 'user@test.com',
        ativo: true,
        senhaHash,
        usuarioCargos: [],
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      usersServiceMock.updateLastLogin.mockResolvedValue(undefined);
      usersServiceMock.getPermissions.mockReturnValue([
        'AGENDAMENTO.OS.LISTAR',
      ]);
      jwtServiceMock.sign.mockReturnValue('jwt-token');

      const result = await service.login('user@test.com', 'senha123');

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toEqual({
        id: 1,
        nome: 'Usuário Teste',
        email: 'user@test.com',
      });
      expect(result.permissions).toEqual(['AGENDAMENTO.OS.LISTAR']);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(1);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'user@test.com',
      });
    });
  });

  describe('validateUser', () => {
    it('delega para usersService.findById', async () => {
      const user = { id: 1, nome: 'Usuário' };
      usersServiceMock.findById.mockResolvedValue(user);

      const result = await service.validateUser(1);

      expect(result).toEqual(user);
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });

    it('retorna null quando usuário não existe', async () => {
      usersServiceMock.findById.mockResolvedValue(null);

      const result = await service.validateUser(999);

      expect(result).toBeNull();
    });
  });
});
