import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CaseStatus } from '../../generated/prisma/enums.js';

export class UpdateRecobroStatusDto {
  @ApiProperty({
    example: 'EN_GESTION',
    description: 'Nuevo estado del caso de recobro',
    enum: CaseStatus,
  })
  @IsEnum(CaseStatus)
  estado!: CaseStatus;
}