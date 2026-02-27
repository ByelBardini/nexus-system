import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PrecosDto {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  instalacaoComBloqueio?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  instalacaoSemBloqueio?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  revisao?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  retirada?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deslocamento?: number;
}

export class CreateTecnicoDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Cidade de atuação' })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({ description: 'Estado de atuação (UF)' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'CEP do endereço de entrega' })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiPropertyOptional({ description: 'Logradouro do endereço de entrega' })
  @IsOptional()
  @IsString()
  logradouro?: string;

  @ApiPropertyOptional({ description: 'Número do endereço de entrega' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ description: 'Complemento do endereço de entrega' })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiPropertyOptional({ description: 'Bairro do endereço de entrega' })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional({ description: 'Cidade do endereço de entrega' })
  @IsOptional()
  @IsString()
  cidadeEndereco?: string;

  @ApiPropertyOptional({ description: 'Estado do endereço de entrega (UF)' })
  @IsOptional()
  @IsString()
  estadoEndereco?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PrecosDto)
  precos?: PrecosDto;
}
