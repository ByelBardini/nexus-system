import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMarcaSimcardDto {
  @ApiProperty({ example: 'Getrak' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ example: 1, description: 'ID da operadora à qual a marca está vinculada' })
  @IsInt()
  @Type(() => Number)
  operadoraId: number;

  @ApiPropertyOptional({ example: true, description: 'Se a marca possui planos cadastrados' })
  @IsBoolean()
  @IsOptional()
  temPlanos?: boolean;

  @ApiPropertyOptional({ example: 19, description: 'Quantidade mínima de caracteres do ICCID para esta marca' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minCaracteresIccid?: number;
}
