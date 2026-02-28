import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AparelhosService } from './aparelhos.service';
import { StatusAparelho } from '@prisma/client';

@ApiTags('aparelhos')
@ApiBearerAuth()
@Controller('aparelhos')
@UseGuards(PermissionsGuard)
export class AparelhosController {
  constructor(private readonly aparelhosService: AparelhosService) {}

  @Get()
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar aparelhos' })
  findAll() {
    return this.aparelhosService.findAll();
  }

  @Get('resumo')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Resumo de aparelhos por status' })
  getResumo() {
    return this.aparelhosService.getResumo();
  }

  @Get(':id')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Buscar aparelho por ID' })
  findOne(@Param('id') id: string) {
    return this.aparelhosService.findOne(+id);
  }

  @Post('lote')
  @RequirePermissions('CONFIGURACAO.APARELHO.CRIAR')
  @ApiOperation({ summary: 'Criar lote de aparelhos' })
  createLote(@Body() dto: any) {
    return this.aparelhosService.createLote(dto);
  }

  @Patch(':id/status')
  @RequirePermissions('CONFIGURACAO.APARELHO.EDITAR')
  @ApiOperation({ summary: 'Atualizar status do aparelho' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: StatusAparelho; observacao?: string },
  ) {
    return this.aparelhosService.updateStatus(+id, dto.status, dto.observacao);
  }
}
