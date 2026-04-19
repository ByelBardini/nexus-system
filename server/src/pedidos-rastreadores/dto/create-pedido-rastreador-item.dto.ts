import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { ProprietarioTipo } from '@prisma/client';

export class CreatePedidoRastreadorItemDto {
  @ApiProperty({ enum: ProprietarioTipo })
  @IsEnum(ProprietarioTipo)
  proprietario: ProprietarioTipo;

  @ApiPropertyOptional({
    description: 'ID do cliente destino quando proprietario = CLIENTE',
  })
  @ValidateIf(
    (o: CreatePedidoRastreadorItemDto) =>
      o.proprietario === ProprietarioTipo.CLIENTE,
  )
  @IsInt()
  @Min(1)
  clienteId?: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional({
    description: 'ID da marca do equipamento desejado para este item',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  marcaEquipamentoId?: number;

  @ApiPropertyOptional({
    description: 'ID do modelo do equipamento desejado para este item',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  modeloEquipamentoId?: number;

  @ApiPropertyOptional({
    description: 'ID da operadora desejada para este item',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  operadoraId?: number;
}
