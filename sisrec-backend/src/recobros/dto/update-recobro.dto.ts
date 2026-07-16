import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { Priority } from '../../generated/prisma/enums.js';

export class UpdateRecobroDto {
  @ApiPropertyOptional({
    example: '1636',
    description: 'Ley asociada al caso de recobro',
  })
  @IsOptional()
  @IsString()
  ley?: string;

  @ApiPropertyOptional({
    example: '2026-05',
    description: 'Periodo del caso en formato YYYY-MM',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  periodo?: string;

  @ApiPropertyOptional({
    example: 'ALTA',
    description: 'Prioridad del caso',
    enum: Priority,
  })
  @IsOptional()
  @IsEnum(Priority)
  prioridad?: Priority;
}