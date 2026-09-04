"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { billTotals } from "@/lib/billing";
import { billItemRemainingAmd } from "@/lib/billing";
import { finalizePaymentSuccess } from "@/lib/billing";
import { feeForTotal } from "@/lib/billing";
import { calcServiceFee, formatAmd } from "@/lib/money";
import { getPaymentProviderAsync } from "@/lib/payments";
import { getBaseUrl } from "@/lib/url";

const shareSchema = z.discriminatedUnion("kind", [
  z.object({ billItemId: z.string(), kind: z.literal("quantity"), quantity: z.number().int().positive() }),
  z.object({ billItemId: z.string(), kind: z.literal("amount"), amdAmount: z.number().int().positive() }),
]);

const payInputSchema = z.object({
  qrToken: z.string().min(1),
  method: z.enum(["IDRAM_WALLET", "CARD"]),
  payerName: z.string().trim().max(60).optional(),
  tipAmd: z.coerce.number().int().min(0).max(1_000_000),
  selection:
    z.discriminatedUnion("mode", [
      z.object({
        mode: z.literal("items"),
        shares: z.array(shareSchema).min(1),
      }),
      z.object({
        mode: z.literal("split"),
        ways: z.coerce.number().int().min(1).max(50),
      }),
    ]),
});

export type PayInput = z.infer<typeof payInputSchema>;

export async function createPaymentAction(
  raw: PayInput
): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const parsed = payInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }
  const input = parsed.data;

  const table = await db.table.findUnique({
    where: { qrToken: input.qrToken },
    include: { business: true },
  });
  if (!table) return { ok: false, error: "Table not found" };

  const bill = await db.bill.findFirst({
    where: { tableId: table.id, status: "OPEN" },
    include: { items: true, payments: true },
  });
  if (!bill) return { ok: false, error: "No open bill for this table" };

  const { remainingAmd } = billTotals(bill);
  if (remainingAmd <= 0) return { ok: false, error: "This bill is already fully paid" };

  let itemsAmountAmd = 0;
  const itemShares: { billItemId: string; amdAmount: number }[] = [];

  if (input.selection.mode === "items") {
    for (const share of input.selection.shares) {
      const item = bill.items.find((i) => i.id === share.billItemId);
      if (!item) return { ok: false, error: "Item not found on this bill" };

      const itemRemainingAmd = billItemRemainingAmd(item);
      const shareAmd = share.kind === "quantity" ? item.unitPriceAmd * share.quantity : share.amdAmount;

      if (shareAmd <= 0 || shareAmd > itemRemainingAmd) {
        return { ok: false, error: `Only ${formatAmd(itemRemainingAmd)} left to pay on "${item.name}"` };
      }
      itemsAmountAmd += shareAmd;
      itemShares.push({ billItemId: item.id, amdAmount: shareAmd });
    }
  } else {
    itemsAmountAmd = Math.min(Math.ceil(remainingAmd / input.selection.ways), remainingAmd);
  }

  if (itemsAmountAmd <= 0 || itemsAmountAmd > remainingAmd) {
    return { ok: false, error: "Invalid amount" };
  }

  const serviceFeeAmd = calcServiceFee(itemsAmountAmd, table.business.serviceFeePercent);
  const totalAmd = itemsAmountAmd + serviceFeeAmd + input.tipAmd;
  const platformFeeAmd = feeForTotal(totalAmd, table.business.feePercent);

  const payment = await db.payment.create({
    data: {
      billId: bill.id,
      itemsAmountAmd,
      serviceFeeAmd,
      tipAmountAmd: input.tipAmd,
      totalAmd,
      platformFeeAmd,
      method: input.method,
      payerName: input.payerName || null,
      itemShares: itemShares.length
        ? { create: itemShares.map((s) => ({ billItemId: s.billItemId, amdAmount: s.amdAmount })) }
        : undefined,
    },
  });

  const baseUrl = await getBaseUrl();
  const returnUrl = `${baseUrl}/pay/${input.qrToken}/receipt/${payment.id}`;

  const provider = await getPaymentProviderAsync();
  const result = await provider.createPayment({
    paymentId: payment.id,
    amountAmd: totalAmd,
    description: `${table.business.name} — ${table.name}`,
    returnUrl,
  });

  if (result.kind === "succeeded") {
    await finalizePaymentSuccess(payment.id, result.providerTransactionId);
    return { ok: true, redirectUrl: returnUrl };
  }

  return { ok: true, redirectUrl: result.url };
}
