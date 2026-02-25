import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { StatusOS, TipoOS } from '@prisma/client';

export class CreateOrdemServicoDto {
  @ApiProperty({ enum: TipoOS })
  @IsEnum(TipoOS)
  tipo: TipoOS;

  @ApiPropertyOptional({ enum: StatusOS, default: StatusOS.AGENDADO })
  @IsOptional()
  @IsEnum(StatusOS)
  status?: StatusOS;

  @ApiProperty()
  @IsInt()
  @Min(1)
  clienteId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  subclienteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  veiculoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  tecnicoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
