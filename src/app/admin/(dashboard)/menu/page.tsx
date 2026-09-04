import { requireBusiness } from "@/lib/current-business";
import { db } from "@/lib/db";
import { formatAmd } from "@/lib/money";
import { createMenuItemAction, deleteMenuItemAction, toggleMenuItemAction } from "./actions";

export default async function MenuPage() {
  const business = await requireBusiness();
  const items = await db.menuItem.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Menu</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Used to quickly add items to a bill, and by customers when ordering is enabled.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Price</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="px-4 py-2 text-neutral-900">{item.name}</td>
                <td className="px-4 py-2 text-neutral-500">{formatAmd(item.priceAmd)}</td>
                <td className="px-4 py-2">
                  <form action={toggleMenuItemAction.bind(null, item.id)}>
                    <button
                      type="submit"
                      className={
                        item.available
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500"
                      }
                    >
                      {item.available ? "Available" : "Hidden"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteMenuItemAction.bind(null, item.id)}>
                    <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
                      delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={createMenuItemAction}
        className="flex max-w-md items-end gap-2 rounded-lg border border-dashed border-neutral-300 p-4"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-neutral-700">
          Name
          <input
            name="name"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </label>
        <label className="flex w-32 flex-col gap-1 text-sm text-neutral-700">
          Price (AMD)
          <input
            name="priceAmd"
            type="number"
            min={1}
            required
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
