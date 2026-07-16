import { Injectable } from '@nestjs/common';
import { CaseStatus, MovementType } from '../generated/prisma/enums.js';
import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(user: CurrentUserPayload) {
    const [
      totalBeneficiaries,
      totalCases,
      totalMovements,
      totalMovementDetails,
      saldoBeneficiarios,
      saldoCasos,
      casesByStatus,
      movementsByType,
    ] = await Promise.all([
      this.prisma.beneficiary.count({
        where: {
          companyId: user.companyId,
        },
      }),

      this.prisma.recobroCase.count({
        where: {
          companyId: user.companyId,
        },
      }),

      // Cantidad de operaciones o filas visibles en Movimientos.
      this.prisma.movement.count({
        where: {
          companyId: user.companyId,
        },
      }),

      // Cantidad total de conceptos afectados dentro de las operaciones.
      this.prisma.movementDetail.count({
        where: {
          movement: {
            companyId: user.companyId,
          },
        },
      }),

      this.prisma.beneficiary.aggregate({
        where: {
          companyId: user.companyId,
        },
        _sum: {
          saldoTotal: true,
        },
      }),

      this.prisma.recobroCase.aggregate({
        where: {
          companyId: user.companyId,
        },
        _sum: {
          valorSalud: true,
          valorPension: true,
          valorCuotaMonetaria: true,
          valorTransferenciaEconomica: true,
          valorBonoAlimentacion: true,
          valorBeneficiosEconomicos488: true,
          valorTotal: true,
        },
      }),

      this.prisma.recobroCase.groupBy({
        by: ['estado'],
        where: {
          companyId: user.companyId,
        },
        _count: {
          estado: true,
        },
      }),

      // Tipo y valor ahora pertenecen a MovementDetail.
      this.prisma.movementDetail.groupBy({
        by: ['tipo'],
        where: {
          movement: {
            companyId: user.companyId,
          },
        },
        _count: {
          tipo: true,
        },
        _sum: {
          valor: true,
        },
      }),
    ]);

    return {
      totalBeneficiaries,
      totalCases,

      // Número de operaciones agrupadas.
      totalMovements,

      // Número de conceptos individuales procesados.
      totalMovementDetails,

      saldoTotalBeneficiarios:
        saldoBeneficiarios._sum.saldoTotal ?? 0,

      saldoTotalCasos:
        saldoCasos._sum.valorTotal ?? 0,

      saldosPorConcepto: {
        salud:
          saldoCasos._sum.valorSalud ?? 0,

        pension:
          saldoCasos._sum.valorPension ?? 0,

        cuotaMonetaria:
          saldoCasos._sum.valorCuotaMonetaria ?? 0,

        transferenciaEconomica:
          saldoCasos._sum.valorTransferenciaEconomica ?? 0,

        bonoAlimentacion:
          saldoCasos._sum.valorBonoAlimentacion ?? 0,

        beneficiosEconomicos488:
          saldoCasos._sum.valorBeneficiosEconomicos488 ?? 0,
      },

      casosPorEstado:
        this.normalizeCasesByStatus(casesByStatus),

      movimientosPorTipo:
        this.normalizeMovementsByType(movementsByType),
    };
  }

  async getResumen(user: CurrentUserPayload) {
    const [
      recentMovements,
      topBeneficiaries,
      casesByPriority,
    ] = await Promise.all([
      this.prisma.movement.findMany({
        where: {
          companyId: user.companyId,
        },
        include: {
          details: {
            orderBy: {
              createdAt: 'asc',
            },
          },

          beneficiary: true,

          recobroCase: true,

          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      this.prisma.beneficiary.findMany({
        where: {
          companyId: user.companyId,
        },
        orderBy: {
          saldoTotal: 'desc',
        },
        take: 10,
      }),

      this.prisma.recobroCase.groupBy({
        by: ['prioridad'],
        where: {
          companyId: user.companyId,
        },
        _count: {
          prioridad: true,
        },
        _sum: {
          valorTotal: true,
        },
      }),
    ]);

    return {
      movimientosRecientes: recentMovements,

      topBeneficiariosPorSaldo: topBeneficiaries,

      casosPorPrioridad: casesByPriority.map((item) => ({
        prioridad: item.prioridad,
        cantidad: item._count.prioridad,
        valorTotal: item._sum.valorTotal ?? 0,
      })),
    };
  }

  private normalizeCasesByStatus(
    rows: Array<{
      estado: CaseStatus;
      _count: {
        estado: number;
      };
    }>,
  ) {
    const result: Record<CaseStatus, number> = {
      [CaseStatus.ABIERTO]: 0,
      [CaseStatus.EN_GESTION]: 0,
      [CaseStatus.ACUERDO]: 0,
      [CaseStatus.EN_PAGO]: 0,
      [CaseStatus.CERRADO]: 0,
    };

    for (const row of rows) {
      result[row.estado] = row._count.estado;
    }

    return result;
  }

  private normalizeMovementsByType(
    rows: Array<{
      tipo: MovementType;
      _count: {
        tipo: number;
      };
      _sum: {
        valor: unknown;
      };
    }>,
  ) {
    const result: Record<
      MovementType,
      {
        cantidad: number;
        valorTotal: unknown;
      }
    > = {
      [MovementType.SALDO_INICIAL]: {
        cantidad: 0,
        valorTotal: 0,
      },

      [MovementType.INCREMENTO]: {
        cantidad: 0,
        valorTotal: 0,
      },

      [MovementType.REINTEGRO]: {
        cantidad: 0,
        valorTotal: 0,
      },

      [MovementType.NO_PROCEDE]: {
        cantidad: 0,
        valorTotal: 0,
      },

      [MovementType.AJUSTE]: {
        cantidad: 0,
        valorTotal: 0,
      },
    };

    for (const row of rows) {
      result[row.tipo] = {
        cantidad: row._count.tipo,
        valorTotal: row._sum.valor ?? 0,
      };
    }

    return result;
  }
}