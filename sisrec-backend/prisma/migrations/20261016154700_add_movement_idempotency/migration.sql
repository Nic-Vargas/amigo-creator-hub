/*
  Warnings:

  - A unique constraint covering the columns `[companyId,idempotencyKey]` on the table `Movement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Movement" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Movement_companyId_idempotencyKey_key" ON "Movement"("companyId", "idempotencyKey");
