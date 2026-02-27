import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { StatusCliente, TipoContrato } from './create-cliente.dto';

export class UpdateContatoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({ example: 'Carlos Alberto' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiPropertyOptional({ example: 'carlos@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateClienteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ enum: TipoContrato })
  @IsOptional()
  @IsEnum(TipoContrato)
  tipoContrato?: TipoContrato;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estoqueProprio?: boolean;

  @ApiPropertyOptional({ enum: StatusCliente })
  @IsOptional()
  @IsEnum(StatusCliente)
  status?: StatusCliente;

  @ApiPropertyOptional({ type: [UpdateContatoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContatoDto)
  contatos?: UpdateContatoDto[];
}
