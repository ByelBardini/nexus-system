import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { EquipamentosService } from './equipamentos.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { CreateOperadoraDto } from './dto/create-operadora.dto';
import { UpdateOperadoraDto } from './dto/update-operadora.dto';
import { CreateMarcaSimcardDto } from './dto/create-marca-simcard.dto';
import { UpdateMarcaSimcardDto } from './dto/update-marca-simcard.dto';
import { CreatePlanoSimcardDto } from './dto/create-plano-simcard.dto';
import { UpdatePlanoSimcardDto } from './dto/update-plano-simcard.dto';

@ApiTags('equipamentos')
@ApiBearerAuth()
@Controller('equipamentos')
@UseGuards(PermissionsGuard)
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  // ============= MARCAS =============

  @Get('marcas')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Listar marcas' })
  findAllMarcas() {
    return this.equipamentosService.findAllMarcas();
  }

  @Get('marcas/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Buscar marca por ID' })
  findOneMarca(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.findOneMarca(id);
  }

  @Post('marcas')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.CRIAR')
  @ApiOperation({ summary: 'Criar marca' })
  createMarca(@Body() dto: CreateMarcaDto) {
    return this.equipamentosService.createMarca(dto);
  }

  @Patch('marcas/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EDITAR')
  @ApiOperation({ summary: 'Atualizar marca' })
  updateMarca(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarcaDto,
  ) {
    return this.equipamentosService.updateMarca(id, dto);
  }

  @Delete('marcas/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EXCLUIR')
  @ApiOperation({ summary: 'Deletar marca' })
  deleteMarca(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.deleteMarca(id);
  }

  // ============= MODELOS =============

  @Get('modelos')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Listar modelos' })
  @ApiQuery({ name: 'marcaId', required: false, type: Number })
  findAllModelos(
    @Query('marcaId', new ParseIntPipe({ optional: true })) marcaId?: number,
  ) {
    return this.equipamentosService.findAllModelos(marcaId);
  }

  @Get('modelos/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Buscar modelo por ID' })
  findOneModelo(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.findOneModelo(id);
  }

  @Post('modelos')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.CRIAR')
  @ApiOperation({ summary: 'Criar modelo' })
  createModelo(@Body() dto: CreateModeloDto) {
    return this.equipamentosService.createModelo(dto);
  }

  @Patch('modelos/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EDITAR')
  @ApiOperation({ summary: 'Atualizar modelo' })
  updateModelo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModeloDto,
  ) {
    return this.equipamentosService.updateModelo(id, dto);
  }

  @Delete('modelos/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EXCLUIR')
  @ApiOperation({ summary: 'Deletar modelo' })
  deleteModelo(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.deleteModelo(id);
  }

  // ============= OPERADORAS =============

  @Get('operadoras')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Listar operadoras' })
  findAllOperadoras() {
    return this.equipamentosService.findAllOperadoras();
  }

  @Get('operadoras/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Buscar operadora por ID' })
  findOneOperadora(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.findOneOperadora(id);
  }

  @Post('operadoras')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.CRIAR')
  @ApiOperation({ summary: 'Criar operadora' })
  createOperadora(@Body() dto: CreateOperadoraDto) {
    return this.equipamentosService.createOperadora(dto);
  }

  @Patch('operadoras/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EDITAR')
  @ApiOperation({ summary: 'Atualizar operadora' })
  updateOperadora(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOperadoraDto,
  ) {
    return this.equipamentosService.updateOperadora(id, dto);
  }

  @Delete('operadoras/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EXCLUIR')
  @ApiOperation({ summary: 'Deletar operadora' })
  deleteOperadora(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.deleteOperadora(id);
  }

  // ============= MARCAS SIMCARD =============

  @Get('marcas-simcard')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Listar marcas de simcard' })
  @ApiQuery({ name: 'operadoraId', required: false, type: Number })
  findAllMarcasSimcard(
    @Query('operadoraId', new ParseIntPipe({ optional: true }))
    operadoraId?: number,
  ) {
    return this.equipamentosService.findAllMarcasSimcard(operadoraId);
  }

  @Get('marcas-simcard/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Buscar marca de simcard por ID' })
  findOneMarcaSimcard(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.findOneMarcaSimcard(id);
  }

  @Post('marcas-simcard')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.CRIAR')
  @ApiOperation({ summary: 'Criar marca de simcard' })
  createMarcaSimcard(@Body() dto: CreateMarcaSimcardDto) {
    return this.equipamentosService.createMarcaSimcard(dto);
  }

  @Patch('marcas-simcard/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EDITAR')
  @ApiOperation({ summary: 'Atualizar marca de simcard' })
  updateMarcaSimcard(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarcaSimcardDto,
  ) {
    return this.equipamentosService.updateMarcaSimcard(id, dto);
  }

  @Delete('marcas-simcard/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EXCLUIR')
  @ApiOperation({ summary: 'Deletar marca de simcard' })
  deleteMarcaSimcard(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.deleteMarcaSimcard(id);
  }

  // ============= PLANOS SIMCARD =============

  @Get('planos-simcard')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Listar planos de simcard' })
  @ApiQuery({ name: 'marcaSimcardId', required: false, type: Number })
  findAllPlanosSimcard(
    @Query('marcaSimcardId', new ParseIntPipe({ optional: true }))
    marcaSimcardId?: number,
  ) {
    return this.equipamentosService.findAllPlanosSimcard(marcaSimcardId);
  }

  @Get('planos-simcard/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.LISTAR')
  @ApiOperation({ summary: 'Buscar plano de simcard por ID' })
  findOnePlanoSimcard(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.findOnePlanoSimcard(id);
  }

  @Post('planos-simcard')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.CRIAR')
  @ApiOperation({ summary: 'Criar plano de simcard' })
  createPlanoSimcard(@Body() dto: CreatePlanoSimcardDto) {
    return this.equipamentosService.createPlanoSimcard(dto);
  }

  @Patch('planos-simcard/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EDITAR')
  @ApiOperation({ summary: 'Atualizar plano de simcard' })
  updatePlanoSimcard(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanoSimcardDto,
  ) {
    return this.equipamentosService.updatePlanoSimcard(id, dto);
  }

  @Delete('planos-simcard/:id')
  @RequirePermissions('CONFIGURACAO.EQUIPAMENTO.EXCLUIR')
  @ApiOperation({ summary: 'Desativar plano de simcard' })
  deletePlanoSimcard(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.deletePlanoSimcard(id);
  }
}
