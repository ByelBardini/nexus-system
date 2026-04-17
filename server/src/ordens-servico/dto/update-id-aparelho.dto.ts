import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateIdAparelhoDto {
  @ApiProperty({
    description: 'Identificador do aparelho (IMEI, ICCID, Serial)',
  })
  @IsString()
  @MaxLength(50)
  idAparelho: string;
}
