import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ContatoDto, CreateClienteDto } from './create-cliente.dto';

export class UpdateContatoDto extends ContatoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id?: number;
}

export class UpdateClienteDto extends PartialType(
  OmitType(CreateClienteDto, ['contatos'] as const),
) {
  @ApiPropertyOptional({ type: [UpdateContatoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContatoDto)
  contatos?: UpdateContatoDto[];
}
