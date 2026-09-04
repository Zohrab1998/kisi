import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { finalizePaymentSuccess, markPaymentFailed } from "@/lib/billing";
import { verifyIdramChecksum } from "@/lib/payments/idram";

/**
 * ⚠️ UNVERIFIED SCAFFOLD — field names and the precheck/confirm handshake
 * below follow Idram's historically-documented "EDP_*" flow, but this has
 * not been tested against a live Idram merchant account. Confirm every
 * field name and the exact response Idram expects against the integration
 * guide they provide when you sign the merchant agreement, then update
 * this handler (and src/lib/payments/idram.ts) to match.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const billNo = String(form.get("EDP_BILL_NO") ?? ""); // our Payment.id
  const amount = String(form.get("EDP_AMOUNT") ?? "");
  const payerAccount = String(form.get("EDP_PAYER_ACCOUNT") ?? "");
  const transId = String(form.get("EDP_TRANS_ID") ?? "");
  const checksum = String(form.get("EDP_CHECKSUM") ?? "");
  const isPrecheck = form.get("EDP_PRECHECK") === "YES";

  if (!billNo) {
    return new Response("FAIL", { status: 400 });
  }

  const payment = await db.payment.findUnique({ where: { id: billNo } });
  if (!payment) {
    return new Response("FAIL", { status: 404 });
  }

  if (isPrecheck) {
    // Idram checks the order is still payable before showing the checkout.
    const valid = payment.status === "PENDING" && String(payment.totalAmd) === amount;
    return new Response(valid ? "OK" : "FAIL");
  }

  const validChecksum = verifyIdramChecksum({
    billNo,
    amountAmd: amount,
    payerAccount,
    checksum,
  });

  if (!validChecksum) {
    await markPaymentFailed(payment.id, "Checksum verification failed");
    return new Response("FAIL", { status: 400 });
  }

  await finalizePaymentSuccess(payment.id, transId);
  return new Response("OK");
}

export async function GET() {
  return NextResponse.json({ ok: true, note: "Idram webhook endpoint — expects POST" });
}
