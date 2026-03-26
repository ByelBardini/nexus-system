import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoAparelho } from '@prisma/client';

const PROPRIETARIO_VALORES = ['INFINITY', 'CLIENTE'] as const;

const ORIGEM_VALORES = ['RETIRADA_CLIENTE', 'DEVOLUCAO_TECNICO', 'COMPRA_AVULSA'] as const;
const STATUS_ENTRADA_VALORES = ['NOVO_OK', 'EM_MANUTENCAO', 'CANCELADO_DEFEITO'] as const;

export class CreateIndividualDto {
  @ApiProperty({ example: 'IMEI123456789012' })
  @IsString()
  @IsNotEmpty()
  identificador: string;

  @ApiProperty({ enum: TipoAparelho })
  @IsEnum(TipoAparelho)
  tipo: TipoAparelho;

  @ApiPropertyOptional({ example: 'Suntech' })
  @IsOptional()
  @IsString()
  marca?: string | null;

  @ApiPropertyOptional({ example: 'ST-901' })
  @IsOptional()
  @IsString()
  modelo?: string | null;

  @ApiPropertyOptional({ example: 'Claro' })
  @IsOptional()
  @IsString()
  operadora?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  marcaSimcardId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  planoSimcardId?: number | null;

  @ApiProperty({ enum: ORIGEM_VALORES })
  @IsIn(ORIGEM_VALORES)
  origem: (typeof ORIGEM_VALORES)[number];

  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  responsavelEntrega?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tecnicoId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string | null;

  @ApiPropertyOptional({ enum: PROPRIETARIO_VALORES })
  @IsOptional()
  @IsIn(PROPRIETARIO_VALORES)
  proprietario?: (typeof PROPRIETARIO_VALORES)[number] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  clienteId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notaFiscal?: string | null;

  @ApiProperty({ enum: STATUS_ENTRADA_VALORES })
  @IsIn(STATUS_ENTRADA_VALORES)
  statusEntrada: (typeof STATUS_ENTRADA_VALORES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoriaFalha?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinoDefeito?: string | null;

  @ApiPropertyOptional({ description: 'ID do débito a ser abatido (unidade vai para o credor)' })
  @IsOptional()
  @IsNumber()
  abaterDebitoId?: number | null;
}
