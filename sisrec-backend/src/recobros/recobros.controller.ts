import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';
import { RecobrosService } from './recobros.service';
import { CreateRecobroDto } from './dto/create-recobro.dto';
import { UpdateRecobroDto } from './dto/update-recobro.dto';
import { UpdateRecobroStatusDto } from './dto/update-recobro-status.dto';

@ApiTags('Recobros')
@ApiBearerAuth()
@Controller('recobros')
@UseGuards(JwtAuthGuard)
export class RecobrosController {
  constructor(private readonly recobrosService: RecobrosService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar casos de recobro',
    description:
      'Retorna los casos de recobro asociados a la empresa del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de casos de recobro obtenido correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, vencido o no enviado.',
  })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.recobrosService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar caso de recobro por ID',
    description:
      'Retorna un caso de recobro específico con beneficiario y movimientos asociados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del caso de recobro',
    example: 'cmqgqc2zw0000rcvrdpe1shz5',
  })
  @ApiResponse({
    status: 200,
    description: 'Caso de recobro encontrado correctamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso de recobro no encontrado.',
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recobrosService.findOne(id, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear caso de recobro',
    description:
      'Crea un caso de recobro para un beneficiario. El backend calcula automáticamente el valorTotal.',
  })
  @ApiBody({
    type: CreateRecobroDto,
    examples: {
      casoFosfec: {
        summary: 'Caso FOSFEC demo',
        value: {
          beneficiaryId: 'cmqgpiew50000b0vrs8ihm3e3',
          ley: '1636',
          periodo: '2026-05',
          valorSalud: 100000,
          valorPension: 50000,
          valorCuotaMonetaria: 25000,
          valorTransferenciaEconomica: 0,
          prioridad: 'MEDIA',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Caso de recobro creado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o valor total menor o igual a cero.',
  })
  @ApiResponse({
    status: 404,
    description: 'Beneficiario no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un caso para este beneficiario, ley y periodo.',
  })
  create(
    @Body() dto: CreateRecobroDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recobrosService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar datos básicos del caso',
    description:
      'Actualiza campos no financieros del caso, como ley, periodo o prioridad. No modifica saldos.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del caso de recobro',
    example: 'cmqgqc2zw0000rcvrdpe1shz5',
  })
  @ApiBody({
    type: UpdateRecobroDto,
    examples: {
      actualizarPrioridad: {
        summary: 'Actualizar prioridad del caso',
        value: {
          prioridad: 'ALTA',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Caso de recobro actualizado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede modificar un caso cerrado o datos inválidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso de recobro no encontrado.',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecobroDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recobrosService.update(id, dto, user);
  }

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Cambiar estado del caso de recobro',
    description:
      'Actualiza el estado del caso validando las transiciones permitidas.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del caso de recobro',
    example: 'cmqgqc2zw0000rcvrdpe1shz5',
  })
  @ApiBody({
    type: UpdateRecobroStatusDto,
    examples: {
      pasarAGestion: {
        summary: 'Pasar caso a gestión',
        value: {
          estado: 'EN_GESTION',
        },
      },
      cerrarCaso: {
        summary: 'Cerrar caso',
        value: {
          estado: 'CERRADO',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del caso actualizado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado no permitida.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso de recobro no encontrado.',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRecobroStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recobrosService.updateStatus(id, dto, user);
  }
}