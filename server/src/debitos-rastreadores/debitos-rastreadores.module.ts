import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { DebitosRastreadoresController } from './debitos-rastreadores.controller';
import { DebitosRastreadoresService } from './debitos-rastreadores.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [DebitosRastreadoresController],
  providers: [DebitosRastreadoresService],
  exports: [DebitosRastreadoresService],
})
export class DebitosRastreadoresModule {}
