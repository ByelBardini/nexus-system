import { IsEnum } from 'class-validator';
import { Plataforma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ConcluirCadastroDto {
  @ApiProperty({ enum: Plataforma })
  @IsEnum(Plataforma)
  plataforma: Plataforma;
}
