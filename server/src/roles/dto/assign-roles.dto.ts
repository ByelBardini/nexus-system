import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({ type: [Number], example: [1, 2] })
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];
}
