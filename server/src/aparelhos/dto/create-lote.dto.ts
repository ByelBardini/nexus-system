import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoAparelho, ProprietarioTipo } from '@prisma/client';

export class CreateLoteDto {
  @ApiProperty({ example: 'LOT-2024-001' })
  @IsString()
  @IsNotEmpty()
  referencia: string;

  @ApiPropertyOptional({ example: 'NF-12345' })
  @IsOptional()
  @IsString()
  notaFiscal?: string | null;

  @ApiProperty({ example: '2024-03-01' })
  @IsDateString()
  dataChegada: string;

  @ApiProperty({ enum: ProprietarioTipo })
  @IsEnum(ProprietarioTipo)
  proprietarioTipo: ProprietarioTipo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  clienteId?: number | null;

  @ApiProperty({ enum: TipoAparelho })
  @IsEnum(TipoAparelho)
  tipo: TipoAparelho;

  @ApiPropertyOptional({ example: 'Suntech' })
  @IsOptional()
  @IsString()
  marca?: string | null;

  @ApiPropertyOptional({ example: 'ST-901' })
  @IsOptional()
  @IsString()
  modelo?: string | null;

  @ApiPropertyOptional({ example: 'Claro' })
  @IsOptional()
  @IsString()
  operadora?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  marcaSimcardId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  planoSimcardId?: number | null;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  quantidade: number;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  valorUnitario: number;

  @ApiPropertyOptional({ example: ['IMEI001', 'IMEI002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  identificadores?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tecnicoId?: number;

  @ApiPropertyOptional({ description: 'ID do débito a ser abatido' })
  @IsOptional()
  @IsNumber()
  abaterDebitoId?: number | null;

  @ApiPropertyOptional({ description: 'Quantidade a abater do débito' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  abaterQuantidade?: number | null;
}
