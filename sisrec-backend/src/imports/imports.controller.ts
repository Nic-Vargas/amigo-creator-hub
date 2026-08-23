import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ImportsService } from './imports.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../generated/prisma/enums.js';

type UploadedExcelFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

@ApiTags('Importaciones')
@ApiBearerAuth()
@Controller('imports')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ImportsController {
  constructor(
    private readonly importsService: ImportsService,
  ) {}

  @Post('recobros')
  @Roles(UserRole.OWNER)
  @UseInterceptors(
    FileInterceptor('file'),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importar cartera de recobros',
    description:
      'Importa beneficiarios, casos y saldos iniciales desde un archivo Excel. Solo disponible para usuarios OWNER.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Archivo procesado e importado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Archivo inválido, estructura incorrecta o datos incompletos.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Token inválido, vencido o no enviado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'El usuario autenticado no tiene permisos para importar cartera.',
  })
  async importRecobros(
    @UploadedFile()
    file: UploadedExcelFile,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Debes cargar un archivo Excel.',
      );
    }

    return this.importsService.importRecobrosFromExcel(
      file,
    );
  }
}