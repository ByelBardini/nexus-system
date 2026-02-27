import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('CONFIG.USUARIO.LISTAR')
  @ApiOperation({ summary: 'Listar usuários' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('paginated')
  @RequirePermissions('CONFIG.USUARIO.LISTAR')
  @ApiOperation({ summary: 'Listar usuários com paginação' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'ativo', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAllPaginated(
    @Query('search') search?: string,
    @Query('ativo') ativo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAllPaginated({
      search,
      ativo: ativo === undefined ? undefined : ativo === 'true',
      page: page ? +page : 1,
      limit: limit ? +limit : 15,
    });
  }

  @Get(':id')
  @RequirePermissions('CONFIG.USUARIO.LISTAR')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post()
  @RequirePermissions('CONFIG.USUARIO.CRIAR')
  @ApiOperation({ summary: 'Criar usuário' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIG.USUARIO.EDITAR')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  @Post(':id/reset-password')
  @RequirePermissions('CONFIG.USUARIO.EDITAR')
  @ApiOperation({ summary: 'Resetar senha do usuário para o padrão' })
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(+id);
  }
}
