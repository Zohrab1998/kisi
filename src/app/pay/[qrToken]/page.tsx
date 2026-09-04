import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { billItemRemaining, billTotals } from "@/lib/billing";
import { formatAmd } from "@/lib/money";
import PayForm from "./PayForm";

export default async function PayPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;

  const table = await db.table.findUnique({
    where: { qrToken },
    include: { business: true },
  });
  if (!table) notFound();

  const bill = await db.bill.findFirst({
    where: { tableId: table.id, status: "OPEN" },
    include: { items: true, payments: true },
  });

  if (!bill) {
    return (
      <div className="mx-auto flex flex-1 max-w-sm flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold text-white">{table.business.name}</h1>
        <p className="mt-1 text-sm text-neutral-400">{table.name}</p>
        <p className="mt-6 text-sm text-neutral-400">
          No open bill yet — ask your server to open one, or scan again once your order is in.
        </p>
        {table.business.orderingEnabled && (
          <Link
            href={`/pay/${qrToken}/order`}
            className="mt-6 rounded-md bg-orange-500 px-4 py-3 text-sm font-semibold text-black"
          >
            Order now
          </Link>
        )}
      </div>
    );
  }

  const { remainingAmd, totalAmd } = billTotals(bill);
  const items = bill.items
    .map((i) => ({
      id: i.id,
      name: i.name,
      unitPriceAmd: i.unitPriceAmd,
      remaining: billItemRemaining(i),
    }))
    .filter((i) => i.remaining > 0);

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-white">{table.business.name}</h1>
        <p className="text-sm text-neutral-400">{table.name}</p>
        <p className="mt-2 text-sm text-neutral-400">
          {formatAmd(remainingAmd)} remaining of {formatAmd(totalAmd)}
        </p>
      </div>

      {remainingAmd <= 0 ? (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center text-sm text-green-400">
          This bill is fully paid. Thank you!
        </p>
      ) : (
        <PayForm
          qrToken={qrToken}
          items={items}
          remainingAmd={remainingAmd}
          serviceFeePercent={table.business.serviceFeePercent}
        />
      )}
    </div>
  );
}
