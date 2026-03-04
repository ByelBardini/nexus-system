import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PedidosRastreadoresService } from './pedidos-rastreadores.service';
import { CreatePedidoRastreadorDto } from './dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto';
import { StatusPedidoRastreador } from '@prisma/client';

@ApiTags('pedidos-rastreadores')
@ApiBearerAuth()
@Controller('pedidos-rastreadores')
@UseGuards(PermissionsGuard)
export class PedidosRastreadoresController {
  constructor(private readonly service: PedidosRastreadoresService) {}

  @Get()
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR')
  @ApiOperation({ summary: 'Listar pedidos de rastreadores com paginação e filtros' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: StatusPedidoRastreador,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      status,
      search,
    });
  }

  @Get(':id')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR')
  @ApiOperation({ summary: 'Buscar pedido de rastreador por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.CRIAR')
  @ApiOperation({ summary: 'Criar pedido de rastreador' })
  create(
    @Body() dto: CreatePedidoRastreadorDto,
    @CurrentUser('id') criadoPorId?: number,
  ) {
    return this.service.create(dto, criadoPorId);
  }

  @Patch(':id/status')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR')
  @ApiOperation({ summary: 'Atualizar status do pedido de rastreador' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusPedidoDto) {
    return this.service.updateStatus(+id, dto);
  }

  @Delete(':id')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR')
  @ApiOperation({ summary: 'Excluir pedido de rastreador' })
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
