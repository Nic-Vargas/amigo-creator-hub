import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar movimientos',
    description:
      'Retorna el historial de movimientos financieros de la empresa del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Movimientos obtenidos correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, vencido o no enviado.',
  })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.movimientosService.findAll(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar movimiento',
    description:
      'Registra una novedad financiera sobre un caso de recobro y recalcula automáticamente los saldos.',
  })
  @ApiBody({
    type: CreateMovementDto,
    examples: {
      reintegro: {
        summary: 'Registrar reintegro',
        value: {
          recobroCaseId: 'cmqgqc2zw0000rcvrdpe1shz5',
          tipo: 'REINTEGRO',
          concepto: 'SALUD',
          valor: 50000,
          descripcion: 'Pago identificado en banco',
        },
      },
      incremento: {
        summary: 'Registrar incremento',
        value: {
          recobroCaseId: 'cmqgqc2zw0000rcvrdpe1shz5',
          tipo: 'INCREMENTO',
          concepto: 'PENSION',
          valor: 20000,
          descripcion: 'Nuevo saldo reportado',
        },
      },
      ajuste: {
        summary: 'Registrar ajuste contable',
        value: {
          recobroCaseId: 'cmqgqc2zw0000rcvrdpe1shz5',
          tipo: 'AJUSTE',
          concepto: 'SALUD',
          valor: 10000,
          adjustmentDirection: 'RESTA',
          descripcion: 'Corrección contable',
        },
      },
      noProcede: {
        summary: 'Registrar no procede',
        value: {
          recobroCaseId: 'cmqgqc2zw0000rcvrdpe1shz5',
          tipo: 'NO_PROCEDE',
          concepto: 'CUOTA_MONETARIA',
          valor: 25000,
          descripcion: 'Giro no efectuado',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Movimiento registrado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, saldo insuficiente o movimiento no permitido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso de recobro no encontrado.',
  })
  create(
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.movimientosService.create(dto, user);
  }
}