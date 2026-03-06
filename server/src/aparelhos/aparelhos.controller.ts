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
  constructor(private readonly aparelhosService: AparelhosService) { }

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

  @Get('pareamento/lotes-rastreadores')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar lotes de rastreadores com itens sem ID' })
  getLotesRastreadores() {
    return this.aparelhosService.getLotesParaPareamento('RASTREADOR');
  }

  @Get('pareamento/lotes-sims')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar lotes de SIMs com itens sem ID' })
  getLotesSims() {
    return this.aparelhosService.getLotesParaPareamento('SIM');
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

  @Post('individual')
  @RequirePermissions('CONFIGURACAO.APARELHO.CRIAR')
  @ApiOperation({ summary: 'Criar aparelho individual' })
  createIndividual(@Body() dto: any) {
    return this.aparelhosService.createIndividual(dto);
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

  @Post('pareamento/preview')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Preview de pareamento (rastreador + SIM)' })
  pareamentoPreview(@Body() dto: { pares: { imei: string; iccid: string }[] }) {
    return this.aparelhosService.pareamentoPreview(dto.pares || []);
  }

  @Post('pareamento')
  @RequirePermissions('CONFIGURACAO.APARELHO.CRIAR')
  @ApiOperation({ summary: 'Executar pareamento (criar equipamentos)' })
  pareamento(
    @Body()
    dto: {
      pares: { imei: string; iccid: string }[];
      loteRastreadorId?: number;
      loteSimId?: number;
      rastreadorManual?: { marca: string; modelo: string };
      simManual?: { operadora: string };
      kitId?: number;
      kitNome?: string;
    },
  ) {
    return this.aparelhosService.pareamento(dto);
  }

  @Get('pareamento/kits')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar kits cadastrados' })
  getKits() {
    return this.aparelhosService.getKits();
  }

  @Get('pareamento/kits/detalhes')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar kits com detalhes (nome, data, quantidade, modelos)' })
  getKitsComDetalhes() {
    return this.aparelhosService.getKitsComDetalhes();
  }

  @Get('pareamento/kits/:id')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Buscar kit por ID com aparelhos' })
  getKitById(@Param('id') id: string) {
    return this.aparelhosService.getKitById(+id);
  }

  @Patch('pareamento/aparelho/:id/kit')
  @RequirePermissions('CONFIGURACAO.APARELHO.EDITAR')
  @ApiOperation({ summary: 'Adicionar ou remover aparelho do kit' })
  updateAparelhoKit(
    @Param('id') id: string,
    @Body() dto: { kitId: number | null },
  ) {
    return this.aparelhosService.updateAparelhoKit(+id, dto.kitId);
  }

  @Get('pareamento/aparelhos-disponiveis')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar aparelhos disponíveis para adicionar ao kit' })
  getAparelhosDisponiveisParaKit() {
    return this.aparelhosService.getAparelhosDisponiveisParaKit();
  }

  @Post('pareamento/kits')
  @RequirePermissions('CONFIGURACAO.APARELHO.CRIAR')
  @ApiOperation({ summary: 'Criar ou buscar kit por nome' })
  createKit(@Body() dto: { nome: string }) {
    return this.aparelhosService.criarOuBuscarKitPorNome(dto.nome?.trim() ?? '');
  }
}
