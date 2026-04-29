import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const TIPOS_DESPACHO = ['TRANSPORTADORA', 'CORREIOS', 'EM_MAOS'] as const;

export class UpdateDespachoPedidoDto {
  @IsOptional()
  @IsString()
  @IsIn(TIPOS_DESPACHO)
  tipoDespacho?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  transportadora?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroNf?: string;
}
