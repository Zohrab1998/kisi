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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10 text-center">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
          isSucceeded ? "bg-green-100 text-green-700" : isPending ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
        }`}
      >
        {isSucceeded ? "✓" : isPending ? "…" : "✕"}
      </div>

      <h1 className="text-xl font-semibold text-neutral-900">
        {isSucceeded ? "Payment received" : isPending ? "Confirming payment…" : "Payment failed"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{payment.bill.table.name}</p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Items</span>
          <span className="text-neutral-900">{formatAmd(payment.itemsAmountAmd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Tip</span>
          <span className="text-neutral-900">{formatAmd(payment.tipAmountAmd)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 font-medium">
          <span className="text-neutral-900">Total charged</span>
          <span className="text-neutral-900">{formatAmd(payment.totalAmd)}</span>
        </div>
      </div>

      {isSucceeded && remainingAmd > 0 && (
        <p className="mt-4 text-sm text-neutral-500">
          {formatAmd(remainingAmd)} still remaining on this bill.
        </p>
      )}
      {isSucceeded && remainingAmd <= 0 && (
        <p className="mt-4 text-sm text-green-700">This bill is fully paid.</p>
      )}
      {isPending && (
        <p className="mt-4 text-sm text-neutral-500">
          We&apos;re waiting for confirmation from the payment provider. Refresh this page in a
          moment.
        </p>
      )}

      {remainingAmd > 0 && (
        <Link
          href={`/pay/${qrToken}`}
          className="mt-6 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back to bill
        </Link>
      )}
    </div>
  );
}
