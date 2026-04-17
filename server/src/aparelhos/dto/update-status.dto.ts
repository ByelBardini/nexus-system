import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusAparelho } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: StatusAparelho })
  @IsEnum(StatusAparelho)
  status: StatusAparelho;

  @ApiPropertyOptional({ example: 'Instalado em veículo' })
  @IsOptional()
  @IsString()
  observacao?: string;
}
