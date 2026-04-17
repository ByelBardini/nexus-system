import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoDestinoPedido, UrgenciaPedido } from '@prisma/client';
import { CreatePedidoRastreadorItemDto } from './create-pedido-rastreador-item.dto';

@ValidatorConstraint({ name: 'DestinatarioCliente', async: false })
class DestinatarioClienteConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const dto = args.object as CreatePedidoRastreadorDto;
    if (dto.tipoDestino !== TipoDestinoPedido.CLIENTE) return true;
    return !!(dto.clienteId || dto.subclienteId);
  }
  defaultMessage() {
    return 'Selecione o cliente ou subcliente destinatário';
  }
}

export class CreatePedidoRastreadorDto {
  @ApiProperty({ enum: TipoDestinoPedido })
  @IsEnum(TipoDestinoPedido)
  tipoDestino: TipoDestinoPedido;

  @ApiPropertyOptional({
    description: 'ID do técnico quando tipoDestino = TECNICO',
  })
  @ValidateIf((o) => o.tipoDestino === 'TECNICO')
  @IsInt()
  @Min(1)
  tecnicoId?: number;

  @ApiPropertyOptional({
    description:
      'ID do cliente (associação) quando tipoDestino = CLIENTE e sem subcliente',
  })
  @ValidateIf((o) => o.tipoDestino === 'CLIENTE')
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number;

  @ApiPropertyOptional({
    description: 'ID do subcliente (beneficiário) quando tipoDestino = CLIENTE',
  })
  @ValidateIf((o) => o.tipoDestino === 'CLIENTE')
  @IsOptional()
  @IsInt()
  @Min(1)
  subclienteId?: number;

  @Validate(DestinatarioClienteConstraint)
  _destinatarioCliente?: void;

  @ApiProperty({
    example: '2025-03-03',
    description: 'Data do pedido (ISO 8601), default: hoje',
  })
  @IsOptional()
  @IsDateString()
  dataSolicitacao?: string;

  @ApiPropertyOptional({ description: 'ID da marca do equipamento desejado' })
  @IsOptional()
  @IsInt()
  @Min(1)
  marcaEquipamentoId?: number;

  @ApiPropertyOptional({ description: 'ID do modelo do equipamento desejado' })
  @IsOptional()
  @IsInt()
  @Min(1)
  modeloEquipamentoId?: number;

  @ApiPropertyOptional({
    description:
      'ID da operadora desejada (quando destino é técnico ou cliente)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  operadoraId?: number;

  @ApiPropertyOptional({
    description:
      'ID do cliente remetente (quando destino é TECNICO - cliente enviando para o técnico)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  deClienteId?: number;

  @ApiProperty({
    example: 10,
    description:
      'Obrigatório para TECNICO/CLIENTE; omitido para MISTO (calculado como soma dos itens)',
  })
  @ValidateIf((o) => o.tipoDestino !== 'MISTO')
  @IsInt()
  @Min(1)
  quantidade?: number;

  @ApiPropertyOptional({
    type: [CreatePedidoRastreadorItemDto],
    description: 'Itens obrigatórios quando tipoDestino = MISTO',
  })
  @ValidateIf((o) => o.tipoDestino === 'MISTO')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoRastreadorItemDto)
  @ArrayMinSize(1)
  itens?: CreatePedidoRastreadorItemDto[];

  @ApiPropertyOptional({ enum: UrgenciaPedido, default: UrgenciaPedido.MEDIA })
  @IsOptional()
  @IsEnum(UrgenciaPedido)
  urgencia?: UrgenciaPedido;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}
