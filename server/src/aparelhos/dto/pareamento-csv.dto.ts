import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProprietarioTipo } from '@prisma/client';

export class PareamentoCsvLinhaDto {
  @ApiProperty({ example: '358942109982341' })
  @IsString()
  imei: string;

  @ApiProperty({ example: '8955101234567890123' })
  @IsString()
  iccid: string;

  @ApiPropertyOptional({ example: 'Suntech' })
  @IsOptional()
  @IsString()
  marcaRastreador?: string;

  @ApiPropertyOptional({ example: 'ST-901' })
  @IsOptional()
  @IsString()
  modeloRastreador?: string;

  @ApiPropertyOptional({ example: 'Claro' })
  @IsOptional()
  @IsString()
  operadora?: string;

  @ApiPropertyOptional({ example: 'Claro SIMCard' })
  @IsOptional()
  @IsString()
  marcaSimcard?: string;

  @ApiPropertyOptional({
    description: 'Plano em MB (ex: "10", "10MB") ou ID numérico',
    example: '10MB',
  })
  @IsOptional()
  @IsString()
  plano?: string;

  @ApiPropertyOptional({
    description: 'Referência ou ID do lote de rastreador',
    example: 'LOTE-RAST-001',
  })
  @IsOptional()
  @IsString()
  loteRastreador?: string;

  @ApiPropertyOptional({
    description: 'Referência ou ID do lote de SIMs',
    example: 'LOTE-SIM-001',
  })
  @IsOptional()
  @IsString()
  loteSimcard?: string;
}

export class PareamentoCsvDto {
  @ApiProperty({ type: [PareamentoCsvLinhaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PareamentoCsvLinhaDto)
  linhas: PareamentoCsvLinhaDto[];

  @ApiPropertyOptional({ enum: ProprietarioTipo, default: 'INFINITY' })
  @IsOptional()
  @IsEnum(ProprietarioTipo)
  proprietario?: ProprietarioTipo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tecnicoId?: number;
}
