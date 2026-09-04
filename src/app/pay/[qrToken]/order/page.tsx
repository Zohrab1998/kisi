import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import OrderForm from "./OrderForm";

export default async function OrderPage({
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

  const menuItems = table.business.orderingEnabled
    ? await db.menuItem.findMany({
        where: { businessId: table.businessId, available: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <Link href={`/pay/${qrToken}`} className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back
      </Link>
      <div className="mb-6 mt-2 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">{table.business.name}</h1>
        <p className="text-sm text-neutral-500">{table.name}</p>
      </div>

      {!table.business.orderingEnabled ? (
        <p className="text-center text-sm text-neutral-500">Ordering isn&apos;t available right now.</p>
      ) : menuItems.length === 0 ? (
        <p className="text-center text-sm text-neutral-500">The menu is empty right now.</p>
      ) : (
        <OrderForm
          qrToken={qrToken}
          menuItems={menuItems.map((m) => ({ id: m.id, name: m.name, priceAmd: m.priceAmd }))}
        />
      )}
    </div>
  );
}
