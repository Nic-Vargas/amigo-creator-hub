import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { CaseStatus } from '../../generated/prisma/enums.js';

export class QueryReporteCarteraDto {
  @IsOptional()
  @IsEnum(CaseStatus)
  estado?: CaseStatus;

  @IsOptional()
  @IsString()
  ley?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  periodo?: string;

  @IsOptional()
  @IsString()
  documento?: string;
}