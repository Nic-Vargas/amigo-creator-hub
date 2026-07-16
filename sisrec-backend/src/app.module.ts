import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ImportsModule } from './imports/imports.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { RecobrosModule } from './recobros/recobros.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ImportsModule,
    UsersModule,
    AuthModule,
    BeneficiariesModule,
    RecobrosModule,
    MovimientosModule,
    DashboardModule,
    ReportesModule,
  ],
})
export class AppModule {}