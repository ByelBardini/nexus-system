import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePlanoSimcardDto {
  @ApiProperty({ example: 1, description: 'ID da marca de simcard' })
  @IsInt()
  @Type(() => Number)
  marcaSimcardId: number;

  @ApiProperty({ example: 500, description: 'Plano em MB' })
  @IsInt()
  @Type(() => Number)
  planoMb: number;
}
