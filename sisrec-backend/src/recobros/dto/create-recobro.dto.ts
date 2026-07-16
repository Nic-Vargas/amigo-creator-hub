import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Priority } from '../../generated/prisma/enums.js';

export class CreateRecobroDto {
  @ApiProperty({
    example: 'cmqgpiew50000b0vrs8ihm3e3',
    description: 'ID del beneficiario al que pertenece el caso de recobro',
  })
  @IsString()
  @IsNotEmpty()
  beneficiaryId!: string;

  @ApiProperty({
    example: '1636',
    description: 'Ley asociada al recobro',
  })
  @IsString()
  @IsNotEmpty()
  ley!: string;

  @ApiProperty({
    example: '2026-05',
    description: 'Periodo del recobro en formato YYYY-MM',
  })
  @Matches(/^\d{4}-\d{2}$/)
  periodo!: string;

  @ApiProperty({
    example: 100000,
    description: 'Saldo inicial del concepto salud',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorSalud!: number;

  @ApiProperty({
    example: 50000,
    description: 'Saldo inicial del concepto pensión',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorPension!: number;

  @ApiProperty({
    example: 25000,
    description: 'Saldo inicial del concepto cuota monetaria',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorCuotaMonetaria!: number;

  @ApiProperty({
    example: 0,
    description: 'Saldo inicial del concepto transferencia económica',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorTransferenciaEconomica!: number;

  @ApiProperty({
    example: 0,
    description: 'Saldo inicial del concepto bono de alimentación',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorBonoAlimentacion!: number;

  @ApiProperty({
    example: 0,
    description: 'Saldo inicial del concepto beneficios económicos 488',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorBeneficiosEconomicos488!: number;

  @ApiPropertyOptional({
    example: 'MEDIA',
    description: 'Prioridad del caso de recobro',
    enum: Priority,
  })
  @IsOptional()
  @IsEnum(Priority)
  prioridad?: Priority;
}