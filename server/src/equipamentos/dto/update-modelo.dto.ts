import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateModeloDto {
  @ApiPropertyOptional({ example: 'ST310UC' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiPropertyOptional({
    example: 15,
    description: 'Quantidade exata de caracteres do IMEI para este modelo',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantidadeCaracteresImei?: number;
}
