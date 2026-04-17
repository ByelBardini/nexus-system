import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 4 })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    enum: ['AGENDAMENTO', 'CONFIGURACAO', 'ADMINISTRATIVO'],
  })
  @IsOptional()
  @IsEnum(['AGENDAMENTO', 'CONFIGURACAO', 'ADMINISTRATIVO'])
  setor?: string | null;
}
