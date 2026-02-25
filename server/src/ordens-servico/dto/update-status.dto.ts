import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusOS } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: StatusOS })
  @IsEnum(StatusOS)
  status: StatusOS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}
