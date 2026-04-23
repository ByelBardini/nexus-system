import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

/** `PermissionsGuard` injeta `UsersService`; o módulo de usuários deve ser importado aqui. */
@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
