import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/enums.js';

@ApiTags('Dashboard')
@ApiBearerAuth()

@Controller('dashboard')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.USER,
  )
  getKpis(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getKpis(user);
  }

  @Get('resumen')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.USER,
  )
  getResumen(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getResumen(user);
  }
}