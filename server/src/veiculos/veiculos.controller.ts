import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { VeiculosService } from './veiculos.service';
import { CriarOuBuscarVeiculoDto } from './dto/criar-ou-buscar-veiculo.dto';

@ApiTags('veiculos')
@ApiBearerAuth()
@Controller('veiculos')
@UseGuards(PermissionsGuard)
export class VeiculosController {
  constructor(private readonly service: VeiculosService) {}

  @Post('criar-ou-buscar')
  @RequirePermissions('AGENDAMENTO.OS.CRIAR')
  @ApiOperation({ summary: 'Criar ou buscar veículo por placa' })
  criarOuBuscar(@Body() dto: CriarOuBuscarVeiculoDto) {
    return this.service.criarOuBuscarPorPlaca({
      placa: dto.placa,
      marca: dto.marca,
      modelo: dto.modelo,
      ano: dto.ano,
      cor: dto.cor,
    });
  }

  @Get('consulta-placa/:placa')
  @RequirePermissions('AGENDAMENTO.OS.CRIAR')
  @ApiOperation({ summary: 'Consulta dados do veículo pela placa' })
  consultaPlaca(@Param('placa') placa: string) {
    return this.service.consultaPlaca(placa);
  }

  @Get()
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Listar veículos' })
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }
}
