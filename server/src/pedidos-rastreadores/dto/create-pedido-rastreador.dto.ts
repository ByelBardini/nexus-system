import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TipoDestinoPedido, UrgenciaPedido } from '@prisma/client';

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

  @ApiPropertyOptional({ description: 'ID do técnico quando tipoDestino = TECNICO' })
  @ValidateIf((o) => o.tipoDestino === 'TECNICO')
  @IsInt()
  @Min(1)
  tecnicoId?: number;

  @ApiPropertyOptional({ description: 'ID do cliente (associação) quando tipoDestino = CLIENTE e sem subcliente' })
  @ValidateIf((o) => o.tipoDestino === 'CLIENTE')
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number;

  @ApiPropertyOptional({ description: 'ID do subcliente (beneficiário) quando tipoDestino = CLIENTE' })
  @ValidateIf((o) => o.tipoDestino === 'CLIENTE')
  @IsOptional()
  @IsInt()
  @Min(1)
  subclienteId?: number;

  @Validate(DestinatarioClienteConstraint)
  _destinatarioCliente?: void;

  @ApiProperty({ example: '2025-03-03', description: 'Data do pedido (ISO 8601), default: hoje' })
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

  @ApiPropertyOptional({ description: 'ID da operadora desejada (quando destino é técnico ou cliente)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  operadoraId?: number;

  @ApiPropertyOptional({ description: 'ID do cliente remetente (quando destino é TECNICO - cliente enviando para o técnico)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  deClienteId?: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional({ enum: UrgenciaPedido, default: UrgenciaPedido.MEDIA })
  @IsOptional()
  @IsEnum(UrgenciaPedido)
  urgencia?: UrgenciaPedido;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}
