import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParDto } from './pareamento-preview.dto';

export class RastreadorManualDto {
  @ApiProperty({ example: 'Suntech' })
  @IsString()
  marca: string;

  @ApiProperty({ example: 'ST-901' })
  @IsString()
  modelo: string;
}

export class SimManualDto {
  @ApiPropertyOptional({ example: 'Claro' })
  @IsOptional()
  @IsString()
  operadora?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  marcaSimcardId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  planoSimcardId?: number;
}

export class PareamentoDto {
  @ApiProperty({ type: [ParDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParDto)
  pares: ParDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  loteRastreadorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  loteSimId?: number;

  @ApiPropertyOptional({ type: RastreadorManualDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RastreadorManualDto)
  rastreadorManual?: RastreadorManualDto;

  @ApiPropertyOptional({ type: SimManualDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SimManualDto)
  simManual?: SimManualDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  kitId?: number;

  @ApiPropertyOptional({ example: 'Kit X' })
  @IsOptional()
  @IsString()
  kitNome?: string;
}
