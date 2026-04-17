import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ListDebitosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  devedorClienteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  credorClienteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marcaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modeloId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['aberto', 'quitado'])
  status?: 'aberto' | 'quitado';
}
