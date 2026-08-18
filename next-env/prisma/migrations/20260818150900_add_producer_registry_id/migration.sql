-- AlterTable
ALTER TABLE "Producer" ADD COLUMN     "registryId" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "Producer_registryId_key" ON "Producer"("registryId");

