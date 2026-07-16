import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AdjustmentDirection,
  MovementConcept,
  MovementType,
} from '../../generated/prisma/enums.js';

export class CreateMovementDetailDto {
  @ApiProperty({
    example: 'REINTEGRO',
    description: 'Tipo de movimiento aplicado al concepto',
    enum: MovementType,
  })
  @IsEnum(MovementType)
  tipo!: MovementType;

  @ApiProperty({
    example: 'SALUD',
    description: 'Concepto financiero afectado',
    enum: MovementConcept,
  })
  @IsEnum(MovementConcept)
  concepto!: MovementConcept;

  @ApiProperty({
    example: 50000,
    description:
      'Valor aplicado al concepto. Para NO_PROCEDE puede enviarse 0.',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valor!: number;

  @ApiPropertyOptional({
    example: 'RESTA',
    description:
      'Dirección del ajuste. Es obligatoria cuando el tipo es AJUSTE.',
    enum: AdjustmentDirection,
  })
  @IsOptional()
  @IsEnum(AdjustmentDirection)
  adjustmentDirection?: AdjustmentDirection;
}

export class CreateMovementDto {
  @ApiProperty({
    example: 'cmqgqc2zw0000rcvrdpe1shz5',
    description:
      'ID del caso de recobro sobre el cual se registra la operación',
  })
  @IsString()
  @IsNotEmpty()
  recobroCaseId!: string;

  @ApiProperty({
    type: [CreateMovementDetailDto],
    description:
      'Conceptos afectados dentro de la misma operación financiera',
    example: [
      {
        tipo: 'REINTEGRO',
        concepto: 'SALUD',
        valor: 50000,
      },
      {
        tipo: 'REINTEGRO',
        concepto: 'PENSION',
        valor: 30000,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMovementDetailDto)
  detalles!: CreateMovementDetailDto[];

  @ApiPropertyOptional({
    example: 'Pago identificado en banco',
    description:
      'Descripción u observación general de la operación financiera',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}