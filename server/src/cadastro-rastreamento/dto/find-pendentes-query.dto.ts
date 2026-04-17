import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusCadastro, Plataforma } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindPendentesQueryDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: StatusCadastro })
  @IsOptional()
  @IsEnum(StatusCadastro)
  statusCadastro?: StatusCadastro;

  @ApiPropertyOptional({ enum: Plataforma })
  @IsOptional()
  @IsEnum(Plataforma)
  plataforma?: Plataforma;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;
}
