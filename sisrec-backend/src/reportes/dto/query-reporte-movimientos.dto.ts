import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  MovementConcept,
  MovementType,
} from '../../generated/prisma/enums.js';

export class QueryReporteMovimientosDto {
  @IsOptional()
  @IsEnum(MovementType)
  tipo?: MovementType;

  @IsOptional()
  @IsEnum(MovementConcept)
  concepto?: MovementConcept;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  recobroCaseId?: string;
}