import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriaCargo } from '@prisma/client';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { ROLES_CONTROLLER_PERMISSIONS } from './roles.permissions';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_LISTAR)
  @ApiOperation({ summary: 'Listar roles por setor' })
  findAll() {
    return this.rolesService.findAllWithSectors();
  }

  @Get('paginated')
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_LISTAR)
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
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_LISTAR)
  @ApiOperation({ summary: 'Listar setores' })
  findAllSetores() {
    return this.rolesService.findAllSetores();
  }

  @Get('permissions')
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_LISTAR)
  @ApiOperation({ summary: 'Listar todas as permissões' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_LISTAR)
  @ApiOperation({ summary: 'Buscar cargo por ID' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_CRIAR)
  @ApiOperation({ summary: 'Criar novo cargo' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_EDITAR)
  @ApiOperation({ summary: 'Atualizar cargo' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Patch(':id/permissions')
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.CARGO_EDITAR)
  @ApiOperation({ summary: 'Atualizar permissões do role' })
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.updateRolePermissions(id, dto.permissionIds);
  }

  @Get('users/:userId/roles')
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.USUARIO_LISTAR)
  @ApiOperation({ summary: 'Listar roles do usuário' })
  getUserRoles(@Param('userId', ParseIntPipe) userId: number) {
    return this.rolesService.getUserRoles(userId);
  }

  @Patch('users/:userId/roles')
  @RequirePermissions(ROLES_CONTROLLER_PERMISSIONS.USUARIO_EDITAR)
  @ApiOperation({ summary: 'Atualizar roles do usuário' })
  updateUserRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignRolesDto,
  ) {
    return this.rolesService.updateUserRoles(userId, dto.roleIds);
  }
}
