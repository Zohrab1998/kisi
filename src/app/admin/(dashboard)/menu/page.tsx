import { requireBusiness } from "@/lib/current-business";
import { db } from "@/lib/db";
import { formatAmd } from "@/lib/money";
import {
  createMenuCategoryAction,
  createMenuItemAction,
  deleteMenuCategoryAction,
  deleteMenuItemAction,
  toggleMenuItemAction,
} from "./actions";

export default async function MenuPage() {
  const business = await requireBusiness();
  const categories = await db.menuCategory.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
    include: { menuItems: { orderBy: { name: "asc" } } },
  });
  const uncategorized = await db.menuItem.findMany({
    where: { businessId: business.id, categoryId: null },
    orderBy: { name: "asc" },
  });

  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name, items: c.menuItems, deletable: true })),
    ...(uncategorized.length > 0
      ? [{ id: null, name: "Uncategorized", items: uncategorized, deletable: false }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Menu</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Organized into categories so staff can tap items straight onto a bill, and customers see
          the same grid when ordering.
        </p>
      </div>

      <section className="rounded-lg border border-dashed border-neutral-300 p-4">
        <h2 className="text-sm font-medium text-neutral-900">Categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-700"
            >
              {c.name}
              <form action={deleteMenuCategoryAction.bind(null, c.id)}>
                <button type="submit" className="text-neutral-400 hover:text-red-600" title="Delete category">
                  ×
                </button>
              </form>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-neutral-400">No categories yet — add one below (e.g. Salads, Pizza).</p>
          )}
        </div>
        <form action={createMenuCategoryAction} className="mt-4 flex max-w-sm items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm text-neutral-700">
            New category
            <input
              name="name"
              required
              placeholder="e.g. Salads"
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
      </section>

      {groups.map((group) => (
        <div key={group.id ?? "uncategorized"} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-neutral-900">{group.name}</h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
                  <th className="px-4 py-2 font-normal" />
                  <th className="px-4 py-2 font-normal">Name</th>
                  <th className="px-4 py-2 font-normal">Price</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="px-4 py-2">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-neutral-100" />
                      )}
                    </td>
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
        </div>
      ))}

      <form
        action={createMenuItemAction}
        className="flex max-w-md flex-col gap-3 rounded-lg border border-dashed border-neutral-300 p-4"
      >
        <h2 className="text-sm font-medium text-neutral-900">Add item</h2>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Name
          <input
            name="name"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Price (AMD)
          <input
            name="priceAmd"
            type="number"
            min={1}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Category (optional)
          <select
            name="categoryId"
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Photo (optional)
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm text-neutral-600"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add item
        </button>
      </form>
    </div>
  );
}
