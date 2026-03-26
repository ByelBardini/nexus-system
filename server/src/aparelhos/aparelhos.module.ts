import { Module } from '@nestjs/common';
import { AparelhosController } from './aparelhos.controller';
import { AparelhosService } from './aparelhos.service';
import { LotesService } from './lotes.service';
import { KitsService } from './kits.service';
import { PareamentoService } from './pareamento.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { DebitosRastreadoresModule } from '../debitos-rastreadores/debitos-rastreadores.module';

@Module({
  imports: [PrismaModule, UsersModule, DebitosRastreadoresModule],
  controllers: [AparelhosController],
  providers: [AparelhosService, LotesService, KitsService, PareamentoService],
})
export class AparelhosModule {}
