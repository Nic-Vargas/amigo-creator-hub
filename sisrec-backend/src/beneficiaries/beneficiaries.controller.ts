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
import type { CurrentUserPayload } from '../common/interfaces/current-user.interface';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Beneficiarios')
@ApiBearerAuth()
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar beneficiarios',
    description: 'Retorna el listado de beneficiarios asociados a la empresa del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de beneficiarios obtenido correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, vencido o no enviado.',
  })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.beneficiariesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar beneficiario por ID',
    description: 'Retorna un beneficiario específico siempre que pertenezca a la empresa del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del beneficiario',
    example: 'cmqgpiew50000b0vrs8ihm3e3',
  })
  @ApiResponse({
    status: 200,
    description: 'Beneficiario encontrado correctamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Beneficiario no encontrado.',
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.beneficiariesService.findOne(id, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear beneficiario',
    description: 'Crea un nuevo beneficiario dentro de la empresa del usuario autenticado.',
  })
  @ApiBody({
    type: CreateBeneficiaryDto,
    examples: {
      beneficiarioDemo: {
        summary: 'Beneficiario demo',
        value: {
          tipoDocumento: 'CC',
          documento: '123456789',
          nombres: 'Juan',
          apellidos: 'Pérez',
          email: 'juan@example.com',
          celular: '3001234567',
          ciudad: 'Bogotá',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Beneficiario creado correctamente.',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un beneficiario con ese tipo y número de documento.',
  })
  create(
    @Body() dto: CreateBeneficiaryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.beneficiariesService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar beneficiario',
    description: 'Actualiza los datos básicos de un beneficiario existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del beneficiario',
    example: 'cmqgpiew50000b0vrs8ihm3e3',
  })
  @ApiBody({
    type: UpdateBeneficiaryDto,
    examples: {
      actualizarContacto: {
        summary: 'Actualizar datos de contacto',
        value: {
          celular: '3119998888',
          ciudad: 'Medellín',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Beneficiario actualizado correctamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Beneficiario no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe otro beneficiario con ese tipo y número de documento.',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.beneficiariesService.update(id, dto, user);
  }
}