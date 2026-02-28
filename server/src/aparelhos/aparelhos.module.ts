import { Module } from '@nestjs/common';
import { AparelhosController } from './aparelhos.controller';
import { AparelhosService } from './aparelhos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [AparelhosController],
  providers: [AparelhosService],
})
export class AparelhosModule {}
