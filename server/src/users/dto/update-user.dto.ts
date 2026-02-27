import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ enum: ['AGENDAMENTO', 'CONFIGURACAO', 'ADMINISTRATIVO'] })
  @IsOptional()
  @IsEnum(['AGENDAMENTO', 'CONFIGURACAO', 'ADMINISTRATIVO'])
  setor?: string | null;
}
