import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { VeiculosService } from './veiculos.service';

@ApiTags('veiculos')
@ApiBearerAuth()
@Controller('veiculos')
@UseGuards(PermissionsGuard)
export class VeiculosController {
  constructor(private readonly service: VeiculosService) {}

  @Get()
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Listar veículos' })
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }
}
