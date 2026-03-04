import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes')
@UseGuards(PermissionsGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @RequirePermissions('AGENDAMENTO.CLIENTE.LISTAR')
  @ApiOperation({ summary: 'Listar clientes' })
  findAll(@Query('subclientes') subclientes?: string) {
    return this.clientesService.findAll({
      includeSubclientes: subclientes === '1' || subclientes === 'true',
    });
  }

  @Get(':id')
  @RequirePermissions('AGENDAMENTO.CLIENTE.LISTAR')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(+id);
  }

  @Post()
  @RequirePermissions('AGENDAMENTO.CLIENTE.CRIAR')
  @ApiOperation({ summary: 'Criar cliente' })
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('AGENDAMENTO.CLIENTE.EDITAR')
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(+id, dto);
  }
}
