import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOperadoraDto {
  @ApiPropertyOptional({ example: 'Vivo' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
