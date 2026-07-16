import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import {
  CaseStatus,
  MovementConcept,
  MovementType,
  Priority,
} from '../generated/prisma/enums.js';


type ImportRow = {
  Caja?: string;
  'Tipo Recobro': string;
  'Tipo de Identificación': string;
  'Nro. Identificacion': string;
  'Nombre Beneficiario': string;
  'Periodos Doble Aporte': string;
  Dirección?: string;
  Ciudad?: string;
  Teléfono?: number | string;
  'Correo Electrónico'?: string;

  'Liquidado Eps'?: number | string;
  'Total Recobro Eps'?: number | string;
  'Reintegro Eps'?: number | string;
  'Saldo Eps'?: number | string;

  'Liquidado Afp'?: number | string;
  'Total Recobro Afp'?: number | string;
  'Reintegro Afp'?: number | string;
  'Saldo Afp'?: number | string;

  'Liquidado Transferencia Economica'?: number | string;
  'Reintegro Transferencia Economica'?: number | string;
  'Saldo Transferencia Economica'?: number | string;

  'Liquidado Cm'?: number | string;
  'Reintegro Cm'?: number | string;
  'Saldo Cm'?: number | string;

  'Liquidado Beneficios Enonómicos 488'?: number | string;
  'Reintegro Beneficios Enonómicos 488'?: number | string;
  'Saldo Beneficios Enonómicos 488'?: number | string;

  'Liquidado Bono de Alimentación'?: number | string;
  'Reintegrado Bono de Alimentación'?: number | string;
  'Saldo Bono de Alimentación'?: number | string;

  'Total A Reintegrar (Cierre Febrero)'?: number | string;
  'Total Reintegrado (Cierre Febrero)'?: number | string;
  'Saldo Total (Cierre Febrero)'?: number | string;

  'Total A Reintegrar'?: number | string;
  'Total Reintegrado'?: number | string;
  'Saldo Total'?: number | string;

  'Procede O No Procede Transferencia'?: string;
  Procedencia?: string;
};
type UploadedExcelFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getColumn(row: ImportRow, columnName: string): unknown {
    const normalize = (value: string) =>
      value
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const target = normalize(columnName);

    const foundKey = Object.keys(row).find(
      (key) => normalize(key) === target,
    );

    return foundKey ? row[foundKey as keyof ImportRow] : undefined;
  }

  async importRecobrosFromExcel(file: UploadedExcelFile) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('El archivo no contiene hojas.');
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<ImportRow>(worksheet, {
      defval: '',
    });

    if (!rows.length) {
      throw new BadRequestException('El archivo no contiene registros.');
    }

    return this.prisma.$transaction(
      async (tx) => {
      const company = await tx.company.upsert({
        where: { slug: 'empresa-demo' },
        update: {},
        create: {
          name: 'Empresa Demo',
          slug: 'empresa-demo',
        },
      });
      

      const processedBeneficiaryIds = new Set<string>();
      const seenCases = new Set<string>();

      let beneficiariesCreated = 0;
      let beneficiariesUpdated = 0;
      let casesCreated = 0;
      let movementsCreated = 0;
      let movementDetailsCreated = 0;

      const systemUserId = await this.getSystemUserId(tx, company.id);

      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2;

        if (this.isEmptyRow(row)) {
          continue;
        }

        this.validateRow(row, rowNumber);

        const tipoDocumento =
          String(this.getColumn(row, 'Tipo de Identificación') ?? '').trim() ||
          'SIN_TIPO';

        const documento = String(
          this.getColumn(row, 'Nro. Identificacion') ?? '',
        ).trim();

        const direccion = this.optionalString(
          this.getColumn(row, 'Dirección'),
        );

        const telefono = this.optionalString(
          this.getColumn(row, 'Teléfono'),
        );

        const email = this.optionalString(
          this.getColumn(row, 'Correo Electrónico'),
        );

        const ciudad = this.optionalString(
          this.getColumn(row, 'Ciudad'),
        );

        const nombreCompleto = String(row['Nombre Beneficiario']).trim();
        const { nombres, apellidos } = this.splitFullName(nombreCompleto);

        const ley = String(row['Tipo Recobro']).trim();
        const periodo = this.normalizePeriodo(row['Periodos Doble Aporte']);

        const valorSalud = Math.max(
          0,
          this.parseMoney(this.getColumn(row, 'Saldo Eps')),
        );

        const valorPension = Math.max(
          0,
          this.parseMoney(this.getColumn(row, 'Saldo Afp')),
        );

        const valorCuotaMonetaria = Math.max(
          0,
          this.parseMoney(this.getColumn(row, 'Saldo Cm')),
        );

        const valorTransferenciaEconomica = Math.max(
          0,
          this.parseMoney(this.getColumn(row, 'Saldo Transferencia Economica')),
        );

        const valorBonoAlimentacion = Math.max(
          0,
          this.parseMoney(
            this.getColumn(row, 'Saldo Bono de Alimentación'),
          ),
        );

        const valorBeneficiosEconomicos488 = Math.max(
          0,
          this.parseMoney(
            this.getColumn(row, 'Saldo Beneficios Enonómicos 488'),
          ),
        );

        const saldoTotalArchivo = this.parseMoney(
          this.getColumn(row, 'Saldo Total') ||
            this.getColumn(row, 'Saldo Total (Cierre Febrero)'),
        );

        const valorTotal =
        valorSalud +
        valorPension +
        valorCuotaMonetaria +
        valorTransferenciaEconomica +
        valorBonoAlimentacion +
        valorBeneficiosEconomicos488;

        /*if (
          saldoTotalArchivo > 0 &&
          Math.abs(valorTotal - saldoTotalArchivo) > 1
        ) {
          throw new BadRequestException(
            `Fila ${rowNumber}: la suma de saldos por concepto (${valorTotal}) no coincide con el Saldo Total (Cierre Febrero) (${saldoTotalArchivo}).`,
          );
        }*/

        const caseKey = `${tipoDocumento}-${documento}-${ley}-${periodo}`;

        if (seenCases.has(caseKey)) {
          throw new BadRequestException(
            `Fila ${rowNumber}: el archivo contiene un caso duplicado para documento ${documento}, ley ${ley}, periodo ${periodo}.`,
          );
        }

        seenCases.add(caseKey);

        const existingBeneficiary = await tx.beneficiary.findUnique({
          where: {
            companyId_tipoDocumento_documento: {
              companyId: company.id,
              tipoDocumento,
              documento,
            },
          },
        });

        const beneficiary = await tx.beneficiary.upsert({
          where: {
            companyId_tipoDocumento_documento: {
              companyId: company.id,
              tipoDocumento,
              documento,
            },
          },
          update: {
            nombres,
            apellidos,
            direccion: direccion ?? undefined,
            telefono: telefono ?? undefined,
            email: email ?? undefined,
            ciudad: ciudad ?? undefined,
          },
          create: {
            companyId: company.id,
            tipoDocumento,
            documento,
            nombres,
            apellidos,
            direccion,
            telefono,
            email,
            ciudad,
            estado: 'ACTIVO',
          },
        });

        if (existingBeneficiary) {
          beneficiariesUpdated++;
        } else {
          beneficiariesCreated++;
        }

        const existingCase = await tx.recobroCase.findFirst({
          where: {
            companyId: company.id,
            beneficiaryId: beneficiary.id,
            ley,
            periodo,
          },
        });

        if (existingCase) {
          throw new BadRequestException(
            `Fila ${rowNumber}: ya existe un caso para documento ${documento}, ley ${ley}, periodo ${periodo}.`,
          );
        }

        const estado = CaseStatus.ABIERTO;
        const prioridad = Priority.MEDIA;

        const recobroCase = await tx.recobroCase.create({
          data: {
            companyId: company.id,
            beneficiaryId: beneficiary.id,
            ley,
            periodo,
            valorSalud,
            valorPension,
            valorCuotaMonetaria,
            valorTransferenciaEconomica,
            valorBonoAlimentacion,
            valorBeneficiosEconomicos488,
            valorTotal,
            estado,
            prioridad,
            fechaApertura: new Date(),
            ultimaGestionAt: new Date(),
          },
        });

        casesCreated++;

        console.log({
          fila: rowNumber,
          salud: valorSalud,
          pension: valorPension,
          cuota: valorCuotaMonetaria,
          transferencia: valorTransferenciaEconomica,
          bonoAlimentacion: valorBonoAlimentacion,
          beneficiosEconomicos488: valorBeneficiosEconomicos488,
        });

        const movementDetails = [
          {
            tipo: MovementType.SALDO_INICIAL,
            concepto: MovementConcept.SALUD,
            adjustmentDirection: null,
            valor: valorSalud,
            saldoAnteriorConcepto: 0,
            saldoNuevoConcepto: valorSalud,
          },
          {
            tipo: MovementType.SALDO_INICIAL,
            concepto: MovementConcept.PENSION,
            adjustmentDirection: null,
            valor: valorPension,
            saldoAnteriorConcepto: 0,
            saldoNuevoConcepto: valorPension,
          },
          {
            tipo: MovementType.SALDO_INICIAL,
            concepto: MovementConcept.CUOTA_MONETARIA,
            adjustmentDirection: null,
            valor: valorCuotaMonetaria,
            saldoAnteriorConcepto: 0,
            saldoNuevoConcepto: valorCuotaMonetaria,
          },
          {
            tipo: MovementType.SALDO_INICIAL,
            concepto: MovementConcept.TRANSFERENCIA_ECONOMICA,
            adjustmentDirection: null,
            valor: valorTransferenciaEconomica,
            saldoAnteriorConcepto: 0,
            saldoNuevoConcepto: valorTransferenciaEconomica,
          },
          {
            tipo: MovementType.SALDO_INICIAL,
            concepto: MovementConcept.BONO_ALIMENTACION,
            adjustmentDirection: null,
            valor: valorBonoAlimentacion,
            saldoAnteriorConcepto: 0,
            saldoNuevoConcepto: valorBonoAlimentacion,
          },
          {
            tipo: MovementType.SALDO_INICIAL,
            concepto: MovementConcept.BENEFICIOS_ECONOMICOS_488,
            adjustmentDirection: null,
            valor: valorBeneficiosEconomicos488,
            saldoAnteriorConcepto: 0,
            saldoNuevoConcepto: valorBeneficiosEconomicos488,
          },
        ].filter((detail) => detail.valor > 0);

        console.log('Detalles del movimiento inicial:', movementDetails);

        const beneficiaryAggregate = await tx.recobroCase.aggregate({
          where: {
            companyId: company.id,
            beneficiaryId: beneficiary.id,
          },
          _sum: {
            valorTotal: true,
          },
        });

        const beneficiaryTotalNuevo = Number(
          beneficiaryAggregate._sum.valorTotal ?? 0,
        );

        const beneficiaryTotalAnterior = beneficiaryTotalNuevo - valorTotal;

        if (movementDetails.length > 0) {
          await tx.movement.create({
            data: {
              companyId: company.id,
              recobroCaseId: recobroCase.id,
              beneficiaryId: beneficiary.id,
              userId: systemUserId,
              descripcion: this.buildInitialMovementDescription(row),

              caseTotalAnterior: 0,
              caseTotalNuevo: valorTotal,

              beneficiaryTotalAnterior,
              beneficiaryTotalNuevo,

              details: {
                create: movementDetails,
              },
            },
          });

          movementsCreated++;
          movementDetailsCreated += movementDetails.length;
        }

        processedBeneficiaryIds.add(beneficiary.id);
      }

      for (const beneficiaryId of processedBeneficiaryIds) {
        const aggregate = await tx.recobroCase.aggregate({
          where: {
            companyId: company.id,
            beneficiaryId,
          },
          _sum: {
            valorTotal: true,
          },
        });

        await tx.beneficiary.update({
          where: { id: beneficiaryId },
          data: {
            saldoTotal: aggregate._sum.valorTotal ?? 0,
          },
        });
      }

      return {
        message: 'Importación finalizada correctamente.',
        company: company.name,
        totalRows: rows.length,
        beneficiariesCreated,
        beneficiariesUpdated,
        casesCreated,
        movementsCreated,
        movementDetailsCreated,
      };

        },
        {
          timeout: 300000,
          maxWait: 60000,
        },
      );
    }


  private validateRow(row: ImportRow, rowNumber: number) {
    const requiredFields: Array<keyof ImportRow> = [
      'Tipo Recobro',
      'Nro. Identificacion',
      'Nombre Beneficiario',
      'Periodos Doble Aporte',
    ];

    for (const field of requiredFields) {
      if (!String(row[field] ?? '').trim()) {
        throw new BadRequestException(
          `Fila ${rowNumber}: el campo "${String(field)}" es obligatorio.`,
        );
      }
    }

    const periodo = this.normalizePeriodo(row['Periodos Doble Aporte']);

    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw new BadRequestException(
        `Fila ${rowNumber}: el campo "Periodos Doble Aporte" debe tener formato YYYY-MM. Ejemplo: 2025-01.`,
      );
    }
  }

  private isEmptyRow(row: ImportRow): boolean {
    return Object.values(row).every(
      (value) => String(value ?? '').trim() === '',
    );
  }

  private normalizePeriodo(value: unknown): string {
  const cleanValue = String(value ?? '').trim();

  if (!cleanValue) return '';

  if (/^\d{4}-\d{2}$/.test(cleanValue)) {
    return cleanValue;
  }

  if (/^\d{4}\/\d{2}$/.test(cleanValue)) {
    return cleanValue.replace('/', '-');
  }

  if (/^\d{6}$/.test(cleanValue)) {
    return `${cleanValue.slice(0, 4)}-${cleanValue.slice(4, 6)}`;
  }

  return cleanValue;
}

  private parseMoney(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return Math.round(value * 100) / 100;
    }

    let normalized = String(value)
      .replace(/\$/g, '')
      .replace(/\s/g, '')
      .trim();

    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');

      if (lastComma > lastDot) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else {
        normalized = normalized.replace(/,/g, '');
      }
    } else if (hasComma) {
      normalized = normalized.replace(',', '.');
    } else if (hasDot) {
      const dotCount = (normalized.match(/\./g) || []).length;

      if (dotCount > 1) {
        normalized = normalized.replace(/\./g, '');
      }
    }

    const parsed = Number(normalized);

    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`Valor monetario inválido: ${value}`);
    }

    return Math.round(parsed * 100) / 100;
  }

  private optionalString(value: unknown): string | null {
    const cleanValue = String(value ?? '').trim();
    return cleanValue ? cleanValue : null;
  }

  private splitFullName(fullName: string): {
    nombres: string;
    apellidos: string;
  } {
    const parts = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return {
        nombres: 'Sin nombre',
        apellidos: 'Sin apellido',
      };
    }

    if (parts.length === 1) {
      return {
        nombres: parts[0],
        apellidos: '',
      };
    }

    if (parts.length === 2) {
      return {
        nombres: parts[0],
        apellidos: parts[1],
      };
    }

    const apellidos = parts.slice(-2).join(' ');
    const nombres = parts.slice(0, -2).join(' ');

    return {
      nombres,
      apellidos,
    };
  }

  private buildInitialMovementDescription(row: ImportRow): string {
    const parts = [
      'Carga inicial desde archivo Excel.',
      row.Caja ? `Caja: ${row.Caja}` : null,
      row['Tipo Recobro'] ? `Tipo recobro: ${row['Tipo Recobro']}` : null,
      this.getColumn(row, 'Procede / No Procede Transferencia') ||
      this.getColumn(row, 'Procede O No Procede Transferencia')
        ? `Procede/No procede transferencia: ${
            this.getColumn(row, 'Procede / No Procede Transferencia') ||
            this.getColumn(row, 'Procede O No Procede Transferencia')
          }`
        : null,
      row.Procedencia ? `Procedencia: ${row.Procedencia}` : null,
    ].filter(Boolean);

    return parts.join(' | ');
  }

  private parseCaseStatus(value: unknown): CaseStatus {
    const cleanValue = String(value ?? '').trim().toUpperCase();

    if (!cleanValue) return CaseStatus.ABIERTO;

    const normalized = cleanValue
      .replace(/\s+/g, '_')
      .replace('GESTIÓN', 'GESTION');

    if (normalized in CaseStatus) {
      return CaseStatus[normalized as keyof typeof CaseStatus];
    }

    throw new BadRequestException(`Estado de caso inválido: ${value}`);
  }

  private parsePriority(value: unknown): Priority {
    const cleanValue = String(value ?? '').trim().toUpperCase();

    if (!cleanValue) return Priority.MEDIA;

    if (cleanValue in Priority) {
      return Priority[cleanValue as keyof typeof Priority];
    }

    throw new BadRequestException(`Prioridad inválida: ${value}`);
  }

  private async getSystemUserId(tx: any, companyId: string): Promise<string> {
    const systemUser = await tx.user.upsert({
      where: {
        companyId_email: {
          companyId,
          email: 'sistema@sisrec.local',
        },
      },
      update: {},
      create: {
        companyId,
        email: 'sistema@sisrec.local',
        passwordHash: 'SYSTEM_USER_NO_LOGIN',
        fullName: 'Usuario Sistema',
        role: 'ADMIN',
      },
    });

    return systemUser.id;
  }
}