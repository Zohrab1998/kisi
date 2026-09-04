import Link from "next/link";
import { requireBusiness } from "@/lib/current-business";
import { db } from "@/lib/db";
import { billTotals } from "@/lib/billing";
import { formatAmd } from "@/lib/money";
import { createTableAction } from "./tables/actions";

export default async function TablesPage() {
  const business = await requireBusiness();

  const tables = await db.table.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
    include: {
      bills: {
        where: { status: "OPEN" },
        include: { items: true, payments: true },
        take: 1,
      },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Tables</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Each table has a printable QR. Customers scan it to see and pay the open bill.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => {
          const openBill = table.bills[0];
          const totals = openBill ? billTotals(openBill) : null;

          return (
            <Link
              key={table.id}
              href={`/admin/tables/${table.id}`}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-orange-500"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{table.name}</span>
                {openBill ? (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                    Open bill
                  </span>
                ) : (
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-400">
                    No bill
                  </span>
                )}
              </div>
              {totals && (
                <p className="mt-2 text-sm text-neutral-400">
                  {formatAmd(totals.remainingAmd)} remaining of {formatAmd(totals.totalAmd)}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <form
        action={createTableAction}
        className="flex max-w-sm items-end gap-2 rounded-lg border border-dashed border-neutral-700 p-4"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-neutral-300">
          New table name
          <input
            name="name"
            required
            placeholder="Table 4"
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Add
        </button>
      </form>
    </div>
  );
}
