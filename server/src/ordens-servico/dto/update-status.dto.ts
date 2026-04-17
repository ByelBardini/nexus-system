import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { StatusOS } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: StatusOS })
  @IsEnum(StatusOS)
  status: StatusOS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({
    description:
      'Novo local de instalação (ao finalizar teste com Comunicando)',
  })
  @IsOptional()
  @IsString()
  localInstalacao?: string;

  @ApiPropertyOptional({
    description: 'Pós-chave: SIM ou NAO (ao finalizar teste com Comunicando)',
    enum: ['SIM', 'NAO'],
  })
  @IsOptional()
  @IsIn(['SIM', 'NAO'])
  posChave?: 'SIM' | 'NAO';
}
