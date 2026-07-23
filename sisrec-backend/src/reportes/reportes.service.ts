import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';
import { QueryReporteCarteraDto } from './dto/query-reporte-cartera.dto';
import { QueryReporteMovimientosDto } from './dto/query-reporte-movimientos.dto';
import { MovementConcept } from '../generated/prisma/enums.js';
import * as XLSX from 'xlsx';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCarteraExcel(
    user: CurrentUserPayload,
    query: QueryReporteCarteraDto,
  ) {
    const reporte = await this.cartera(user, query);

    const rows = reporte.data.map((item) => ({
      Documento: item.beneficiary.documento,
      'Tipo Documento': item.beneficiary.tipoDocumento,
      Nombres: item.beneficiary.nombres,
      Apellidos: item.beneficiary.apellidos,
      Ley: item.ley,
      Periodo: item.periodo,
      Estado: item.estado,
      Prioridad: item.prioridad,
      'Valor Salud': Number(item.valorSalud),
      'Valor Pensión': Number(item.valorPension),
      'Valor Cuota Monetaria': Number(item.valorCuotaMonetaria),
      'Valor Transferencia Económica': Number(
        item.valorTransferenciaEconomica,
      ),
      'Valor Bono de Alimentación': Number(
        item.valorBonoAlimentacion,
      ),
      'Valor Beneficios Económicos 488': Number(
        item.valorBeneficiosEconomicos488,
      ),
      'Valor Total': Number(item.valorTotal),
      Responsable: item.responsable?.fullName ?? '',
      'Fecha Apertura': item.fechaApertura,
      'Última Gestión': item.ultimaGestionAt,
    }));

    return this.buildExcelBuffer(rows, 'Reporte Cartera');
  }

  async exportMovimientosExcel(
    user: CurrentUserPayload,
    query: QueryReporteMovimientosDto,
  ) {
    const reporte = await this.movimientos(user, query);

    const rows = reporte.data.map((item) => {
      const salud = this.findDetailByConcept(
        item.details,
        MovementConcept.SALUD,
      );

      const pension = this.findDetailByConcept(
        item.details,
        MovementConcept.PENSION,
      );

      const cuotaMonetaria = this.findDetailByConcept(
        item.details,
        MovementConcept.CUOTA_MONETARIA,
      );

      const transferenciaEconomica = this.findDetailByConcept(
        item.details,
        MovementConcept.TRANSFERENCIA_ECONOMICA,
      );

      const bonoAlimentacion = this.findDetailByConcept(
        item.details,
        MovementConcept.BONO_ALIMENTACION,
      );

      const beneficiosEconomicos488 = this.findDetailByConcept(
        item.details,
        MovementConcept.BENEFICIOS_ECONOMICOS_488,
      );

      const tipos = [
        ...new Set(item.details.map((detail) => detail.tipo)),
      ].join(', ');

      const valorTotalMovimiento = item.details.reduce(
        (sum, detail) => sum + Number(detail.valor),
        0,
      );

      return {
        Documento: item.beneficiary.documento,

        Beneficiario:
          `${item.beneficiary.nombres} ${item.beneficiary.apellidos}`.trim(),

        Ley: item.recobroCase.ley,
        Periodo: item.recobroCase.periodo,

        Tipo: tipos,

        'Valor Salud': Number(salud?.valor ?? 0),
        'Valor Pensión': Number(pension?.valor ?? 0),
        'Valor Cuota Monetaria': Number(cuotaMonetaria?.valor ?? 0),
        'Valor Transferencia Económica': Number(
          transferenciaEconomica?.valor ?? 0,
        ),

        'Valor Bono de Alimentación': Number(
          bonoAlimentacion?.valor ?? 0,
        ),

        'Valor Beneficios Económicos 488': Number(
          beneficiosEconomicos488?.valor ?? 0,
        ),

        'Valor Total Movimiento': valorTotalMovimiento,

        Usuario: item.user.fullName,

        'Saldo Salud Anterior': Number(
          salud?.saldoAnteriorConcepto ?? 0,
        ),
        'Saldo Salud Nuevo': Number(
          salud?.saldoNuevoConcepto ?? 0,
        ),

        'Saldo Pensión Anterior': Number(
          pension?.saldoAnteriorConcepto ?? 0,
        ),
        'Saldo Pensión Nuevo': Number(
          pension?.saldoNuevoConcepto ?? 0,
        ),

        'Saldo Cuota Monetaria Anterior': Number(
          cuotaMonetaria?.saldoAnteriorConcepto ?? 0,
        ),
        'Saldo Cuota Monetaria Nuevo': Number(
          cuotaMonetaria?.saldoNuevoConcepto ?? 0,
        ),

        'Saldo Transferencia Anterior': Number(
          transferenciaEconomica?.saldoAnteriorConcepto ?? 0,
        ),
        'Saldo Transferencia Nuevo': Number(
          transferenciaEconomica?.saldoNuevoConcepto ?? 0,
        ),

        'Saldo Bono Alimentación Anterior': Number(
          bonoAlimentacion?.saldoAnteriorConcepto ?? 0,
        ),

        'Saldo Bono Alimentación Nuevo': Number(
          bonoAlimentacion?.saldoNuevoConcepto ?? 0,
        ),

        'Saldo Beneficios Económicos 488 Anterior': Number(
          beneficiosEconomicos488?.saldoAnteriorConcepto ?? 0,
        ),

        'Saldo Beneficios Económicos 488 Nuevo': Number(
          beneficiosEconomicos488?.saldoNuevoConcepto ?? 0,
        ),

        'Total Caso Anterior': Number(item.caseTotalAnterior),
        'Total Caso Nuevo': Number(item.caseTotalNuevo),

        'Total Beneficiario Anterior': Number(
          item.beneficiaryTotalAnterior,
        ),
        'Total Beneficiario Nuevo': Number(
          item.beneficiaryTotalNuevo,
        ),

        Fecha: item.createdAt,
      };
    });

    return this.buildExcelBuffer(rows, 'Reporte Movimientos');
  }

  private buildExcelBuffer(
    rows: Record<string, unknown>[],
    sheetName: string,
  ) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName,
    );

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
  }

  async cartera(
    user: CurrentUserPayload,
    query: QueryReporteCarteraDto,
  ) {
    const casos = await this.prisma.recobroCase.findMany({
      where: {
        companyId: user.companyId,
        estado: query.estado,
        ley: query.ley,
        periodo: query.periodo,

        beneficiary: query.documento
          ? {
              documento: {
                contains: query.documento,
              },
            }
          : undefined,
      },

      include: {
        beneficiary: true,

        responsable: {
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
    });

    const resumen = {
      totalCasos: casos.length,

      valorTotal: casos.reduce(
        (sum, item) => sum + Number(item.valorTotal),
        0,
      ),

      valorSalud: casos.reduce(
        (sum, item) => sum + Number(item.valorSalud),
        0,
      ),

      valorPension: casos.reduce(
        (sum, item) => sum + Number(item.valorPension),
        0,
      ),

      valorCuotaMonetaria: casos.reduce(
        (sum, item) =>
          sum + Number(item.valorCuotaMonetaria),
        0,
      ),

      valorTransferenciaEconomica: casos.reduce(
        (sum, item) =>
          sum + Number(item.valorTransferenciaEconomica),
        0,
      ),

      valorBonoAlimentacion: casos.reduce(
        (sum, item) =>
          sum + Number(item.valorBonoAlimentacion),
        0,
      ),

      valorBeneficiosEconomicos488: casos.reduce(
        (sum, item) =>
          sum + Number(item.valorBeneficiosEconomicos488),
        0,
      ),
    };

    return {
      filtros: query,
      resumen,
      data: casos,
    };
  }

  async movimientos(
    user: CurrentUserPayload,
    query: QueryReporteMovimientosDto,
  ) {
    const movimientos =
      await this.prisma.movement.findMany({
        where: {
          companyId: user.companyId,

          recobroCaseId: query.recobroCaseId,

          beneficiary: query.documento
            ? {
                documento: {
                  contains: query.documento,
                },
              }
            : undefined,

          details:
            query.tipo || query.concepto
              ? {
                  some: {
                    tipo: query.tipo,
                    concepto: query.concepto,
                  },
                }
              : undefined,
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
      });

    const valorTotalMovimientos =
      movimientos.reduce(
        (total, movement) =>
          total +
          movement.details.reduce(
            (subtotal, detail) =>
              subtotal + Number(detail.valor),
            0,
          ),
        0,
      );

    const totalDetalles = movimientos.reduce(
      (total, movement) =>
        total + movement.details.length,
      0,
    );

    return {
      filtros: query,

      resumen: {
        totalMovimientos: movimientos.length,
        totalDetalles,
        valorTotalMovimientos,
      },

      data: movimientos,
    };
  }

  private findDetailByConcept<
    T extends {
      concepto: MovementConcept;
    },
  >(
    details: T[],
    concepto: MovementConcept,
  ): T | undefined {
    return details.find(
      (detail) => detail.concepto === concepto,
    );
  }
}