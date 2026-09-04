-- Switch bill-item payment tracking from whole-unit counts to AMD amounts,
-- so a customer can pay for part of a single shared item.

-- BillItem: quantityPaid (whole units) -> paidAmd (AMD), backfilled 1:1.
ALTER TABLE "BillItem" ADD COLUMN "paidAmd" INTEGER NOT NULL DEFAULT 0;
UPDATE "BillItem" SET "paidAmd" = "quantityPaid" * "unitPriceAmd";
ALTER TABLE "BillItem" DROP COLUMN "quantityPaid";

-- PaymentItemShare: quantity (whole units) -> amdAmount (AMD), backfilled
-- using the parent BillItem's unit price at the time.
ALTER TABLE "PaymentItemShare" ADD COLUMN "amdAmount" INTEGER NOT NULL DEFAULT 0;
UPDATE "PaymentItemShare"
SET "amdAmount" = (
  SELECT "BillItem"."unitPriceAmd" * "PaymentItemShare"."quantity"
  FROM "BillItem"
  WHERE "BillItem"."id" = "PaymentItemShare"."billItemId"
);
ALTER TABLE "PaymentItemShare" DROP COLUMN "quantity";
