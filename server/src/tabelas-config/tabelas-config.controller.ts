import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateCategoriaFalhaDto } from './dto/create-categoria-falha.dto';
import { UpdateCategoriaFalhaDto } from './dto/update-categoria-falha.dto';
import { TabelasConfigService } from './tabelas-config.service';

@ApiTags('tabelas-config')
@Controller('tabelas-config')
@UseGuards(PermissionsGuard)
export class TabelasConfigController {
  constructor(private readonly tabelasConfigService: TabelasConfigService) {}

  @Get('categorias-falha')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  listarCategoriasFalha() {
    return this.tabelasConfigService.listarCategoriasFalha();
  }

  @Get('categorias-falha/ativas')
  @RequirePermissions('CONFIGURACAO.APARELHO.LISTAR')
  listarCategoriasFalhaAtivas() {
    return this.tabelasConfigService.listarCategoriasFalhaAtivas();
  }

  @Post('categorias-falha')
  @RequirePermissions('CONFIGURACAO.APARELHO.EDITAR')
  criarCategoriaFalha(@Body() dto: CreateCategoriaFalhaDto) {
    return this.tabelasConfigService.criarCategoriaFalha(dto);
  }

  @Patch('categorias-falha/:id')
  @RequirePermissions('CONFIGURACAO.APARELHO.EDITAR')
  atualizarCategoriaFalha(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaFalhaDto,
  ) {
    return this.tabelasConfigService.atualizarCategoriaFalha(id, dto);
  }

  @Delete('categorias-falha/:id')
  @RequirePermissions('CONFIGURACAO.APARELHO.EDITAR')
  desativarCategoriaFalha(@Param('id', ParseIntPipe) id: number) {
    return this.tabelasConfigService.desativarCategoriaFalha(id);
  }
}
