import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AparelhosService } from './aparelhos.service';
import { LotesService } from './lotes.service';
import { KitsService } from './kits.service';
import { PareamentoService } from './pareamento.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { CreateIndividualDto } from './dto/create-individual.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { PareamentoPreviewDto } from './dto/pareamento-preview.dto';
import { PareamentoDto } from './dto/pareamento.dto';
import { UpdateAparelhoKitDto } from './dto/update-aparelho-kit.dto';
import { CreateKitDto } from './dto/create-kit.dto';

@ApiTags('aparelhos')
@ApiBearerAuth()
@Controller('aparelhos')
@UseGuards(PermissionsGuard)
export class AparelhosController {
  constructor(
    private readonly aparelhosService: AparelhosService,
    private readonly lotesService: LotesService,
    private readonly kitsService: KitsService,
    private readonly pareamentoService: PareamentoService,
  ) {}

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

  @Get('para-testes')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar rastreadores para testes (filtrados por cliente e técnico)' })
  findParaTestes(
    @Query('clienteId') clienteId: string,
    @Query('tecnicoId') tecnicoId?: string,
    @Query('ordemServicoId') ordemServicoId?: string,
  ) {
    const cId = parseInt(clienteId, 10);
    if (isNaN(cId)) return [];
    const tId = tecnicoId ? parseInt(tecnicoId, 10) : undefined;
    const osId = ordemServicoId ? parseInt(ordemServicoId, 10) : undefined;
    return this.aparelhosService.findParaTestes(
      cId,
      isNaN(tId!) ? undefined : tId,
      isNaN(osId!) ? undefined : osId,
    );
  }

  @Get('pareamento/lotes-rastreadores')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar lotes de rastreadores com itens sem ID' })
  getLotesRastreadores() {
    return this.lotesService.getLotesParaPareamento('RASTREADOR');
  }

  @Get('pareamento/lotes-sims')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar lotes de SIMs com itens sem ID' })
  getLotesSims() {
    return this.lotesService.getLotesParaPareamento('SIM');
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
  createLote(@Body() dto: CreateLoteDto) {
    return this.lotesService.createLote(dto);
  }

  @Post('individual')
  @RequirePermissions('CONFIGURACAO.APARELHO.CRIAR')
  @ApiOperation({ summary: 'Criar aparelho individual' })
  createIndividual(@Body() dto: CreateIndividualDto) {
    return this.aparelhosService.createIndividual(dto);
  }

  @Patch(':id/status')
  @RequirePermissions('CONFIGURACAO.APARELHO.EDITAR')
  @ApiOperation({ summary: 'Atualizar status do aparelho' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.aparelhosService.updateStatus(+id, dto.status, dto.observacao);
  }

  @Post('pareamento/preview')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Preview de pareamento (rastreador + SIM)' })
  pareamentoPreview(@Body() dto: PareamentoPreviewDto) {
    return this.pareamentoService.pareamentoPreview(dto.pares || []);
  }

  @Post('pareamento')
  @RequirePermissions('CONFIGURACAO.APARELHO.CRIAR')
  @ApiOperation({ summary: 'Executar pareamento (criar equipamentos)' })
  pareamento(@Body() dto: PareamentoDto) {
    return this.pareamentoService.pareamento({
      pares: dto.pares,
      loteRastreadorId: dto.loteRastreadorId,
      loteSimId: dto.loteSimId,
      rastreadorManual: dto.rastreadorManual,
      simManual: dto.simManual,
      kitId: dto.kitId,
      kitNome: dto.kitNome,
    });
  }

  @Get('pareamento/kits')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar kits cadastrados' })
  getKits() {
    return this.kitsService.getKits();
  }

  @Get('pareamento/kits/detalhes')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar kits com detalhes (nome, data, quantidade, modelos)' })
  getKitsComDetalhes() {
    return this.kitsService.getKitsComDetalhes();
  }

  @Get('pareamento/kits/:id')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Buscar kit por ID com aparelhos' })
  getKitById(@Param('id') id: string) {
    return this.kitsService.getKitById(+id);
  }

  @Patch('pareamento/aparelho/:id/kit')
  @RequirePermissions('CONFIGURACAO.APARELHO.EDITAR')
  @ApiOperation({ summary: 'Adicionar ou remover aparelho do kit' })
  updateAparelhoKit(
    @Param('id') id: string,
    @Body() dto: UpdateAparelhoKitDto,
  ) {
    return this.kitsService.updateAparelhoKit(+id, dto.kitId ?? null);
  }

  @Get('pareamento/aparelhos-disponiveis')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  @ApiOperation({ summary: 'Listar aparelhos disponíveis para adicionar ao kit' })
  getAparelhosDisponiveisParaKit() {
    return this.kitsService.getAparelhosDisponiveisParaKit();
  }

  @Post('pareamento/kits')
  @RequirePermissions('CONFIGURACAO.APARELHO.CRIAR')
  @ApiOperation({ summary: 'Criar ou buscar kit por nome' })
  createKit(@Body() dto: CreateKitDto) {
    return this.kitsService.criarOuBuscarKitPorNome(dto.nome.trim());
  }
}
