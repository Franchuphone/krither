ALTER TABLE "Lot" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

-- Existing lots were minted with the sum of their items as the lot token's
-- quantity, so that sum is what their declared quantity has to be.
UPDATE "Lot"
SET "quantity" = COALESCE(
    (SELECT SUM("quantity") FROM "LotItem" WHERE "LotItem"."lotId" = "Lot"."id"),
    1
);

ALTER TABLE "Lot" ALTER COLUMN "quantity" DROP DEFAULT;
