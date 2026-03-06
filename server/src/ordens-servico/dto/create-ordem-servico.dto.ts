import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatusOS, TipoOS } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSubclienteDto {
  @ApiProperty({ description: 'Nome do subcliente' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nome: string;

  @ApiProperty({ description: 'CEP' })
  @IsString()
  @MinLength(8)
  cep: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  cidade: string;

  @ApiProperty({ description: 'UF (2 caracteres)' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  estado: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional({ description: 'Tipo de cobrança (ex: INFINITY, CLIENTE)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cobrancaTipo?: string;
}

export class CreateOrdemServicoDto {
  @ApiProperty({ enum: TipoOS })
  @IsEnum(TipoOS)
  tipo: TipoOS;

  @ApiPropertyOptional({ enum: StatusOS, default: StatusOS.AGENDADO })
  @IsOptional()
  @IsEnum(StatusOS)
  status?: StatusOS;

  @ApiProperty()
  @IsInt()
  @Min(1)
  clienteId: number;

  @ApiPropertyOptional({ description: 'ID do subcliente existente' })
  @IsOptional()
  @IsInt()
  @Min(1)
  subclienteId?: number;

  @ApiPropertyOptional({
    description: 'Dados para criar novo subcliente (mutuamente exclusivo com subclienteId)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSubclienteDto)
  subclienteCreate?: CreateSubclienteDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  veiculoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  tecnicoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
