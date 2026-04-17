import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateMarcaSimcardDto {
  @ApiPropertyOptional({ example: 'Getrak' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID da operadora' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operadoraId?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Se a marca possui planos',
  })
  @IsBoolean()
  @IsOptional()
  temPlanos?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiPropertyOptional({
    example: 19,
    description: 'Quantidade mínima de caracteres do ICCID para esta marca',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minCaracteresIccid?: number;
}
