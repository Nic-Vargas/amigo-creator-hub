-- AlterTable
ALTER TABLE "CaseConceptExclusion" ADD COLUMN     "saldoInicialImportado" DECIMAL(18,2),
ALTER COLUMN "montoOriginal" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RecobroCase" ADD COLUMN     "originalRecobroBeneficiosEconomicos488" DECIMAL(18,2),
ADD COLUMN     "originalRecobroBonoAlimentacion" DECIMAL(18,2),
ADD COLUMN     "originalRecobroCuotaMonetaria" DECIMAL(18,2),
ADD COLUMN     "originalRecobroPension" DECIMAL(18,2),
ADD COLUMN     "originalRecobroSalud" DECIMAL(18,2),
ADD COLUMN     "originalRecobroTransferenciaEconomica" DECIMAL(18,2);
