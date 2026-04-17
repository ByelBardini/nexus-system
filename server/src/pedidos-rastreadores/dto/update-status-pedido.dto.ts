import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { StatusPedidoRastreador } from '@prisma/client';

export class UpdateStatusPedidoDto {
  @ApiProperty({ enum: StatusPedidoRastreador })
  @IsEnum(StatusPedidoRastreador)
  status: StatusPedidoRastreador;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({
    description:
      'IDs dos kits vinculados ao pedido (para atualizar rastreadores)',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  kitIds?: number[];

  @ApiPropertyOptional({
    description:
      'ID do cliente/empresa para vincular aos rastreadores (quando destino é técnico)',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  deClienteId?: number;
}
