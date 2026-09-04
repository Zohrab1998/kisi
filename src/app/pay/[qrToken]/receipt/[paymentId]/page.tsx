import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { billTotals } from "@/lib/billing";
import { formatAmd } from "@/lib/money";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ qrToken: string; paymentId: string }>;
}) {
  const { qrToken, paymentId } = await params;

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { bill: { include: { items: true, payments: true, table: true } } },
  });
  if (!payment) notFound();

  const { remainingAmd } = billTotals(payment.bill);
  const isSucceeded = payment.status === "SUCCEEDED";
  const isPending = payment.status === "PENDING";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10 text-center">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
          isSucceeded
            ? "bg-green-500/15 text-green-400"
            : isPending
              ? "bg-amber-500/15 text-amber-400"
              : "bg-red-500/15 text-red-400"
        }`}
      >
        {isSucceeded ? "✓" : isPending ? "…" : "✕"}
      </div>

      <h1 className="text-xl font-semibold text-white">
        {isSucceeded ? "Payment received" : isPending ? "Confirming payment…" : "Payment failed"}
      </h1>
      <p className="mt-1 text-sm text-neutral-400">{payment.bill.table.name}</p>

      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-400">Items</span>
          <span className="text-white">{formatAmd(payment.itemsAmountAmd)}</span>
        </div>
        {payment.serviceFeeAmd > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-400">Service fee</span>
            <span className="text-white">{formatAmd(payment.serviceFeeAmd)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-400">Tip</span>
          <span className="text-white">{formatAmd(payment.tipAmountAmd)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-neutral-800 pt-2 font-medium">
          <span className="text-white">Total charged</span>
          <span className="text-orange-500">{formatAmd(payment.totalAmd)}</span>
        </div>
      </div>

      {isSucceeded && remainingAmd > 0 && (
        <p className="mt-4 text-sm text-neutral-400">
          {formatAmd(remainingAmd)} still remaining on this bill.
        </p>
      )}
      {isSucceeded && remainingAmd <= 0 && (
        <p className="mt-4 text-sm text-green-400">This bill is fully paid.</p>
      )}
      {isPending && (
        <p className="mt-4 text-sm text-neutral-400">
          We&apos;re waiting for confirmation from the payment provider. Refresh this page in a
          moment.
        </p>
      )}

      {remainingAmd > 0 && (
        <Link
          href={`/pay/${qrToken}`}
          className="mx-auto mt-6 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Back to bill
        </Link>
      )}
    </div>
  );
}
