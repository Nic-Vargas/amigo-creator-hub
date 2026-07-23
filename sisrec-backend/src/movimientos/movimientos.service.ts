import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AdjustmentDirection,
  CaseStatus,
  MovementConcept,
  MovementType,
} from '../generated/prisma/enums.js';

import { PrismaService } from '../prisma/prisma.service';

import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';

import { SupabaseStorageService } from '../storage/supabase-storage.service';

import { CreateMovementDto } from './dto/create-movement.dto';

type UploadedAttachment = {
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
};

@Injectable()
export class MovimientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService:
      SupabaseStorageService,
  ) {}

  async findAll(
    user: CurrentUserPayload,
  ) {
    const movements =
      await this.prisma.movement.findMany({
        where: {
          companyId: user.companyId,
        },

        include: {
          details: {
            orderBy: {
              createdAt: 'asc',
            },
          },

          attachments: {
            orderBy: {
              createdAt: 'asc',
            },
          },

          recobroCase: true,
          beneficiary: true,

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

    return Promise.all(
      movements.map((movement) =>
        this.addSignedUrlsToMovement(
          movement,
        ),
      ),
    );
  }

  async create(
    dto: CreateMovementDto,
    user: CurrentUserPayload,
    files: Express.Multer.File[] = [],
  ) {
    this.validateDetails(dto);
    this.validateFiles(files);

    const uploadedAttachments:
      UploadedAttachment[] = [];

    try {
      for (const file of files) {
        const uploaded =
          await this.storageService.uploadMovementAttachment(
            file,
            {
              companyId: user.companyId,
              recobroCaseId:
                dto.recobroCaseId,
            },
          );

        uploadedAttachments.push({
          fileName: file.originalname,
          storagePath:
            uploaded.storagePath,
          mimeType: file.mimetype,
          fileSize: file.size,
        });
      }

      const result =
        await this.prisma.$transaction(
          async (tx) => {
            const recobro =
              await tx.recobroCase.findFirst({
                where: {
                  id: dto.recobroCaseId,
                  companyId:
                    user.companyId,
                },

                include: {
                  beneficiary: true,
                },
              });

            if (!recobro) {
              throw new NotFoundException(
                'Caso de recobro no encontrado.',
              );
            }

            if (
              recobro.estado ===
                CaseStatus.CERRADO &&
              user.role !== 'ADMIN'
            ) {
              throw new BadRequestException(
                'No se pueden registrar movimientos sobre un caso cerrado.',
              );
            }

            const caseTotalAnterior =
              Number(recobro.valorTotal);

            const beneficiaryTotalAnterior =
              Number(
                recobro.beneficiary
                  .saldoTotal,
              );

            const caseUpdateData: Record<
              string,
              number | Date
            > = {
              ultimaGestionAt:
                new Date(),
            };

            const movementDetails: Array<{
              tipo: MovementType;
              concepto: MovementConcept;
              adjustmentDirection:
                | AdjustmentDirection
                | null;
              valor: number;
              saldoAnteriorConcepto: number;
              saldoNuevoConcepto: number;
            }> = [];

            let totalDelta = 0;

            for (const detail of dto.detalles) {
              const conceptField =
                this.getConceptField(
                  detail.concepto,
                );

              const saldoAnteriorConcepto =
                Number(
                  recobro[
                    conceptField
                  ],
                );

              const saldoNuevoConcepto =
                this.calculateNewBalance({
                  tipo: detail.tipo,
                  valor: detail.valor,
                  saldoActual:
                    saldoAnteriorConcepto,
                  adjustmentDirection:
                    detail.adjustmentDirection,
                });

              const delta =
                saldoNuevoConcepto -
                saldoAnteriorConcepto;

              totalDelta += delta;

              caseUpdateData[
                conceptField
              ] = saldoNuevoConcepto;

              movementDetails.push({
                tipo: detail.tipo,
                concepto:
                  detail.concepto,

                adjustmentDirection:
                  detail.adjustmentDirection ??
                  null,

                valor:
                  detail.tipo ===
                  MovementType.NO_PROCEDE
                    ? saldoAnteriorConcepto
                    : detail.valor,

                saldoAnteriorConcepto,
                saldoNuevoConcepto,
              });
            }

            const caseTotalNuevo =
              caseTotalAnterior +
              totalDelta;

            if (caseTotalNuevo < 0) {
              throw new BadRequestException(
                'La operación dejaría el caso con saldo negativo.',
              );
            }

            caseUpdateData.valorTotal =
              caseTotalNuevo;

            const updatedCase =
              await tx.recobroCase.update({
                where: {
                  id: recobro.id,
                },

                data: caseUpdateData,
              });

            const aggregate =
              await tx.recobroCase.aggregate({
                where: {
                  companyId:
                    user.companyId,
                  beneficiaryId:
                    recobro.beneficiaryId,
                },

                _sum: {
                  valorTotal: true,
                },
              });

            const beneficiaryTotalNuevo =
              Number(
                aggregate._sum
                  .valorTotal ?? 0,
              );

            const updatedBeneficiary =
              await tx.beneficiary.update({
                where: {
                  id: recobro.beneficiaryId,
                },

                data: {
                  saldoTotal:
                    beneficiaryTotalNuevo,
                },
              });

            const movement =
              await tx.movement.create({
                data: {
                  companyId:
                    user.companyId,

                  recobroCaseId:
                    recobro.id,

                  beneficiaryId:
                    recobro.beneficiaryId,

                  userId: user.id,

                  descripcion:
                    dto.descripcion ??
                    null,

                  caseTotalAnterior,
                  caseTotalNuevo,

                  beneficiaryTotalAnterior,
                  beneficiaryTotalNuevo,

                  details: {
                    create:
                      movementDetails,
                  },

                  attachments:
                    uploadedAttachments.length >
                    0
                      ? {
                          create:
                            uploadedAttachments,
                        }
                      : undefined,
                },

                include: {
                  details: true,

                  attachments: {
                    orderBy: {
                      createdAt: 'asc',
                    },
                  },

                  recobroCase: true,
                  beneficiary: true,

                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                    },
                  },
                },
              });

            return {
              movement,
              recobroCase:
                updatedCase,
              beneficiary:
                updatedBeneficiary,
            };
          },
        );

      const movementWithUrls =
        await this.addSignedUrlsToMovement(
          result.movement,
        );

      return {
        ...result,
        movement: movementWithUrls,
      };
    } catch (error) {
      const uploadedPaths =
        uploadedAttachments.map(
          (attachment) =>
            attachment.storagePath,
        );

      if (uploadedPaths.length > 0) {
        try {
          await this.storageService.removeFiles(
            uploadedPaths,
          );
        } catch (cleanupError) {
          console.error(
            'No fue posible eliminar archivos huérfanos de Supabase:',
            cleanupError,
          );
        }
      }

      throw error;
    }
  }

  private async addSignedUrlsToMovement<
    T extends {
      attachments?: Array<{
        id: string;
        movementId: string;
        fileName: string;
        storagePath: string;
        mimeType: string;
        fileSize: number;
        createdAt: Date;
      }>;
    },
  >(movement: T) {
    if (!movement.attachments?.length) {
      return {
        ...movement,
        attachments: [],
      };
    }

    const attachments =
      await Promise.all(
        movement.attachments.map(
          async (attachment) => {
            try {
              const signedUrl =
                await this.storageService.createSignedUrl(
                  attachment.storagePath,
                  600,
                );

              return {
                ...attachment,
                signedUrl,
              };
            } catch (error) {
              console.error(
                `No fue posible generar la URL firmada de ${attachment.storagePath}:`,
                error,
              );

              return {
                ...attachment,
                signedUrl: null,
              };
            }
          },
        ),
      );

    return {
      ...movement,
      attachments,
    };
  }

  private validateFiles(
    files: Express.Multer.File[],
  ) {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    const maximumFileSize =
      10 * 1024 * 1024;

    if (files.length > 6) {
      throw new BadRequestException(
        'Solo puedes adjuntar máximo seis archivos por movimiento.',
      );
    }

    for (const file of files) {
      if (
        !allowedMimeTypes.includes(
          file.mimetype,
        )
      ) {
        throw new BadRequestException(
          `El archivo ${file.originalname} no tiene un formato permitido.`,
        );
      }

      if (
        file.size > maximumFileSize
      ) {
        throw new BadRequestException(
          `El archivo ${file.originalname} supera el límite de 10 MB.`,
        );
      }
    }
  }

  private validateDetails(
    dto: CreateMovementDto,
  ) {
    if (!dto.detalles?.length) {
      throw new BadRequestException(
        'Debe incluir al menos un concepto en la operación.',
      );
    }

    const concepts = dto.detalles.map(
      (detail) => detail.concepto,
    );

    const uniqueConcepts =
      new Set(concepts);

    if (
      uniqueConcepts.size !==
      concepts.length
    ) {
      throw new BadRequestException(
        'No se puede repetir un concepto dentro de la misma operación.',
      );
    }

    for (const detail of dto.detalles) {
      if (
        detail.valor <= 0 &&
        detail.tipo !==
          MovementType.NO_PROCEDE
      ) {
        throw new BadRequestException(
          `El valor de ${detail.concepto} debe ser mayor a cero.`,
        );
      }

      if (
        detail.tipo ===
          MovementType.AJUSTE &&
        !detail.adjustmentDirection
      ) {
        throw new BadRequestException(
          `El ajuste de ${detail.concepto} requiere dirección SUMA o RESTA.`,
        );
      }

      if (
        detail.tipo !==
          MovementType.AJUSTE &&
        detail.adjustmentDirection
      ) {
        throw new BadRequestException(
          `La dirección del ajuste solo puede enviarse cuando el tipo sea AJUSTE.`,
        );
      }
    }
  }

  private getConceptField(
    concepto: MovementConcept,
  ) {
    const map = {
      [MovementConcept.SALUD]:
        'valorSalud',

      [MovementConcept.PENSION]:
        'valorPension',

      [MovementConcept.CUOTA_MONETARIA]:
        'valorCuotaMonetaria',

      [MovementConcept.TRANSFERENCIA_ECONOMICA]:
        'valorTransferenciaEconomica',

      [MovementConcept.BONO_ALIMENTACION]:
        'valorBonoAlimentacion',

      [MovementConcept.BENEFICIOS_ECONOMICOS_488]:
        'valorBeneficiosEconomicos488',
    } as const;

    return map[concepto];
  }

  private calculateNewBalance(params: {
    tipo: MovementType;
    valor: number;
    saldoActual: number;
    adjustmentDirection?:
      AdjustmentDirection;
  }) {
    const {
      tipo,
      valor,
      saldoActual,
      adjustmentDirection,
    } = params;

    switch (tipo) {
      case MovementType.SALDO_INICIAL:
        return saldoActual + valor;

      case MovementType.INCREMENTO:
        return saldoActual + valor;

      case MovementType.REINTEGRO:
        if (valor > saldoActual) {
          throw new BadRequestException(
            'El reintegro no puede ser mayor al saldo disponible.',
          );
        }

        return saldoActual - valor;

      case MovementType.NO_PROCEDE:
        if (saldoActual <= 0) {
          throw new BadRequestException(
            'No hay saldo disponible para aplicar NO_PROCEDE.',
          );
        }

        return 0;

      case MovementType.AJUSTE:
        if (!adjustmentDirection) {
          throw new BadRequestException(
            'El ajuste requiere adjustmentDirection: SUMA o RESTA.',
          );
        }

        if (
          adjustmentDirection ===
          AdjustmentDirection.SUMA
        ) {
          return saldoActual + valor;
        }

        if (valor > saldoActual) {
          throw new BadRequestException(
            'El ajuste en resta no puede ser mayor al saldo disponible.',
          );
        }

        return saldoActual - valor;

      default:
        throw new BadRequestException(
          'Tipo de movimiento inválido.',
        );
    }
  }
}