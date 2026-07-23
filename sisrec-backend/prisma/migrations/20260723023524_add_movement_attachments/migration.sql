-- CreateTable
CREATE TABLE "MovementAttachment" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovementAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovementAttachment_movementId_idx" ON "MovementAttachment"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "MovementAttachment_storagePath_key" ON "MovementAttachment"("storagePath");

-- AddForeignKey
ALTER TABLE "MovementAttachment" ADD CONSTRAINT "MovementAttachment_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
