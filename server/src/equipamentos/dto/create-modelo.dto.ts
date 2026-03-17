import { IsString, IsNotEmpty, IsInt, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateModeloDto {
  @ApiProperty({ example: 'ST310UC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  marcaId: number;

  @ApiPropertyOptional({ example: 15, description: 'Quantidade mínima de caracteres do IMEI para este modelo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minCaracteresImei?: number;
}
