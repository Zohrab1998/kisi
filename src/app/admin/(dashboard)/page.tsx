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
        <h1 className="text-xl font-semibold text-neutral-900">Tables</h1>
        <p className="mt-1 text-sm text-neutral-500">
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
              className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">{table.name}</span>
                {openBill ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Open bill
                  </span>
                ) : (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                    No bill
                  </span>
                )}
              </div>
              {totals && (
                <p className="mt-2 text-sm text-neutral-500">
                  {formatAmd(totals.remainingAmd)} remaining of {formatAmd(totals.totalAmd)}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <form
        action={createTableAction}
        className="flex max-w-sm items-end gap-2 rounded-lg border border-dashed border-neutral-300 p-4"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-neutral-700">
          New table name
          <input
            name="name"
            required
            placeholder="Table 4"
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add
        </button>
      </form>
    </div>
  );
}
