import { Module } from '@nestjs/common';
import { PedidosRastreadoresController } from './pedidos-rastreadores.controller';
import { PedidosRastreadoresService } from './pedidos-rastreadores.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { DebitosRastreadoresModule } from '../debitos-rastreadores/debitos-rastreadores.module';

@Module({
  imports: [PrismaModule, UsersModule, DebitosRastreadoresModule],
  controllers: [PedidosRastreadoresController],
  providers: [PedidosRastreadoresService],
})
export class PedidosRastreadoresModule {}
