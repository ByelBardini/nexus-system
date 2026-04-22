import { Module } from '@nestjs/common';
import { PedidosRastreadoresController } from './pedidos-rastreadores.controller';
import { PedidosRastreadoresService } from './pedidos-rastreadores.service';
import { PedidosRastreadoresProprietarioDebitoHelper } from './pedidos-rastreadores-proprietario-debito.helper';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { DebitosRastreadoresModule } from '../debitos-rastreadores/debitos-rastreadores.module';

@Module({
  imports: [PrismaModule, UsersModule, DebitosRastreadoresModule],
  controllers: [PedidosRastreadoresController],
  providers: [
    PedidosRastreadoresService,
    PedidosRastreadoresProprietarioDebitoHelper,
  ],
})
export class PedidosRastreadoresModule {}
