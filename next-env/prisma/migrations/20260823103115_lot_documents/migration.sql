-- CreateTable
CREATE TABLE "LotDocument" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "cid" TEXT NOT NULL,
    "pinataId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LotDocument_itemId_key" ON "LotDocument"("itemId");

-- CreateIndex
CREATE INDEX "LotDocument_lotId_idx" ON "LotDocument"("lotId");

-- AddForeignKey
ALTER TABLE "LotDocument" ADD CONSTRAINT "LotDocument_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDocument" ADD CONSTRAINT "LotDocument_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LotItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
