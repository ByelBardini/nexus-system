import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TecnicosService } from './tecnicos.service';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { UpdateTecnicoDto } from './dto/update-tecnico.dto';

@ApiTags('tecnicos')
@ApiBearerAuth()
@Controller('tecnicos')
@UseGuards(PermissionsGuard)
export class TecnicosController {
  constructor(private readonly tecnicosService: TecnicosService) {}

  @Get()
  @RequirePermissions('AGENDAMENTO.TECNICO.LISTAR')
  @ApiOperation({ summary: 'Listar técnicos' })
  findAll() {
    return this.tecnicosService.findAll();
  }

  @Get(':id')
  @RequirePermissions('AGENDAMENTO.TECNICO.LISTAR')
  @ApiOperation({ summary: 'Buscar técnico por ID' })
  findOne(@Param('id') id: string) {
    return this.tecnicosService.findOne(+id);
  }

  @Post()
  @RequirePermissions('AGENDAMENTO.TECNICO.CRIAR')
  @ApiOperation({ summary: 'Criar técnico' })
  create(@Body() dto: CreateTecnicoDto) {
    return this.tecnicosService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('AGENDAMENTO.TECNICO.EDITAR')
  @ApiOperation({ summary: 'Atualizar técnico' })
  update(@Param('id') id: string, @Body() dto: UpdateTecnicoDto) {
    return this.tecnicosService.update(+id, dto);
  }
}
