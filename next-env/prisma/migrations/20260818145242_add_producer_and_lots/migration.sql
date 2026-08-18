-- CreateEnum
CREATE TYPE "AccreditationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('DRAFT', 'MINTED');

-- CreateTable
CREATE TABLE "Producer" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "status" "AccreditationStatus" NOT NULL DEFAULT 'PENDING',
    "companyName" TEXT NOT NULL,
    "legalForm" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "apeCode" TEXT NOT NULL,
    "representativeName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'DRAFT',
    "ref" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cid" TEXT,
    "idLot" BIGINT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotItem" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "LotItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Producer_account_key" ON "Producer"("account");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_siret_key" ON "Producer"("siret");

-- CreateIndex
CREATE INDEX "Producer_status_idx" ON "Producer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_idLot_key" ON "Lot"("idLot");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_txHash_key" ON "Lot"("txHash");

-- CreateIndex
CREATE INDEX "Lot_status_idx" ON "Lot"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_producerId_ref_key" ON "Lot"("producerId", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "LotItem_lotId_index_key" ON "LotItem"("lotId", "index");

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotItem" ADD CONSTRAINT "LotItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
