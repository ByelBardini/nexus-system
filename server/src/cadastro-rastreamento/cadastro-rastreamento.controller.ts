import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CadastroRastreamentoService } from './cadastro-rastreamento.service';
import { FindPendentesQueryDto } from './dto/find-pendentes-query.dto';
import { ConcluirCadastroDto } from './dto/concluir-cadastro.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('cadastro-rastreamento')
@ApiBearerAuth()
@Controller('cadastro-rastreamento')
@UseGuards(PermissionsGuard)
export class CadastroRastreamentoController {
  constructor(private readonly service: CadastroRastreamentoService) {}

  @Get()
  @RequirePermissions('CADASTRO_RASTREAMENTO.LISTAR')
  @ApiOperation({ summary: 'Lista ordens para cadastro de rastreamento' })
  findPendentes(@Query() query: FindPendentesQueryDto) {
    return this.service.findPendentes({
      ...query,
      page: query.page ? +query.page : undefined,
      limit: query.limit ? +query.limit : undefined,
      dataInicio: query.dataInicio,
      dataFim: query.dataFim,
    });
  }

  @Patch(':id/iniciar')
  @RequirePermissions('CADASTRO_RASTREAMENTO.EDITAR')
  @ApiOperation({
    summary: 'Inicia o cadastro de uma OS (AGUARDANDO → EM_CADASTRO)',
  })
  iniciarCadastro(@Param('id', ParseIntPipe) id: number) {
    return this.service.iniciarCadastro(id);
  }

  @Patch(':id/concluir')
  @RequirePermissions('CADASTRO_RASTREAMENTO.EDITAR')
  @ApiOperation({
    summary: 'Conclui o cadastro de uma OS (EM_CADASTRO → CONCLUIDO)',
  })
  concluirCadastro(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirCadastroDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.concluirCadastro(id, dto, userId);
  }
}
