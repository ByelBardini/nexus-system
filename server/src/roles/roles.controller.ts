import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @RequirePermissions('CONFIG.CARGO.LISTAR')
  @ApiOperation({ summary: 'Listar roles por setor' })
  findAll() {
    return this.rolesService.findAllWithSectors();
  }

  @Get('permissions')
  @RequirePermissions('CONFIG.CARGO.LISTAR')
  @ApiOperation({ summary: 'Listar todas as permissões' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Patch(':id/permissions')
  @RequirePermissions('CONFIG.CARGO.EDITAR')
  @ApiOperation({ summary: 'Atualizar permissões do role' })
  updatePermissions(@Param('id') id: string, @Body() body: { permissionIds: number[] }) {
    return this.rolesService.updateRolePermissions(+id, body.permissionIds);
  }

  @Get('users/:userId/roles')
  @RequirePermissions('CONFIG.USUARIO.LISTAR')
  @ApiOperation({ summary: 'Listar roles do usuário' })
  getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(+userId);
  }

  @Patch('users/:userId/roles')
  @RequirePermissions('CONFIG.USUARIO.EDITAR')
  @ApiOperation({ summary: 'Atualizar roles do usuário' })
  updateUserRoles(@Param('userId') userId: string, @Body() body: { roleIds: number[] }) {
    return this.rolesService.updateUserRoles(+userId, body.roleIds);
  }
}
