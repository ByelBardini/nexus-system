import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

/** Regex: mínimo 8 caracteres, pelo menos 1 número e 1 caractere especial */
const SENHA_FORTE_REGEX =
  /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export class TrocarSenhaDto {
  @ApiProperty({ description: 'Senha atual do usuário' })
  @IsString()
  @MinLength(1, { message: 'Senha atual obrigatória' })
  senhaAtual: string;

  @ApiProperty({
    description:
      'Nova senha (mínimo 8 caracteres, 1 número e 1 caractere especial)',
    minLength: 8,
    example: 'MinhaSenh@123',
  })
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @Matches(SENHA_FORTE_REGEX, {
    message:
      'A senha deve conter pelo menos um número e um caractere especial (!@#$%^&* etc.)',
  })
  novaSenha: string;
}
