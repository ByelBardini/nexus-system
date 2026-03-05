import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const authServiceMock = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('delega para authService.login com email e password do DTO', async () => {
      const dto = { email: 'user@test.com', password: 'senha123' };
      const response = {
        accessToken: 'jwt-token',
        user: { id: 1, nome: 'Usuário', email: 'user@test.com' },
        permissions: [],
      };
      authServiceMock.login.mockResolvedValue(response);

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith('user@test.com', 'senha123');
      expect(result).toEqual(response);
    });

    it('propaga UnauthorizedException do service', async () => {
      authServiceMock.login.mockRejectedValue(new UnauthorizedException('Credenciais inválidas'));

      await expect(controller.login({ email: 'x@x.com', password: 'errada' })).rejects.toThrow(
        'Credenciais inválidas',
      );
    });
  });
});
