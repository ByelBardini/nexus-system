import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrdemServicoDto {
  @ApiPropertyOptional({
    description: 'ID do aparelho de entrada (instalado em REVISAO/INSTALACAO)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  idEntrada?: string;

  @ApiPropertyOptional({
    description: 'Aparelho encontrado na retirada (RETIRADA)',
  })
  @IsOptional()
  @IsBoolean()
  aparelhoEncontrado?: boolean;
}
