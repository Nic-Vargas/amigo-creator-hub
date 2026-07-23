import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { FilesInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';

import { MovimientosService } from './movimientos.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@ApiTags('Movimientos')
@ApiBearerAuth()
@Controller('movimientos')
@UseGuards(JwtAuthGuard)
export class MovimientosController {
  constructor(
    private readonly movimientosService: MovimientosService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar movimientos',
    description:
      'Retorna el historial de movimientos financieros y sus comprobantes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Movimientos obtenidos correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, vencido o no enviado.',
  })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.movimientosService.findAll(user);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 6, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (
        _request,
        file,
        callback,
      ) => {
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Solo se permiten archivos PDF, JPG, JPEG o PNG.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  @ApiConsumes(
    'multipart/form-data',
    'application/json',
  )
  @ApiOperation({
    summary: 'Registrar movimiento',
    description:
      'Registra una novedad financiera, recalcula los saldos y almacena sus comprobantes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description:
            'Información del movimiento serializada como JSON.',
          example: JSON.stringify({
            recobroCaseId:
              'cmqgqc2zw0000rcvrdpe1shz5',
            detalles: [
              {
                tipo: 'REINTEGRO',
                concepto: 'SALUD',
                valor: 50000,
              },
            ],
            descripcion:
              'Pago identificado en banco',
          }),
        },

        files: {
          type: 'array',
          description:
            'Comprobantes PDF, JPG, JPEG o PNG.',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['data'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Movimiento y comprobantes registrados correctamente.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, archivo no permitido, saldo insuficiente o movimiento no permitido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso de recobro no encontrado.',
  })
  create(
    @Body()
    body:
      | CreateMovementDto
      | {
          data?: string;
        },

    @UploadedFiles()
    files: Express.Multer.File[] = [],

    @CurrentUser()
    user: CurrentUserPayload,
  ) {
    const dto = this.parseMovementBody(body);

    return this.movimientosService.create(
      dto,
      user,
      files,
    );
  }

  private parseMovementBody(
    body:
      | CreateMovementDto
      | {
          data?: string;
        },
  ): CreateMovementDto {
    const multipartData =
      'data' in body ? body.data : undefined;

    if (!multipartData) {
      return body as CreateMovementDto;
    }

    try {
      return JSON.parse(
        multipartData,
      ) as CreateMovementDto;
    } catch {
      throw new BadRequestException(
        'El campo data no contiene un JSON válido.',
      );
    }
  }
}