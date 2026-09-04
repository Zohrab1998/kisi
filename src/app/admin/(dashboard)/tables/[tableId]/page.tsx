import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/current-business";
import { db } from "@/lib/db";
import { billTotals } from "@/lib/billing";
import { formatAmd } from "@/lib/money";
import { getBaseUrl } from "@/lib/url";
import { tableQrPngDataUrl, tablePayUrl } from "@/lib/qr";
import RegenerateQrButton from "./RegenerateQrButton";
import MenuPicker from "./MenuPicker";
import {
  addBillItemAction,
  cancelBillAction,
  removeBillItemAction,
  startBillAction,
} from "./actions";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const business = await requireBusiness();

  const table = await db.table.findFirst({
    where: { id: tableId, businessId: business.id },
    include: {
      bills: {
        where: { status: "OPEN" },
        take: 1,
        include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
      },
    },
  });
  if (!table) notFound();

  const categories = await db.menuCategory.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
    include: { menuItems: { where: { available: true }, orderBy: { name: "asc" } } },
  });
  const uncategorized = await db.menuItem.findMany({
    where: { businessId: business.id, available: true, categoryId: null },
    orderBy: { name: "asc" },
  });
  const pickerGroups = [
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: c.menuItems.map((mi) => ({ id: mi.id, name: mi.name, priceAmd: mi.priceAmd, imageUrl: mi.imageUrl })),
    })),
    ...(uncategorized.length > 0
      ? [
          {
            id: "uncategorized",
            name: "Other",
            items: uncategorized.map((mi) => ({
              id: mi.id,
              name: mi.name,
              priceAmd: mi.priceAmd,
              imageUrl: mi.imageUrl,
            })),
          },
        ]
      : []),
  ];

  const baseUrl = await getBaseUrl();
  const qrDataUrl = await tableQrPngDataUrl(baseUrl, table.qrToken);
  const payUrl = tablePayUrl(baseUrl, table.qrToken);
  const bill = table.bills[0];
  const totals = bill ? billTotals({ ...bill, items: bill.items }) : null;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Tables
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="self-start text-sm font-medium text-neutral-900">{table.name} QR</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={`QR code for ${table.name}`} className="h-48 w-48" />
          <a
            href={qrDataUrl}
            download={`${table.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
            className="text-sm font-medium text-neutral-900 underline"
          >
            Download PNG
          </a>
          <p className="break-all text-center text-xs text-neutral-400">{payUrl}</p>
          <RegenerateQrButton tableId={tableId} />
        </div>

        <div className="flex flex-col gap-6">
          {!bill ? (
            <form action={startBillAction.bind(null, tableId)}>
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              >
                Start new bill
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-900">Open bill</h2>
                <form action={cancelBillAction.bind(null, tableId, bill.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Cancel bill
                  </button>
                </form>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-2 font-normal">Item</th>
                    <th className="py-2 font-normal">Unit</th>
                    <th className="py-2 font-normal">Qty</th>
                    <th className="py-2 font-normal">Paid</th>
                    <th className="py-2 font-normal">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100">
                      <td className="py-2 text-neutral-900">{item.name}</td>
                      <td className="py-2 text-neutral-500">{formatAmd(item.unitPriceAmd)}</td>
                      <td className="py-2 text-neutral-500">{item.quantity}</td>
                      <td className="py-2 text-neutral-500">{item.quantityPaid}</td>
                      <td className="py-2 text-neutral-900">
                        {formatAmd(item.unitPriceAmd * item.quantity)}
                      </td>
                      <td className="py-2 text-right">
                        {item.quantityPaid === 0 && (
                          <form action={removeBillItemAction.bind(null, tableId, item.id)}>
                            <button
                              type="submit"
                              className="text-xs text-neutral-400 hover:text-red-600"
                            >
                              remove
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totals && (
                <div className="flex justify-end gap-6 text-sm">
                  <span className="text-neutral-500">Total {formatAmd(totals.totalAmd)}</span>
                  <span className="text-neutral-500">Paid {formatAmd(totals.paidAmd)}</span>
                  <span className="font-medium text-neutral-900">
                    Remaining {formatAmd(totals.remainingAmd)}
                  </span>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4">
                <h3 className="mb-2 text-sm font-medium text-neutral-900">Tap to add</h3>
                <MenuPicker tableId={tableId} billId={bill.id} groups={pickerGroups} />
              </div>

              <details className="border-t border-neutral-200 pt-4">
                <summary className="cursor-pointer text-sm font-medium text-neutral-900">
                  Add a custom item
                </summary>
                <form
                  action={addBillItemAction.bind(null, tableId, bill.id)}
                  className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      name="name"
                      placeholder="Name"
                      required
                      className="col-span-3 rounded-md border border-neutral-300 px-2 py-2 text-sm sm:col-span-1"
                    />
                    <input
                      name="unitPriceAmd"
                      type="number"
                      min={1}
                      placeholder="Price"
                      required
                      className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
                    />
                    <input
                      name="quantity"
                      type="number"
                      min={1}
                      defaultValue={1}
                      required
                      className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Add item
                  </button>
                </form>
              </details>

              {bill.payments.length > 0 && (
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="mb-2 text-sm font-medium text-neutral-900">Payments</h3>
                  <ul className="flex flex-col gap-1 text-sm text-neutral-600">
                    {bill.payments.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>
                          {p.method === "IDRAM_WALLET" ? "Idram" : "Card"} · {p.status.toLowerCase()}
                          {p.payerName ? ` · ${p.payerName}` : ""}
                        </span>
                        <span>{formatAmd(p.totalAmd)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
