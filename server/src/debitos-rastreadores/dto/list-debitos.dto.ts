import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ProprietarioTipo } from '@prisma/client';

export class ListDebitosDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 500, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: ProprietarioTipo })
  @IsOptional()
  @IsEnum(ProprietarioTipo)
  devedorTipo?: ProprietarioTipo;

  @ApiPropertyOptional({ enum: ProprietarioTipo })
  @IsOptional()
  @IsEnum(ProprietarioTipo)
  credorTipo?: ProprietarioTipo;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  devedorClienteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  credorClienteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marcaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modeloId?: number;

  @ApiPropertyOptional({ enum: ['aberto', 'quitado'] })
  @IsOptional()
  @IsString()
  @IsIn(['aberto', 'quitado'])
  status?: 'aberto' | 'quitado';

  @ApiPropertyOptional({
    description:
      'Quando true, inclui histórico completo de cada débito (mais pesado). Padrão: false.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  incluirHistoricos?: boolean;
}
