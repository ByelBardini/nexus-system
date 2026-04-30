import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { TabelasConfigController } from 'src/tabelas-config/tabelas-config.controller';
import { TabelasConfigService } from 'src/tabelas-config/tabelas-config.service';

const serviceMock = {
  listarCategoriasFalha: jest.fn(),
  listarCategoriasFalhaAtivas: jest.fn(),
  criarCategoriaFalha: jest.fn(),
  atualizarCategoriaFalha: jest.fn(),
  desativarCategoriaFalha: jest.fn(),
};

describe('TabelasConfigController', () => {
  let controller: TabelasConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TabelasConfigController],
      providers: [{ provide: TabelasConfigService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get<TabelasConfigController>(TabelasConfigController);
    jest.clearAllMocks();
  });

  it('listarCategoriasFalha delega ao service', async () => {
    const categorias = [{ id: 1, nome: 'Dano Físico' }];
    serviceMock.listarCategoriasFalha.mockResolvedValue(categorias);

    const result = await controller.listarCategoriasFalha();

    expect(serviceMock.listarCategoriasFalha).toHaveBeenCalled();
    expect(result).toEqual(categorias);
  });

  it('listarCategoriasFalhaAtivas delega ao service', async () => {
    serviceMock.listarCategoriasFalhaAtivas.mockResolvedValue([]);
    await controller.listarCategoriasFalhaAtivas();
    expect(serviceMock.listarCategoriasFalhaAtivas).toHaveBeenCalled();
  });

  it('criarCategoriaFalha delega ao service com dto', async () => {
    const dto = { nome: 'Nova Categoria' };
    serviceMock.criarCategoriaFalha.mockResolvedValue({ id: 5, ...dto });

    await controller.criarCategoriaFalha(dto);

    expect(serviceMock.criarCategoriaFalha).toHaveBeenCalledWith(dto);
  });

  it('atualizarCategoriaFalha delega ao service com id e dto', async () => {
    const dto = { nome: 'Atualizado' };
    serviceMock.atualizarCategoriaFalha.mockResolvedValue({});

    await controller.atualizarCategoriaFalha(1, dto);

    expect(serviceMock.atualizarCategoriaFalha).toHaveBeenCalledWith(1, dto);
  });

  it('desativarCategoriaFalha delega ao service com id', async () => {
    serviceMock.desativarCategoriaFalha.mockResolvedValue({});

    await controller.desativarCategoriaFalha(3);

    expect(serviceMock.desativarCategoriaFalha).toHaveBeenCalledWith(3);
  });
});
