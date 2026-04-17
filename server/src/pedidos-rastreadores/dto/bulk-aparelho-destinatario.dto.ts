import { IsArray, IsEnum, IsInt, IsOptional } from 'class-validator';
import { ProprietarioTipo } from '@prisma/client';

export class BulkAparelhoDestinatarioDto {
  @IsArray()
  @IsInt({ each: true })
  aparelhoIds: number[];

  @IsEnum(ProprietarioTipo)
  destinatarioProprietario: ProprietarioTipo;

  @IsOptional()
  @IsInt()
  destinatarioClienteId?: number;
}
