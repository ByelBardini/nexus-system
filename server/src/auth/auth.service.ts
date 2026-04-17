import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PRAZO_EXPIRACAO_SENHA_MESES } from '../common/constants';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const valid = await bcrypt.compare(password, user.senhaHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.usersService.updateLastLogin(user.id);

    const permissions = this.usersService.getPermissions(user);
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const exigeTrocaSenha =
      !user.senhaExpiradaEm || new Date(user.senhaExpiradaEm) <= new Date();

    return {
      accessToken,
      user: { id: user.id, nome: user.nome, email: user.email },
      permissions,
      exigeTrocaSenha,
    };
  }

  async trocarSenha(userId: number, senhaAtual: string, novaSenha: string) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const valid = await bcrypt.compare(senhaAtual, user.senhaHash);
    if (!valid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const dataExpiracao = new Date();
    dataExpiracao.setMonth(
      dataExpiracao.getMonth() + PRAZO_EXPIRACAO_SENHA_MESES,
    );

    await this.usersService.updatePassword(user.id, senhaHash, dataExpiracao);
    return { message: 'Senha alterada com sucesso' };
  }

  async validateUser(userId: number) {
    return this.usersService.findById(userId);
  }
}
