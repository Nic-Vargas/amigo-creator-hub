import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { CurrentUserPayload } from '../common/interfaces/current-user.interface';

@Injectable()
export class BeneficiariesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: CurrentUserPayload) {
    return this.prisma.beneficiary.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiario no encontrado.');
    }

    return beneficiary;
  }

  async create(dto: CreateBeneficiaryDto, user: CurrentUserPayload) {
    const exists = await this.prisma.beneficiary.findUnique({
      where: {
        companyId_tipoDocumento_documento: {
          companyId: user.companyId,
          tipoDocumento: dto.tipoDocumento,
          documento: dto.documento,
        },
      },
    });

    if (exists) {
      throw new ConflictException(
        'Ya existe un beneficiario con ese tipo y número de documento.',
      );
    }

    return this.prisma.beneficiary.create({
      data: {
        companyId: user.companyId,
        tipoDocumento: dto.tipoDocumento,
        documento: dto.documento,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        email: dto.email ?? null,
        celular: dto.celular ?? null,
        telefono: dto.telefono ?? null,
        direccion: dto.direccion ?? null,
        ciudad: dto.ciudad ?? null,
        municipio: dto.municipio ?? null,
        departamento: dto.departamento ?? null,
        estado: 'ACTIVO',
        saldoTotal: 0,
      },
    });
  }

  async update(id: string, dto: UpdateBeneficiaryDto, user: CurrentUserPayload) {
    await this.findOne(id, user);

    if (dto.tipoDocumento || dto.documento) {
      const current = await this.prisma.beneficiary.findFirst({
        where: {
          id,
          companyId: user.companyId,
        },
      });

      const nextTipoDocumento = dto.tipoDocumento ?? current!.tipoDocumento;
      const nextDocumento = dto.documento ?? current!.documento;

      const duplicate = await this.prisma.beneficiary.findUnique({
        where: {
          companyId_tipoDocumento_documento: {
            companyId: user.companyId,
            tipoDocumento: nextTipoDocumento,
            documento: nextDocumento,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          'Ya existe otro beneficiario con ese tipo y número de documento.',
        );
      }
    }

    return this.prisma.beneficiary.update({
      where: {
        id,
      },
      data: {
        tipoDocumento: dto.tipoDocumento,
        documento: dto.documento,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        email: dto.email,
        celular: dto.celular,
        telefono: dto.telefono,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        municipio: dto.municipio,
        departamento: dto.departamento,
      },
    });
  }
}