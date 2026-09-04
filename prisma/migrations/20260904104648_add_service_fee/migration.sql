-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "feePercent" REAL NOT NULL DEFAULT 2.0,
    "serviceFeePercent" REAL NOT NULL DEFAULT 0,
    "orderingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "idramMerchantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Business" ("createdAt", "email", "feePercent", "id", "idramMerchantId", "name", "orderingEnabled", "passwordHash") SELECT "createdAt", "email", "feePercent", "id", "idramMerchantId", "name", "orderingEnabled", "passwordHash" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_email_key" ON "Business"("email");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "itemsAmountAmd" INTEGER NOT NULL,
    "serviceFeeAmd" INTEGER NOT NULL DEFAULT 0,
    "tipAmountAmd" INTEGER NOT NULL DEFAULT 0,
    "totalAmd" INTEGER NOT NULL,
    "platformFeeAmd" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payerName" TEXT,
    "idramTransactionId" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("billId", "createdAt", "failureReason", "id", "idramTransactionId", "itemsAmountAmd", "method", "payerName", "platformFeeAmd", "status", "tipAmountAmd", "totalAmd", "updatedAt") SELECT "billId", "createdAt", "failureReason", "id", "idramTransactionId", "itemsAmountAmd", "method", "payerName", "platformFeeAmd", "status", "tipAmountAmd", "totalAmd", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
