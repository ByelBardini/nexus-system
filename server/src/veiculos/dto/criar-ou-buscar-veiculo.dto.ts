import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CriarOuBuscarVeiculoDto {
  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @MinLength(7, { message: 'Placa deve ter 7 caracteres' })
  placa: string;

  @ApiProperty({ example: 'Fiat' })
  @IsString()
  marca: string;

  @ApiProperty({ example: 'Uno' })
  @IsString()
  modelo: string;

  @ApiPropertyOptional({ example: '2020' })
  @IsOptional()
  @IsString()
  ano?: string;

  @ApiPropertyOptional({ example: 'Branco' })
  @IsOptional()
  @IsString()
  cor?: string;
}
