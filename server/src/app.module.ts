import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ClientesModule } from './clientes/clientes.module';
import { TecnicosModule } from './tecnicos/tecnicos.module';
import { VeiculosModule } from './veiculos/veiculos.module';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';
import { AparelhosModule } from './aparelhos/aparelhos.module';
import { EquipamentosModule } from './equipamentos/equipamentos.module';
import { PedidosRastreadoresModule } from './pedidos-rastreadores/pedidos-rastreadores.module';
import { DebitosRastreadoresModule } from './debitos-rastreadores/debitos-rastreadores.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 100 },
      { name: 'medium', ttl: 300000, limit: 300 },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false, // desabilita log de cada requisição HTTP
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ClientesModule,
    TecnicosModule,
    VeiculosModule,
    OrdensServicoModule,
    AparelhosModule,
    EquipamentosModule,
    PedidosRastreadoresModule,
    DebitosRastreadoresModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
