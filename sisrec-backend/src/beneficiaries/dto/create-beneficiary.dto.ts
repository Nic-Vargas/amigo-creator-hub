import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateBeneficiaryDto {
  @ApiProperty({
    example: 'CC',
    description: 'Tipo de documento del beneficiario',
  })
  @IsString()
  tipoDocumento!: string;

  @ApiProperty({
    example: '123456789',
    description: 'Número de documento del beneficiario',
  })
  @IsString()
  documento!: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombres del beneficiario',
  })
  @IsString()
  nombres!: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellidos del beneficiario',
  })
  @IsString()
  apellidos!: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '3001234567',
    description: 'Número celular',
    required: false,
  })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiProperty({
    example: '6011234567',
    description: 'Teléfono fijo',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({
    example: 'Calle 100 # 10-20',
    description: 'Dirección de residencia',
    required: false,
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({
    example: 'Bogotá',
    description: 'Ciudad',
    required: false,
  })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiProperty({
    example: 'Bogotá D.C.',
    description: 'Municipio',
    required: false,
  })
  @IsOptional()
  @IsString()
  municipio?: string;

  @ApiProperty({
    example: 'Cundinamarca',
    description: 'Departamento',
    required: false,
  })
  @IsOptional()
  @IsString()
  departamento?: string;
}