import { IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAparelhoKitDto {
  @ApiPropertyOptional({ description: 'ID do kit ou null para remover' })
  @IsOptional()
  @ValidateIf((o: UpdateAparelhoKitDto) => o.kitId != null)
  @IsNumber()
  kitId?: number | null;
}
