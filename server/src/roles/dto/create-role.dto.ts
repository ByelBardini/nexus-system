import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoriaCargo } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({ example: 'Técnico de Campo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ example: 'TECNICO_CAMPO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  setorId: number;

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
