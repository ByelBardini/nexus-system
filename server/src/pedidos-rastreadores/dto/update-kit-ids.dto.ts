import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt } from 'class-validator';

export class UpdateKitIdsDto {
  @ApiProperty({ description: 'IDs dos kits a vincular ao pedido' })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  kitIds: number[];
}
