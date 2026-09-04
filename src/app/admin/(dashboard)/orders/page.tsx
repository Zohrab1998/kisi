import { requireBusiness } from "@/lib/current-business";
import { db } from "@/lib/db";
import { formatAmd } from "@/lib/money";
import { advanceOrderStatusAction, cancelOrderAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PLACED: "New",
  ACKNOWLEDGED: "Acknowledged",
  PREPARING: "Preparing",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const NEXT_LABEL: Record<string, string> = {
  PLACED: "Acknowledge",
  ACKNOWLEDGED: "Start preparing",
  PREPARING: "Mark delivered",
};

export default async function OrdersPage() {
  const business = await requireBusiness();

  const orders = await db.order.findMany({
    where: { businessId: business.id, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: { items: true, table: true },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Orders</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {business.orderingEnabled
            ? "Orders customers placed after scanning a table QR."
            : "Ordering is currently off — enable it in Settings for customers to place orders."}
        </p>
      </div>

      {orders.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          No orders yet.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {orders.map((order) => {
          const total = order.items.reduce((s, i) => s + i.unitPriceAmd * i.quantity, 0);
          const nextLabel = NEXT_LABEL[order.status];

          return (
            <div key={order.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-neutral-900">{order.table.name}</span>
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <span className="text-sm text-neutral-500">{formatAmd(total)}</span>
              </div>
              <ul className="mt-2 text-sm text-neutral-600">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.name}
                  </li>
                ))}
              </ul>
              {order.note && (
                <p className="mt-1 text-sm italic text-neutral-500">&ldquo;{order.note}&rdquo;</p>
              )}
              <div className="mt-3 flex gap-3">
                {nextLabel && (
                  <form action={advanceOrderStatusAction.bind(null, order.id)}>
                    <button
                      type="submit"
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      {nextLabel}
                    </button>
                  </form>
                )}
                {order.status !== "DELIVERED" && (
                  <form action={cancelOrderAction.bind(null, order.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
