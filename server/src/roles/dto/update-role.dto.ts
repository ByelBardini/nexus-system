import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoriaCargo } from '@prisma/client';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Técnico de Campo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ example: 'Técnico responsável por instalações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @ApiPropertyOptional({ enum: CategoriaCargo })
  @IsOptional()
  @IsEnum(CategoriaCargo)
  categoria?: CategoriaCargo;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
