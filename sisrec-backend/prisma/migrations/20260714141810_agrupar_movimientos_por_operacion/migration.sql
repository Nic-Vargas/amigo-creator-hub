/*
  Warnings:

  - You are about to drop the column `adjustmentDirection` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `concepto` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `saldoAnteriorConcepto` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `saldoNuevoConcepto` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `Movement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Movement" DROP COLUMN "adjustmentDirection",
DROP COLUMN "concepto",
DROP COLUMN "saldoAnteriorConcepto",
DROP COLUMN "saldoNuevoConcepto",
DROP COLUMN "tipo",
DROP COLUMN "valor";

-- CreateTable
CREATE TABLE "MovementDetail" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "tipo" "MovementType" NOT NULL,
    "concepto" "MovementConcept" NOT NULL,
    "adjustmentDirection" "AdjustmentDirection",
    "valor" DECIMAL(18,2) NOT NULL,
    "saldoAnteriorConcepto" DECIMAL(18,2) NOT NULL,
    "saldoNuevoConcepto" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovementDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovementDetail_movementId_idx" ON "MovementDetail"("movementId");

-- CreateIndex
CREATE INDEX "MovementDetail_concepto_idx" ON "MovementDetail"("concepto");

-- AddForeignKey
ALTER TABLE "MovementDetail" ADD CONSTRAINT "MovementDetail_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
