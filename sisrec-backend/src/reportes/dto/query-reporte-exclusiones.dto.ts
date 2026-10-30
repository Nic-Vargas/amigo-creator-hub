import { IsEnum, IsOptional, Matches } from 'class-validator';
import { MovementConcept, MovementReason } from '../../generated/prisma/enums.js';

export class QueryReporteExclusionesDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'desde debe tener formato YYYY-MM-DD' })
  desde?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'hasta debe tener formato YYYY-MM-DD' })
  hasta?: string;

  @IsOptional()
  @IsEnum(MovementConcept)
  concepto?: MovementConcept;

  @IsOptional()
  @IsEnum(MovementReason)
  motivo?: MovementReason;
}
