import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PedidosRastreadoresService } from './pedidos-rastreadores.service';
import { CreatePedidoRastreadorDto } from './dto/create-pedido-rastreador.dto';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto';
import { UpdateKitIdsDto } from './dto/update-kit-ids.dto';
import { BulkAparelhoDestinatarioDto } from './dto/bulk-aparelho-destinatario.dto';
import { StatusPedidoRastreador } from '@prisma/client';

@ApiTags('pedidos-rastreadores')
@ApiBearerAuth()
@Controller('pedidos-rastreadores')
@UseGuards(PermissionsGuard)
export class PedidosRastreadoresController {
  constructor(private readonly service: PedidosRastreadoresService) {}

  @Get()
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR')
  @ApiOperation({
    summary: 'Listar pedidos de rastreadores com paginação e filtros',
  })
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

  @Patch(':id/kits')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR')
  @ApiOperation({ summary: 'Atualizar kits vinculados ao pedido' })
  updateKitIds(@Param('id') id: string, @Body() dto: UpdateKitIdsDto) {
    return this.service.updateKitIds(+id, dto.kitIds);
  }

  @Post(':id/aparelhos-destinatarios')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR')
  @ApiOperation({
    summary: 'Atribuir destinatário em lote para aparelhos do pedido MISTO',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  bulkSetDestinatarios(
    @Param('id') id: string,
    @Body() dto: BulkAparelhoDestinatarioDto,
  ) {
    return this.service.bulkSetDestinatarios(+id, dto);
  }

  @Get(':id/aparelhos-destinatarios')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR')
  @ApiOperation({
    summary: 'Obter destinatários e cotas dos aparelhos do pedido MISTO',
  })
  getAparelhosDestinatarios(@Param('id') id: string) {
    return this.service.getAparelhosDestinatarios(+id);
  }

  @Delete(':id/aparelhos-destinatarios/:aparelhoId')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.EDITAR')
  @ApiOperation({ summary: 'Remover destinatário de aparelho do pedido MISTO' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAparelhoDestinatario(
    @Param('id') id: string,
    @Param('aparelhoId') aparelhoId: string,
  ) {
    return this.service.removeAparelhoDestinatario(+id, +aparelhoId);
  }

  @Delete(':id')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR')
  @ApiOperation({ summary: 'Excluir pedido de rastreador' })
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
