-- CreateTable
CREATE TABLE "CaseConceptExclusion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "recobroCaseId" TEXT NOT NULL,
    "concepto" "MovementConcept" NOT NULL,
    "motivo" "MovementReason" NOT NULL,
    "movementDetailId" TEXT NOT NULL,
    "montoOriginal" DECIMAL(18,2) NOT NULL,
    "saldoAntes" DECIMAL(18,2) NOT NULL,
    "valorExcluido" DECIMAL(18,2) NOT NULL,
    "saldoDespues" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "fechaExclusion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseConceptExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseConceptExclusion_movementDetailId_key" ON "CaseConceptExclusion"("movementDetailId");

-- CreateIndex
CREATE INDEX "CaseConceptExclusion_companyId_fechaExclusion_idx" ON "CaseConceptExclusion"("companyId", "fechaExclusion");

-- CreateIndex
CREATE INDEX "CaseConceptExclusion_companyId_recobroCaseId_idx" ON "CaseConceptExclusion"("companyId", "recobroCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseConceptExclusion_recobroCaseId_concepto_key" ON "CaseConceptExclusion"("recobroCaseId", "concepto");

-- AddForeignKey
ALTER TABLE "CaseConceptExclusion" ADD CONSTRAINT "CaseConceptExclusion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseConceptExclusion" ADD CONSTRAINT "CaseConceptExclusion_recobroCaseId_fkey" FOREIGN KEY ("recobroCaseId") REFERENCES "RecobroCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseConceptExclusion" ADD CONSTRAINT "CaseConceptExclusion_movementDetailId_fkey" FOREIGN KEY ("movementDetailId") REFERENCES "MovementDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
