import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { DebitosRastreadoresService } from './debitos-rastreadores.service';
import { ListDebitosDto } from './dto/list-debitos.dto';

@ApiTags('debitos-rastreadores')
@ApiBearerAuth()
@Controller('debitos-rastreadores')
@UseGuards(PermissionsGuard)
export class DebitosRastreadoresController {
  constructor(private readonly service: DebitosRastreadoresService) {}

  @Get()
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR')
  @ApiOperation({ summary: 'Listar débitos de rastreadores entre clientes' })
  findAll(@Query() query: ListDebitosDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('AGENDAMENTO.PEDIDO_RASTREADOR.LISTAR')
  @ApiOperation({ summary: 'Buscar débito de rastreador por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
}
