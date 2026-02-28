import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOperadoraDto {
  @ApiProperty({ example: 'Vivo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;
}
