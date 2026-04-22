import { Module } from '@nestjs/common';
import { CadastroRastreamentoController } from './cadastro-rastreamento.controller';
import { CadastroRastreamentoService } from './cadastro-rastreamento.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

/** `PermissionsGuard` injeta `UsersService`; o módulo de usuários deve ser importado aqui. */
@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CadastroRastreamentoController],
  providers: [CadastroRastreamentoService],
})
export class CadastroRastreamentoModule {}
