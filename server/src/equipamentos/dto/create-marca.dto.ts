import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMarcaDto {
  @ApiProperty({ example: 'Suntech' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;
}
