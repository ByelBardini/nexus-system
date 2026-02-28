import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EquipamentosService } from './equipamentos.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { CreateOperadoraDto } from './dto/create-operadora.dto';
import { UpdateOperadoraDto } from './dto/update-operadora.dto';

@ApiTags('equipamentos')
@ApiBearerAuth()
@Controller('equipamentos')
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  // ============= MARCAS =============

  @Get('marcas')
  @ApiOperation({ summary: 'Listar marcas' })
  findAllMarcas() {
    return this.equipamentosService.findAllMarcas();
  }

  @Get('marcas/:id')
  @ApiOperation({ summary: 'Buscar marca por ID' })
  findOneMarca(@Param('id') id: string) {
    return this.equipamentosService.findOneMarca(+id);
  }

  @Post('marcas')
  @ApiOperation({ summary: 'Criar marca' })
  createMarca(@Body() dto: CreateMarcaDto) {
    return this.equipamentosService.createMarca(dto);
  }

  @Patch('marcas/:id')
  @ApiOperation({ summary: 'Atualizar marca' })
  updateMarca(@Param('id') id: string, @Body() dto: UpdateMarcaDto) {
    return this.equipamentosService.updateMarca(+id, dto);
  }

  @Delete('marcas/:id')
  @ApiOperation({ summary: 'Deletar marca' })
  deleteMarca(@Param('id') id: string) {
    return this.equipamentosService.deleteMarca(+id);
  }

  // ============= MODELOS =============

  @Get('modelos')
  @ApiOperation({ summary: 'Listar modelos' })
  @ApiQuery({ name: 'marcaId', required: false, type: Number })
  findAllModelos(@Query('marcaId') marcaId?: string) {
    return this.equipamentosService.findAllModelos(marcaId ? +marcaId : undefined);
  }

  @Get('modelos/:id')
  @ApiOperation({ summary: 'Buscar modelo por ID' })
  findOneModelo(@Param('id') id: string) {
    return this.equipamentosService.findOneModelo(+id);
  }

  @Post('modelos')
  @ApiOperation({ summary: 'Criar modelo' })
  createModelo(@Body() dto: CreateModeloDto) {
    return this.equipamentosService.createModelo(dto);
  }

  @Patch('modelos/:id')
  @ApiOperation({ summary: 'Atualizar modelo' })
  updateModelo(@Param('id') id: string, @Body() dto: UpdateModeloDto) {
    return this.equipamentosService.updateModelo(+id, dto);
  }

  @Delete('modelos/:id')
  @ApiOperation({ summary: 'Deletar modelo' })
  deleteModelo(@Param('id') id: string) {
    return this.equipamentosService.deleteModelo(+id);
  }

  // ============= OPERADORAS =============

  @Get('operadoras')
  @ApiOperation({ summary: 'Listar operadoras' })
  findAllOperadoras() {
    return this.equipamentosService.findAllOperadoras();
  }

  @Get('operadoras/:id')
  @ApiOperation({ summary: 'Buscar operadora por ID' })
  findOneOperadora(@Param('id') id: string) {
    return this.equipamentosService.findOneOperadora(+id);
  }

  @Post('operadoras')
  @ApiOperation({ summary: 'Criar operadora' })
  createOperadora(@Body() dto: CreateOperadoraDto) {
    return this.equipamentosService.createOperadora(dto);
  }

  @Patch('operadoras/:id')
  @ApiOperation({ summary: 'Atualizar operadora' })
  updateOperadora(@Param('id') id: string, @Body() dto: UpdateOperadoraDto) {
    return this.equipamentosService.updateOperadora(+id, dto);
  }

  @Delete('operadoras/:id')
  @ApiOperation({ summary: 'Deletar operadora' })
  deleteOperadora(@Param('id') id: string) {
    return this.equipamentosService.deleteOperadora(+id);
  }
}
