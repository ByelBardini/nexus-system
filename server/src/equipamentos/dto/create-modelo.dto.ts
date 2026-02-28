import { IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModeloDto {
  @ApiProperty({ example: 'ST310UC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  marcaId: number;
}
