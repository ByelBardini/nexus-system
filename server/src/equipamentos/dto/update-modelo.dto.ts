import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModeloDto {
  @ApiPropertyOptional({ example: 'ST310UC' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
