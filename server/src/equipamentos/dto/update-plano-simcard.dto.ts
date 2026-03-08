import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdatePlanoSimcardDto {
  @ApiPropertyOptional({ example: 500, description: 'Plano em MB' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  planoMb?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
