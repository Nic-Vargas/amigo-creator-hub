import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CaseStatus, MovementConcept, MovementType,Priority } from '../generated/prisma/enums.js';
import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecobroDto } from './dto/create-recobro.dto';
import { UpdateRecobroDto } from './dto/update-recobro.dto';
import { UpdateRecobroStatusDto } from './dto/update-recobro-status.dto';

@Injectable()
export class RecobrosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: CurrentUserPayload) {
    return this.prisma.recobroCase.findMany({
      where: {
        companyId: user.companyId,
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
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const recobro = await this.prisma.recobroCase.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        beneficiary: true,
        movements: {
          include: {
            details: {
              orderBy: {
                createdAt: 'asc',
              },
            },
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
        },
      },
    });

    if (!recobro) {
      throw new NotFoundException('Caso de recobro no encontrado.');
    }

    return recobro;
  }

  async create(dto: CreateRecobroDto, user: CurrentUserPayload) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        id: dto.beneficiaryId,
        companyId: user.companyId,
      },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiario no encontrado.');
    }

    const valorTotal =
      dto.valorSalud +
      dto.valorPension +
      dto.valorCuotaMonetaria +
      dto.valorTransferenciaEconomica;
      dto.valorBonoAlimentacion +
      dto.valorBeneficiosEconomicos488;

    if (valorTotal <= 0) {
      throw new BadRequestException('El valor total debe ser mayor a cero.');
    }

    const existing = await this.prisma.recobroCase.findFirst({
      where: {
        companyId: user.companyId,
        beneficiaryId: dto.beneficiaryId,
        ley: dto.ley,
        periodo: dto.periodo,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un caso para este beneficiario, ley y periodo.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const beneficiaryTotalAnterior = Number(beneficiary.saldoTotal);
      const beneficiaryTotalNuevo =
        beneficiaryTotalAnterior + valorTotal;

      const recobro = await tx.recobroCase.create({
        data: {
          companyId: user.companyId,
          beneficiaryId: dto.beneficiaryId,
          ley: dto.ley,
          periodo: dto.periodo,

          valorSalud: dto.valorSalud,
          valorPension: dto.valorPension,
          valorCuotaMonetaria: dto.valorCuotaMonetaria,
          valorTransferenciaEconomica:
            dto.valorTransferenciaEconomica,
          valorBonoAlimentacion:
            dto.valorBonoAlimentacion,
          valorBeneficiosEconomicos488:
            dto.valorBeneficiosEconomicos488,

          valorTotal,

          estado: CaseStatus.ABIERTO,
          prioridad: dto.prioridad ?? Priority.MEDIA,
          responsableUserId: user.id,
          fechaApertura: new Date(),
          ultimaGestionAt: new Date(),
        },
      });

      const movementDetails = [
        {
          tipo: MovementType.SALDO_INICIAL,
          concepto: MovementConcept.SALUD,
          adjustmentDirection: null,
          valor: dto.valorSalud,
          saldoAnteriorConcepto: 0,
          saldoNuevoConcepto: dto.valorSalud,
        },
        {
          tipo: MovementType.SALDO_INICIAL,
          concepto: MovementConcept.PENSION,
          adjustmentDirection: null,
          valor: dto.valorPension,
          saldoAnteriorConcepto: 0,
          saldoNuevoConcepto: dto.valorPension,
        },
        {
          tipo: MovementType.SALDO_INICIAL,
          concepto: MovementConcept.CUOTA_MONETARIA,
          adjustmentDirection: null,
          valor: dto.valorCuotaMonetaria,
          saldoAnteriorConcepto: 0,
          saldoNuevoConcepto: dto.valorCuotaMonetaria,
        },
        {
          tipo: MovementType.SALDO_INICIAL,
          concepto: MovementConcept.TRANSFERENCIA_ECONOMICA,
          adjustmentDirection: null,
          valor: dto.valorTransferenciaEconomica,
          saldoAnteriorConcepto: 0,
          saldoNuevoConcepto:
            dto.valorTransferenciaEconomica,
        },
        {
          tipo: MovementType.SALDO_INICIAL,
          concepto: MovementConcept.BONO_ALIMENTACION,
          adjustmentDirection: null,
          valor: dto.valorBonoAlimentacion,
          saldoAnteriorConcepto: 0,
          saldoNuevoConcepto:
            dto.valorBonoAlimentacion,
        },
        {
          tipo: MovementType.SALDO_INICIAL,
          concepto:
            MovementConcept.BENEFICIOS_ECONOMICOS_488,
          adjustmentDirection: null,
          valor: dto.valorBeneficiosEconomicos488,
          saldoAnteriorConcepto: 0,
          saldoNuevoConcepto:
            dto.valorBeneficiosEconomicos488,
        },
      ].filter((detail) => detail.valor > 0);

      await tx.movement.create({
        data: {
          companyId: user.companyId,
          recobroCaseId: recobro.id,
          beneficiaryId: dto.beneficiaryId,
          userId: user.id,

          descripcion:
            'Saldo inicial registrado mediante creación manual del caso.',

          caseTotalAnterior: 0,
          caseTotalNuevo: valorTotal,

          beneficiaryTotalAnterior,
          beneficiaryTotalNuevo,

          details: {
            create: movementDetails,
          },
        },
      });

      await tx.beneficiary.update({
        where: {
          id: dto.beneficiaryId,
        },
        data: {
          saldoTotal: beneficiaryTotalNuevo,
        },
      });

      return recobro;
    });
  }

  async update(id: string, dto: UpdateRecobroDto, user: CurrentUserPayload) {
    const recobro = await this.findOne(id, user);

    if (recobro.estado === CaseStatus.CERRADO && user.role !== 'ADMIN') {
      throw new BadRequestException(
        'No se puede modificar un caso cerrado.',
      );
    }

    return this.prisma.recobroCase.update({
      where: {
        id,
      },
      data: {
        ley: dto.ley,
        periodo: dto.periodo,
        prioridad: dto.prioridad,
      },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateRecobroStatusDto,
    user: CurrentUserPayload,
  ) {
    const recobro = await this.findOne(id, user);

    this.validateStatusTransition(recobro.estado, dto.estado, user.role);

    return this.prisma.recobroCase.update({
      where: {
        id,
      },
      data: {
        estado: dto.estado,
        ultimaGestionAt: new Date(),
      },
    });
  }

  private validateStatusTransition(
    current: CaseStatus,
    next: CaseStatus,
    role: string,
  ) {
    if (current === next) return;

    if (current === CaseStatus.CERRADO && role !== 'ADMIN') {
      throw new BadRequestException(
        'Solo ADMIN puede modificar un caso cerrado.',
      );
    }

    const allowed: Record<CaseStatus, CaseStatus[]> = {
      ABIERTO: [CaseStatus.EN_GESTION, CaseStatus.CERRADO],
      EN_GESTION: [CaseStatus.ACUERDO, CaseStatus.EN_PAGO, CaseStatus.CERRADO],
      ACUERDO: [CaseStatus.EN_PAGO, CaseStatus.CERRADO],
      EN_PAGO: [CaseStatus.CERRADO],
      CERRADO: [],
    };

    if (!allowed[current].includes(next) && role !== 'ADMIN') {
      throw new BadRequestException(
        `Transición de estado no permitida: ${current} -> ${next}.`,
      );
    }
  }
}