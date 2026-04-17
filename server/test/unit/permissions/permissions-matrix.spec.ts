import 'reflect-metadata';
import { PERMISSIONS_KEY } from 'src/auth/decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { AparelhosController } from 'src/aparelhos/aparelhos.controller';
import { AppController } from 'src/app.controller';
import { AuthController } from 'src/auth/auth.controller';
import { ClientesController } from 'src/clientes/clientes.controller';
import { EquipamentosController } from 'src/equipamentos/equipamentos.controller';
import { OrdensServicoController } from 'src/ordens-servico/ordens-servico.controller';
import { PedidosRastreadoresController } from 'src/pedidos-rastreadores/pedidos-rastreadores.controller';
import { RolesController } from 'src/roles/roles.controller';
import { TecnicosController } from 'src/tecnicos/tecnicos.controller';
import { UsersController } from 'src/users/users.controller';
import { VeiculosController } from 'src/veiculos/veiculos.controller';

const getPerms = (ctrl: any, method: string): string[] =>
  Reflect.getMetadata(PERMISSIONS_KEY, ctrl.prototype[method]) ?? [];

const isPublic = (ctrl: any, method: string): boolean =>
  Reflect.getMetadata(IS_PUBLIC_KEY, ctrl.prototype[method]) ?? false;

describe('Matrix de Permissões', () => {
  // ─── Rotas públicas ────────────────────────────────────────────────────────

  describe('AppController', () => {
    it('getHello é pública', () => {
      expect(isPublic(AppController, 'getHello')).toBe(true);
    });
  });

  describe('AuthController', () => {
    it('login é pública', () => {
      expect(isPublic(AuthController, 'login')).toBe(true);
    });

    it('trocarSenha não tem permissão específica (auto-serviço)', () => {
      expect(getPerms(AuthController, 'trocarSenha')).toHaveLength(0);
    });
  });

  // ─── ADMINISTRATIVO ────────────────────────────────────────────────────────

  describe('UsersController', () => {
    it('findAll exige ADMINISTRATIVO.USUARIO.LISTAR', () => {
      expect(getPerms(UsersController, 'findAll')).toContain(
        'ADMINISTRATIVO.USUARIO.LISTAR',
      );
    });

    it('findAllPaginated exige ADMINISTRATIVO.USUARIO.LISTAR', () => {
      expect(getPerms(UsersController, 'findAllPaginated')).toContain(
        'ADMINISTRATIVO.USUARIO.LISTAR',
      );
    });

    it('findOne exige ADMINISTRATIVO.USUARIO.LISTAR', () => {
      expect(getPerms(UsersController, 'findOne')).toContain(
        'ADMINISTRATIVO.USUARIO.LISTAR',
      );
    });

    it('create exige ADMINISTRATIVO.USUARIO.CRIAR', () => {
      expect(getPerms(UsersController, 'create')).toContain(
        'ADMINISTRATIVO.USUARIO.CRIAR',
      );
    });

    it('update exige ADMINISTRATIVO.USUARIO.EDITAR', () => {
      expect(getPerms(UsersController, 'update')).toContain(
        'ADMINISTRATIVO.USUARIO.EDITAR',
      );
    });

    it('resetPassword exige ADMINISTRATIVO.USUARIO.EDITAR', () => {
      expect(getPerms(UsersController, 'resetPassword')).toContain(
        'ADMINISTRATIVO.USUARIO.EDITAR',
      );
    });
  });

  describe('RolesController', () => {
    it('findAll exige ADMINISTRATIVO.CARGO.LISTAR', () => {
      expect(getPerms(RolesController, 'findAll')).toContain(
        'ADMINISTRATIVO.CARGO.LISTAR',
      );
    });

    it('findAllPaginated exige ADMINISTRATIVO.CARGO.LISTAR', () => {
      expect(getPerms(RolesController, 'findAllPaginated')).toContain(
        'ADMINISTRATIVO.CARGO.LISTAR',
      );
    });

    it('findAllSetores exige ADMINISTRATIVO.CARGO.LISTAR', () => {
      expect(getPerms(RolesController, 'findAllSetores')).toContain(
        'ADMINISTRATIVO.CARGO.LISTAR',
      );
    });

    it('findAllPermissions exige ADMINISTRATIVO.CARGO.LISTAR', () => {
      expect(getPerms(RolesController, 'findAllPermissions')).toContain(
        'ADMINISTRATIVO.CARGO.LISTAR',
      );
    });

    it('findById exige ADMINISTRATIVO.CARGO.LISTAR', () => {
      expect(getPerms(RolesController, 'findById')).toContain(
        'ADMINISTRATIVO.CARGO.LISTAR',
      );
    });

    it('create exige ADMINISTRATIVO.CARGO.CRIAR', () => {
      expect(getPerms(RolesController, 'create')).toContain(
        'ADMINISTRATIVO.CARGO.CRIAR',
      );
    });

    it('update exige ADMINISTRATIVO.CARGO.EDITAR', () => {
      expect(getPerms(RolesController, 'update')).toContain(
        'ADMINISTRATIVO.CARGO.EDITAR',
      );
    });

    it('updatePermissions exige ADMINISTRATIVO.CARGO.EDITAR', () => {
      expect(getPerms(RolesController, 'updatePermissions')).toContain(
        'ADMINISTRATIVO.CARGO.EDITAR',
      );
    });

    it('getUserRoles exige ADMINISTRATIVO.USUARIO.LISTAR', () => {
      expect(getPerms(RolesController, 'getUserRoles')).toContain(
        'ADMINISTRATIVO.USUARIO.LISTAR',
      );
    });

    it('updateUserRoles exige ADMINISTRATIVO.USUARIO.EDITAR', () => {
      expect(getPerms(RolesController, 'updateUserRoles')).toContain(
        'ADMINISTRATIVO.USUARIO.EDITAR',
      );
    });
  });

  // ─── CONFIGURACAO ──────────────────────────────────────────────────────────

  describe('AparelhosController', () => {
    it('findAll exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'findAll')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    it('getResumo exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'getResumo')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    // ↓ RED — testes que vão FALHAR até a implementação
    it('findParaTestes exige AGENDAMENTO.TESTES.LISTAR', () => {
      expect(getPerms(AparelhosController, 'findParaTestes')).toContain(
        'AGENDAMENTO.TESTES.LISTAR',
      );
    });

    it('findParaTestes exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(AparelhosController, 'findParaTestes')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });
    // ↑ RED

    it('getLotesRastreadores exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'getLotesRastreadores')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    it('getLotesSims exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'getLotesSims')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    it('findOne exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'findOne')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    it('createLote exige CONFIGURACAO.APARELHO.CRIAR', () => {
      expect(getPerms(AparelhosController, 'createLote')).toContain(
        'CONFIGURACAO.APARELHO.CRIAR',
      );
    });

    it('createIndividual exige CONFIGURACAO.APARELHO.CRIAR', () => {
      expect(getPerms(AparelhosController, 'createIndividual')).toContain(
        'CONFIGURACAO.APARELHO.CRIAR',
      );
    });

    it('updateStatus exige CONFIGURACAO.APARELHO.EDITAR', () => {
      expect(getPerms(AparelhosController, 'updateStatus')).toContain(
        'CONFIGURACAO.APARELHO.EDITAR',
      );
    });

    it('pareamentoPreview exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'pareamentoPreview')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    it('pareamento exige CONFIGURACAO.APARELHO.CRIAR', () => {
      expect(getPerms(AparelhosController, 'pareamento')).toContain(
        'CONFIGURACAO.APARELHO.CRIAR',
      );
    });

    it('getKitsComDetalhes exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'getKitsComDetalhes')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    it('getKitById exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(getPerms(AparelhosController, 'getKitById')).toContain(
        'CONFIGURACAO.APARELHO.LISTAR',
      );
    });

    it('updateAparelhoKit exige CONFIGURACAO.APARELHO.EDITAR', () => {
      expect(getPerms(AparelhosController, 'updateAparelhoKit')).toContain(
        'CONFIGURACAO.APARELHO.EDITAR',
      );
    });

    it('getAparelhosDisponiveisParaKit exige CONFIGURACAO.APARELHO.LISTAR', () => {
      expect(
        getPerms(AparelhosController, 'getAparelhosDisponiveisParaKit'),
      ).toContain('CONFIGURACAO.APARELHO.LISTAR');
    });

    it('createKit exige CONFIGURACAO.APARELHO.CRIAR', () => {
      expect(getPerms(AparelhosController, 'createKit')).toContain(
        'CONFIGURACAO.APARELHO.CRIAR',
      );
    });
  });

  describe('EquipamentosController', () => {
    it('findAllMarcas exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findAllMarcas')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('findOneMarca exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findOneMarca')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('createMarca exige CONFIGURACAO.EQUIPAMENTO.CRIAR', () => {
      expect(getPerms(EquipamentosController, 'createMarca')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.CRIAR',
      );
    });

    it('updateMarca exige CONFIGURACAO.EQUIPAMENTO.EDITAR', () => {
      expect(getPerms(EquipamentosController, 'updateMarca')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EDITAR',
      );
    });

    it('deleteMarca exige CONFIGURACAO.EQUIPAMENTO.EXCLUIR', () => {
      expect(getPerms(EquipamentosController, 'deleteMarca')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EXCLUIR',
      );
    });

    it('findAllModelos exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findAllModelos')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('findOneModelo exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findOneModelo')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('createModelo exige CONFIGURACAO.EQUIPAMENTO.CRIAR', () => {
      expect(getPerms(EquipamentosController, 'createModelo')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.CRIAR',
      );
    });

    it('updateModelo exige CONFIGURACAO.EQUIPAMENTO.EDITAR', () => {
      expect(getPerms(EquipamentosController, 'updateModelo')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EDITAR',
      );
    });

    it('deleteModelo exige CONFIGURACAO.EQUIPAMENTO.EXCLUIR', () => {
      expect(getPerms(EquipamentosController, 'deleteModelo')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EXCLUIR',
      );
    });

    it('findAllOperadoras exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findAllOperadoras')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('findOneOperadora exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findOneOperadora')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('createOperadora exige CONFIGURACAO.EQUIPAMENTO.CRIAR', () => {
      expect(getPerms(EquipamentosController, 'createOperadora')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.CRIAR',
      );
    });

    it('updateOperadora exige CONFIGURACAO.EQUIPAMENTO.EDITAR', () => {
      expect(getPerms(EquipamentosController, 'updateOperadora')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EDITAR',
      );
    });

    it('deleteOperadora exige CONFIGURACAO.EQUIPAMENTO.EXCLUIR', () => {
      expect(getPerms(EquipamentosController, 'deleteOperadora')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EXCLUIR',
      );
    });

    it('findAllMarcasSimcard exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(
        getPerms(EquipamentosController, 'findAllMarcasSimcard'),
      ).toContain('CONFIGURACAO.EQUIPAMENTO.LISTAR');
    });

    it('findOneMarcaSimcard exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findOneMarcaSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('createMarcaSimcard exige CONFIGURACAO.EQUIPAMENTO.CRIAR', () => {
      expect(getPerms(EquipamentosController, 'createMarcaSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.CRIAR',
      );
    });

    it('updateMarcaSimcard exige CONFIGURACAO.EQUIPAMENTO.EDITAR', () => {
      expect(getPerms(EquipamentosController, 'updateMarcaSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EDITAR',
      );
    });

    it('deleteMarcaSimcard exige CONFIGURACAO.EQUIPAMENTO.EXCLUIR', () => {
      expect(getPerms(EquipamentosController, 'deleteMarcaSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EXCLUIR',
      );
    });

    it('findAllPlanosSimcard exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(
        getPerms(EquipamentosController, 'findAllPlanosSimcard'),
      ).toContain('CONFIGURACAO.EQUIPAMENTO.LISTAR');
    });

    it('findOnePlanoSimcard exige CONFIGURACAO.EQUIPAMENTO.LISTAR', () => {
      expect(getPerms(EquipamentosController, 'findOnePlanoSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.LISTAR',
      );
    });

    it('createPlanoSimcard exige CONFIGURACAO.EQUIPAMENTO.CRIAR', () => {
      expect(getPerms(EquipamentosController, 'createPlanoSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.CRIAR',
      );
    });

    it('updatePlanoSimcard exige CONFIGURACAO.EQUIPAMENTO.EDITAR', () => {
      expect(getPerms(EquipamentosController, 'updatePlanoSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EDITAR',
      );
    });

    it('deletePlanoSimcard exige CONFIGURACAO.EQUIPAMENTO.EXCLUIR', () => {
      expect(getPerms(EquipamentosController, 'deletePlanoSimcard')).toContain(
        'CONFIGURACAO.EQUIPAMENTO.EXCLUIR',
      );
    });
  });

  // ─── AGENDAMENTO ───────────────────────────────────────────────────────────

  describe('ClientesController', () => {
    it('findAll exige AGENDAMENTO.CLIENTE.LISTAR', () => {
      expect(getPerms(ClientesController, 'findAll')).toContain(
        'AGENDAMENTO.CLIENTE.LISTAR',
      );
    });

    it('findOne exige AGENDAMENTO.CLIENTE.LISTAR', () => {
      expect(getPerms(ClientesController, 'findOne')).toContain(
        'AGENDAMENTO.CLIENTE.LISTAR',
      );
    });

    it('create exige AGENDAMENTO.CLIENTE.CRIAR', () => {
      expect(getPerms(ClientesController, 'create')).toContain(
        'AGENDAMENTO.CLIENTE.CRIAR',
      );
    });

    it('update exige AGENDAMENTO.CLIENTE.EDITAR', () => {
      expect(getPerms(ClientesController, 'update')).toContain(
        'AGENDAMENTO.CLIENTE.EDITAR',
      );
    });
  });

  describe('TecnicosController', () => {
    it('findAll exige AGENDAMENTO.TECNICO.LISTAR', () => {
      expect(getPerms(TecnicosController, 'findAll')).toContain(
        'AGENDAMENTO.TECNICO.LISTAR',
      );
    });

    it('findOne exige AGENDAMENTO.TECNICO.LISTAR', () => {
      expect(getPerms(TecnicosController, 'findOne')).toContain(
        'AGENDAMENTO.TECNICO.LISTAR',
      );
    });

    it('create exige AGENDAMENTO.TECNICO.CRIAR', () => {
      expect(getPerms(TecnicosController, 'create')).toContain(
        'AGENDAMENTO.TECNICO.CRIAR',
      );
    });

    it('update exige AGENDAMENTO.TECNICO.EDITAR', () => {
      expect(getPerms(TecnicosController, 'update')).toContain(
        'AGENDAMENTO.TECNICO.EDITAR',
      );
    });
  });

  describe('OrdensServicoController', () => {
    it('getResumo exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'getResumo')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });

    // ↓ RED — testes que vão FALHAR até a implementação
    it('getClienteInfinity exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'getClienteInfinity')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });

    it('getClienteInfinity não exige AGENDAMENTO.OS.CRIAR', () => {
      expect(
        getPerms(OrdensServicoController, 'getClienteInfinity'),
      ).not.toContain('AGENDAMENTO.OS.CRIAR');
    });

    it('findTestando exige AGENDAMENTO.TESTES.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'findTestando')).toContain(
        'AGENDAMENTO.TESTES.LISTAR',
      );
    });
    // ↑ RED

    it('findTestando exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'findTestando')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });

    it('findAll exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'findAll')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });

    it('getHtmlImpressao exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'getHtmlImpressao')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });

    it('getPdf exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'getPdf')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });

    it('findOne exige AGENDAMENTO.OS.LISTAR', () => {
      expect(getPerms(OrdensServicoController, 'findOne')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });

    it('create exige AGENDAMENTO.OS.CRIAR', () => {
      expect(getPerms(OrdensServicoController, 'create')).toContain(
        'AGENDAMENTO.OS.CRIAR',
      );
    });

    it('update exige AGENDAMENTO.OS.EDITAR', () => {
      expect(getPerms(OrdensServicoController, 'update')).toContain(
        'AGENDAMENTO.OS.EDITAR',
      );
    });

    it('updateStatus exige AGENDAMENTO.OS.EDITAR', () => {
      expect(getPerms(OrdensServicoController, 'updateStatus')).toContain(
        'AGENDAMENTO.OS.EDITAR',
      );
    });

    // ↓ RED — testes que vão FALHAR até a implementação
    it('updateIdAparelho exige AGENDAMENTO.TESTES.EXECUTAR', () => {
      expect(getPerms(OrdensServicoController, 'updateIdAparelho')).toContain(
        'AGENDAMENTO.TESTES.EXECUTAR',
      );
    });
    // ↑ RED

    it('updateIdAparelho exige AGENDAMENTO.OS.EDITAR', () => {
      expect(getPerms(OrdensServicoController, 'updateIdAparelho')).toContain(
        'AGENDAMENTO.OS.EDITAR',
      );
    });
  });

  describe('PedidosRastreadoresController', () => {
    it('findAll exige AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR', () => {
      expect(getPerms(PedidosRastreadoresController, 'findAll')).toContain(
        'AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR',
      );
    });

    it('findOne exige AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR', () => {
      expect(getPerms(PedidosRastreadoresController, 'findOne')).toContain(
        'AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR',
      );
    });

    it('create exige AGENDAMENTO.PEDIDO_RASTREADOR.CRIAR', () => {
      expect(getPerms(PedidosRastreadoresController, 'create')).toContain(
        'AGENDAMENTO.PEDIDO_RASTREADOR.CRIAR',
      );
    });

    it('updateStatus exige AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR', () => {
      expect(getPerms(PedidosRastreadoresController, 'updateStatus')).toContain(
        'AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR',
      );
    });

    it('remove exige AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR', () => {
      expect(getPerms(PedidosRastreadoresController, 'remove')).toContain(
        'AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR',
      );
    });
  });

  describe('VeiculosController', () => {
    it('criarOuBuscar exige AGENDAMENTO.OS.CRIAR (acoplado ao fluxo de OS)', () => {
      expect(getPerms(VeiculosController, 'criarOuBuscar')).toContain(
        'AGENDAMENTO.OS.CRIAR',
      );
    });

    it('consultaPlaca exige AGENDAMENTO.OS.CRIAR (acoplado ao fluxo de OS)', () => {
      expect(getPerms(VeiculosController, 'consultaPlaca')).toContain(
        'AGENDAMENTO.OS.CRIAR',
      );
    });

    it('findAll exige AGENDAMENTO.OS.LISTAR (acoplado ao fluxo de OS)', () => {
      expect(getPerms(VeiculosController, 'findAll')).toContain(
        'AGENDAMENTO.OS.LISTAR',
      );
    });
  });
});
