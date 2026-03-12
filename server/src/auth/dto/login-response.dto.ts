import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: number;
    nome: string;
    email: string;
  };

  @ApiProperty({ type: [String], example: ['CONFIG.USUARIO.LISTAR', 'CONFIG.USUARIO.CRIAR'] })
  permissions: string[];

  @ApiProperty({
    required: false,
    description: 'Quando true, o usuário deve trocar a senha no primeiro acesso ou por expiração',
  })
  exigeTrocaSenha?: boolean;
}
