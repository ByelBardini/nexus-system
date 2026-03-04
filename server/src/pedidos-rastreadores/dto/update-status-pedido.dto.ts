import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusPedidoRastreador } from '@prisma/client';

export class UpdateStatusPedidoDto {
  @ApiProperty({ enum: StatusPedidoRastreador })
  @IsEnum(StatusPedidoRastreador)
  status: StatusPedidoRastreador;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}
