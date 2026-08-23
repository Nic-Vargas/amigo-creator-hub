BEGIN;

-- 1. Crear el nuevo enum
CREATE TYPE "UserRole_new" AS ENUM ('OWNER', 'ADMIN', 'USER');

-- 2. Convertir temporalmente la columna a texto
ALTER TABLE "User"
ALTER COLUMN "role"
TYPE TEXT
USING ("role"::text);

-- 3. Migrar los roles existentes
UPDATE "User"
SET "role" = 'OWNER'
WHERE "role" = 'ADMIN';

UPDATE "User"
SET "role" = 'ADMIN'
WHERE "role" = 'CARTERA';

UPDATE "User"
SET "role" = 'USER'
WHERE "role" = 'AUDITOR';

-- 4. Convertir la columna al nuevo enum
ALTER TABLE "User"
ALTER COLUMN "role"
TYPE "UserRole_new"
USING ("role"::"UserRole_new");

-- 5. Reemplazar el enum anterior
DROP TYPE "UserRole";

ALTER TYPE "UserRole_new"
RENAME TO "UserRole";

COMMIT;