-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MovementConcept" ADD VALUE 'BONO_ALIMENTACION';
ALTER TYPE "MovementConcept" ADD VALUE 'BENEFICIOS_ECONOMICOS_488';

-- AlterTable
ALTER TABLE "RecobroCase" ADD COLUMN     "valorBeneficiosEconomicos488" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valorBonoAlimentacion" DECIMAL(18,2) NOT NULL DEFAULT 0;
