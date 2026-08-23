import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';
import { ReportesService } from './reportes.service';
import { QueryReporteCarteraDto } from './dto/query-reporte-cartera.dto';
import { QueryReporteMovimientosDto } from './dto/query-reporte-movimientos.dto';
import type { Response } from 'express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/enums.js';

@Controller('reportes')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('cartera')
  cartera(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryReporteCarteraDto,
  ) {
    return this.reportesService.cartera(user, query);
  }

  @Get('movimientos')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.USER,
  )
    movimientos(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryReporteMovimientosDto,
  ) {
    return this.reportesService.movimientos(user, query);
  }
  @Get('cartera/export')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.USER,
  )
async exportCartera(
  @CurrentUser() user: CurrentUserPayload,
  @Query() query: QueryReporteCarteraDto,
  @Res() res: Response,
) {
  const buffer = await this.reportesService.exportCarteraExcel(user, query);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="reporte-cartera.xlsx"',
  );

  return res.send(buffer);
}

@Get('movimientos/export')
@Roles(
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.USER,
)
async exportMovimientos(
  @CurrentUser() user: CurrentUserPayload,
  @Query() query: QueryReporteMovimientosDto,
  @Res() res: Response,
) {
  const buffer = await this.reportesService.exportMovimientosExcel(user, query);

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename="reporte-movimientos.xlsx"',
    );

    return res.send(buffer);
    }
}