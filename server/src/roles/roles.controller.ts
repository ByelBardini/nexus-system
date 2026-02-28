import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CategoriaCargo } from '@prisma/client';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('ADMINISTRATIVO.CARGO.LISTAR')
  @ApiOperation({ summary: 'Listar roles por setor' })
  findAll() {
    return this.rolesService.findAllWithSectors();
  }

  @Get('paginated')
  @RequirePermissions('ADMINISTRATIVO.CARGO.LISTAR')
  @ApiOperation({ summary: 'Listar roles com paginação e filtros' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoria', required: false, enum: CategoriaCargo })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAllPaginated(
    @Query('search') search?: string,
    @Query('categoria') categoria?: CategoriaCargo,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rolesService.findAllPaginated({
      search,
      categoria,
      page: page ? +page : 1,
      limit: limit ? +limit : 15,
    });
  }

  @Get('setores')
  @RequirePermissions('ADMINISTRATIVO.CARGO.LISTAR')
  @ApiOperation({ summary: 'Listar setores' })
  findAllSetores() {
    return this.rolesService.findAllSetores();
  }

  @Get('permissions')
  @RequirePermissions('ADMINISTRATIVO.CARGO.LISTAR')
  @ApiOperation({ summary: 'Listar todas as permissões' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @RequirePermissions('ADMINISTRATIVO.CARGO.LISTAR')
  @ApiOperation({ summary: 'Buscar cargo por ID' })
  findById(@Param('id') id: string) {
    return this.rolesService.findById(+id);
  }

  @Post()
  @RequirePermissions('ADMINISTRATIVO.CARGO.CRIAR')
  @ApiOperation({ summary: 'Criar novo cargo' })
  create(
    @Body()
    body: {
      nome: string;
      code: string;
      setorId: number;
      descricao?: string;
      categoria?: CategoriaCargo;
      ativo?: boolean;
    },
  ) {
    return this.rolesService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('ADMINISTRATIVO.CARGO.EDITAR')
  @ApiOperation({ summary: 'Atualizar cargo' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      nome?: string;
      descricao?: string;
      categoria?: CategoriaCargo;
      ativo?: boolean;
    },
  ) {
    return this.rolesService.update(+id, body);
  }

  @Patch(':id/permissions')
  @RequirePermissions('ADMINISTRATIVO.CARGO.EDITAR')
  @ApiOperation({ summary: 'Atualizar permissões do role' })
  updatePermissions(@Param('id') id: string, @Body() body: { permissionIds: number[] }) {
    return this.rolesService.updateRolePermissions(+id, body.permissionIds);
  }

  @Get('users/:userId/roles')
  @RequirePermissions('ADMINISTRATIVO.USUARIO.LISTAR')
  @ApiOperation({ summary: 'Listar roles do usuário' })
  getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(+userId);
  }

  @Patch('users/:userId/roles')
  @RequirePermissions('ADMINISTRATIVO.USUARIO.EDITAR')
  @ApiOperation({ summary: 'Atualizar roles do usuário' })
  updateUserRoles(@Param('userId') userId: string, @Body() body: { roleIds: number[] }) {
    return this.rolesService.updateUserRoles(+userId, body.roleIds);
  }
}
