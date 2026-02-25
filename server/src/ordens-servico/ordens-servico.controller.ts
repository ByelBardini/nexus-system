import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { OrdensServicoService } from './ordens-servico.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StatusOS } from '@prisma/client';

@ApiTags('ordens-servico')
@ApiBearerAuth()
@Controller('ordens-servico')
@UseGuards(PermissionsGuard)
export class OrdensServicoController {
  constructor(private readonly service: OrdensServicoService) {}

  @Get('resumo')
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Resumo de contagens por status' })
  getResumo() {
    return this.service.getResumo();
  }

  @Get()
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Listar ordens de serviço com paginação' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: StatusOS,
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
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @RequirePermissions('AGENDAMENTO.OS.CRIAR')
  @ApiOperation({ summary: 'Criar ordem de serviço' })
  create(@Body() dto: CreateOrdemServicoDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  @RequirePermissions('AGENDAMENTO.OS.EDITAR')
  @ApiOperation({ summary: 'Atualizar status da ordem de serviço' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(+id, dto);
  }
}
