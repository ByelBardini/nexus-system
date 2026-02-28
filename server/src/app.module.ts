import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
