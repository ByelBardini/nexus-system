import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ParDto {
  @ApiProperty({ example: '123456789012345' })
  @IsString()
  imei: string;

  @ApiProperty({ example: '123456789012345678901' })
  @IsString()
  iccid: string;
}

export class PareamentoPreviewDto {
  @ApiProperty({ type: [ParDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParDto)
  pares?: ParDto[];
}
