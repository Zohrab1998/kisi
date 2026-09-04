import "server-only";
import { db } from "@/lib/db";
import { calcPlatformFee } from "@/lib/money";
import type { Bill, BillItem, Payment } from "@/generated/prisma/client";

export type BillWithItemsAndPayments = Bill & { items: BillItem[]; payments: Payment[] };

export function billItemRemaining(item: BillItem) {
  return item.quantity - item.quantityPaid;
}

/**
 * The bill's paid amount is the sum of successful payments' item portions
 * (tips don't count against the food/drink total). This is authoritative
 * for "is the bill fully paid" regardless of whether a payment covered
 * specific items or an even split of the remainder — per-item
 * `quantityPaid` is only kept as a best-effort hint for the "pay specific
 * items" UI, so it can lag behind after a split payment.
 */
export function billTotals(bill: BillWithItemsAndPayments) {
  const totalAmd = bill.items.reduce((sum, i) => sum + i.unitPriceAmd * i.quantity, 0);
  const paidAmd = bill.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.itemsAmountAmd, 0);
  return { totalAmd, paidAmd, remainingAmd: Math.max(totalAmd - paidAmd, 0) };
}

/**
 * Marks a payment as succeeded, credits its item shares (if any) against
 * the bill for display purposes, and closes the bill once the total paid
 * amount covers the bill total. Called either synchronously (mock
 * provider) or from the provider's webhook once real money has moved.
 */
export async function finalizePaymentSuccess(
  paymentId: string,
  providerTransactionId: string
) {
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { itemShares: true },
    });

    if (payment.status === "SUCCEEDED") return; // idempotent

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCEEDED", idramTransactionId: providerTransactionId },
    });

    for (const share of payment.itemShares) {
      await tx.billItem.update({
        where: { id: share.billItemId },
        data: { quantityPaid: { increment: share.quantity } },
      });
    }

    const bill = await tx.bill.findUniqueOrThrow({
      where: { id: payment.billId },
      include: { items: true, payments: true },
    });
    const { totalAmd, paidAmd } = billTotals(bill);

    if (paidAmd >= totalAmd) {
      await tx.bill.update({
        where: { id: payment.billId },
        data: { status: "PAID", closedAt: new Date() },
      });
    }
  });
}

export async function markPaymentFailed(paymentId: string, reason: string) {
  await db.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED", failureReason: reason },
  });
}

export function feeForTotal(totalAmd: number, feePercent: number) {
  return calcPlatformFee(totalAmd, feePercent);
}
