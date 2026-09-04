"use client";

import { useState, useTransition } from "react";
import { formatAmd } from "@/lib/money";
import { addMenuItemToBillAction } from "./actions";

type PickerItem = { id: string; name: string; priceAmd: number; imageUrl: string | null };
type PickerGroup = { id: string; name: string; items: PickerItem[] };

export default function MenuPicker({
  tableId,
  billId,
  groups,
}: {
  tableId: string;
  billId: string;
  groups: PickerGroup[];
}) {
  const [activeGroupId, setActiveGroupId] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  if (groups.every((g) => g.items.length === 0)) {
    return <p className="text-sm text-neutral-500">No available menu items yet — add some in Menu.</p>;
  }

  const visibleGroups = activeGroupId === "all" ? groups : groups.filter((g) => g.id === activeGroupId);

  function addItem(menuItemId: string) {
    setPendingItemId(menuItemId);
    startTransition(async () => {
      await addMenuItemToBillAction(tableId, billId, menuItemId);
      setPendingItemId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveGroupId("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            activeGroupId === "all" ? "bg-orange-500 text-black" : "bg-neutral-800 text-neutral-300"
          }`}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveGroupId(g.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeGroupId === g.id ? "bg-orange-500 text-black" : "bg-neutral-800 text-neutral-300"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {visibleGroups.flatMap((g) =>
          g.items.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isPending}
              onClick={() => addItem(item.id)}
              className="flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-black text-left hover:border-orange-500 disabled:opacity-60"
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-20 w-full object-cover" />
              ) : (
                <div className="flex h-20 w-full items-center justify-center bg-neutral-900 text-xs text-neutral-500">
                  No photo
                </div>
              )}
              <div className="flex flex-col gap-0.5 p-2">
                <span className="truncate text-sm font-medium text-white">
                  {pendingItemId === item.id ? "Adding…" : item.name}
                </span>
                <span className="text-xs text-neutral-400">{formatAmd(item.priceAmd)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
