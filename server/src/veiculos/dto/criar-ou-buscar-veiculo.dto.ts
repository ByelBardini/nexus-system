import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CriarOuBuscarVeiculoDto {
  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @MinLength(7, { message: 'Placa deve ter 7 caracteres' })
  placa: string;

  @ApiProperty({ example: 'Fiat' })
  @IsString()
  @MinLength(1, { message: 'Marca é obrigatória' })
  marca: string;

  @ApiProperty({ example: 'Uno' })
  @IsString()
  @MinLength(1, { message: 'Modelo é obrigatório' })
  modelo: string;

  @ApiProperty({ example: '2020' })
  @IsString()
  @MinLength(1, { message: 'Ano é obrigatório' })
  ano: string;

  @ApiProperty({ example: 'Branco' })
  @IsString()
  @MinLength(1, { message: 'Cor é obrigatória' })
  cor: string;
}
