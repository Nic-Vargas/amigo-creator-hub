-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CARTERA', 'AUDITOR');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('ABIERTO', 'EN_GESTION', 'ACUERDO', 'EN_PAGO', 'CERRADO');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('SALDO_INICIAL', 'INCREMENTO', 'REINTEGRO', 'NO_PROCEDE', 'AJUSTE');

-- CreateEnum
CREATE TYPE "MovementConcept" AS ENUM ('SALUD', 'PENSION', 'CUOTA_MONETARIA', 'TRANSFERENCIA_ECONOMICA');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "AdjustmentDirection" AS ENUM ('SUMA', 'RESTA');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT,
    "celular" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "municipio" TEXT,
    "departamento" TEXT,
    "estado" TEXT,
    "saldoTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecobroCase" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "ley" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "valorSalud" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorPension" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorCuotaMonetaria" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorTransferenciaEconomica" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estado" "CaseStatus" NOT NULL DEFAULT 'ABIERTO',
    "prioridad" "Priority" NOT NULL DEFAULT 'MEDIA',
    "responsableUserId" TEXT,
    "ultimaGestionAt" TIMESTAMP(3),
    "fechaApertura" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecobroCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "recobroCaseId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "MovementType" NOT NULL,
    "concepto" "MovementConcept" NOT NULL,
    "adjustmentDirection" "AdjustmentDirection",
    "valor" DECIMAL(18,2) NOT NULL,
    "descripcion" TEXT,
    "saldoAnteriorConcepto" DECIMAL(18,2) NOT NULL,
    "saldoNuevoConcepto" DECIMAL(18,2) NOT NULL,
    "caseTotalAnterior" DECIMAL(18,2) NOT NULL,
    "caseTotalNuevo" DECIMAL(18,2) NOT NULL,
    "beneficiaryTotalAnterior" DECIMAL(18,2) NOT NULL,
    "beneficiaryTotalNuevo" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyId_email_key" ON "User"("companyId", "email");

-- CreateIndex
CREATE INDEX "Beneficiary_companyId_idx" ON "Beneficiary"("companyId");

-- CreateIndex
CREATE INDEX "Beneficiary_companyId_documento_idx" ON "Beneficiary"("companyId", "documento");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_companyId_tipoDocumento_documento_key" ON "Beneficiary"("companyId", "tipoDocumento", "documento");

-- CreateIndex
CREATE INDEX "RecobroCase_companyId_idx" ON "RecobroCase"("companyId");

-- CreateIndex
CREATE INDEX "RecobroCase_companyId_beneficiaryId_idx" ON "RecobroCase"("companyId", "beneficiaryId");

-- CreateIndex
CREATE INDEX "RecobroCase_companyId_estado_idx" ON "RecobroCase"("companyId", "estado");

-- CreateIndex
CREATE INDEX "RecobroCase_companyId_periodo_idx" ON "RecobroCase"("companyId", "periodo");

-- CreateIndex
CREATE INDEX "Movement_companyId_idx" ON "Movement"("companyId");

-- CreateIndex
CREATE INDEX "Movement_companyId_recobroCaseId_idx" ON "Movement"("companyId", "recobroCaseId");

-- CreateIndex
CREATE INDEX "Movement_companyId_beneficiaryId_idx" ON "Movement"("companyId", "beneficiaryId");

-- CreateIndex
CREATE INDEX "Movement_companyId_createdAt_idx" ON "Movement"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecobroCase" ADD CONSTRAINT "RecobroCase_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecobroCase" ADD CONSTRAINT "RecobroCase_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecobroCase" ADD CONSTRAINT "RecobroCase_responsableUserId_fkey" FOREIGN KEY ("responsableUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_recobroCaseId_fkey" FOREIGN KEY ("recobroCaseId") REFERENCES "RecobroCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
