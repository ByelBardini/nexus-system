import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum TipoContrato {
  COMODATO = 'COMODATO',
  AQUISICAO = 'AQUISICAO',
}

export enum StatusCliente {
  ATIVO = 'ATIVO',
  PENDENTE = 'PENDENTE',
  INATIVO = 'INATIVO',
}

export class ContatoDto {
  @ApiProperty({ example: 'Carlos Alberto' })
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

export class CreateClienteDto {
  @ApiProperty({ example: 'Empresa ABC Ltda' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiPropertyOptional({ example: 'Empresa ABC' })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ enum: TipoContrato, default: TipoContrato.COMODATO })
  @IsOptional()
  @IsEnum(TipoContrato)
  tipoContrato?: TipoContrato;

  @ApiPropertyOptional({ enum: StatusCliente, default: StatusCliente.ATIVO })
  @IsOptional()
  @IsEnum(StatusCliente)
  status?: StatusCliente;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista' })
  @IsOptional()
  @IsString()
  logradouro?: string;

  @ApiPropertyOptional({ example: '1000' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ example: 'Sala 101' })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiPropertyOptional({ example: 'Bela Vista' })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  cor?: string;

  @ApiPropertyOptional({ type: [ContatoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContatoDto)
  contatos?: ContatoDto[];
}
