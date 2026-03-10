import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKitDto {
  @ApiProperty({ example: 'Kit Sundech Claro' })
  @IsString()
  @IsNotEmpty()
  nome: string;
}
