import { ApiPropertyOptional } from '@nestjs/swagger';
import { SetorUsuario } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ enum: SetorUsuario, enumName: 'SetorUsuario' })
  @IsOptional()
  @IsEnum(SetorUsuario)
  setor?: SetorUsuario | null;
}
