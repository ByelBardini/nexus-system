import { Body, Controller, Get, Header, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { OrdensServicoService } from './ordens-servico.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateIdAparelhoDto } from './dto/update-id-aparelho.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
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

  @Get('cliente-infinity')
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Retorna o ID do cliente Infinity (empresa dona do sistema, hardcoded)' })
  async getClienteInfinity() {
    const clienteId = await this.service.getClienteInfinityOuCriar();
    return { clienteId };
  }

  @Get('testando')
  @RequirePermissions('AGENDAMENTO.TESTES.LISTAR', 'AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Listar OS em testes (status EM_TESTES) com tempo em testes' })
  findTestando(@Query('search') search?: string) {
    return this.service.findTestando(search);
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

  @Get(':id/impressao')
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Retorna HTML da ordem de serviço para impressão/salvar PDF' })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getHtmlImpressao(@Param('id') id: string) {
    return this.service.gerarHtmlImpressao(+id);
  }

  @Get(':id/pdf')
  @RequirePermissions('AGENDAMENTO.OS.LISTAR')
  @ApiOperation({ summary: 'Baixar PDF da ordem de serviço' })
  async getPdf(@Param('id') id: string) {
    const { buffer, numero } = await this.service.gerarPdf(+id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="ordem-servico-${numero}.pdf"`,
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
  create(@Body() dto: CreateOrdemServicoDto, @CurrentUser('id') criadoPorId?: number) {
    return this.service.create(dto, criadoPorId);
  }

  @Patch(':id')
  @RequirePermissions('AGENDAMENTO.OS.EDITAR')
  @ApiOperation({ summary: 'Atualizar ordem de serviço (idEntrada, aparelhoEncontrado)' })
  update(@Param('id') id: string, @Body() dto: UpdateOrdemServicoDto) {
    return this.service.update(+id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('AGENDAMENTO.OS.EDITAR')
  @ApiOperation({ summary: 'Atualizar status da ordem de serviço' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(+id, dto);
  }

  @Patch(':id/aparelho')
  @RequirePermissions('AGENDAMENTO.TESTES.EXECUTAR', 'AGENDAMENTO.OS.EDITAR')
  @ApiOperation({ summary: 'Vincular aparelho (IMEI) à ordem de serviço' })
  updateIdAparelho(@Param('id') id: string, @Body() dto: UpdateIdAparelhoDto) {
    return this.service.updateIdAparelho(+id, dto.idAparelho.trim());
  }
}
