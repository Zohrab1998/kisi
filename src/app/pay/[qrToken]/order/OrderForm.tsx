"use client";

import { useMemo, useState, useTransition } from "react";
import { formatAmd } from "@/lib/money";
import { submitOrderAction } from "./actions";

type MenuItem = { id: string; name: string; priceAmd: number };

export default function OrderForm({ qrToken, menuItems }: { qrToken: string; menuItems: MenuItem[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalAmd = useMemo(
    () => menuItems.reduce((sum, m) => sum + (quantities[m.id] || 0) * m.priceAmd, 0),
    [menuItems, quantities]
  );

  function setQty(id: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  function submit() {
    const items = menuItems
      .filter((m) => (quantities[m.id] || 0) > 0)
      .map((m) => ({ menuItemId: m.id, quantity: quantities[m.id] }));

    if (items.length === 0) {
      setError("Add at least one item.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitOrderAction({ qrToken, items, note: note || undefined });
      if (result.ok) {
        setSubmitted(true);
        setQuantities({});
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="text-sm font-medium text-green-400">Order sent to the kitchen!</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-3 text-sm text-orange-500 underline"
        >
          Order more
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {menuItems.map((item) => {
        const qty = quantities[item.id] || 0;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{item.name}</p>
              <p className="text-xs text-neutral-400">{formatAmd(item.priceAmd)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty(item.id, qty - 1)}
                className="h-7 w-7 rounded-full border border-neutral-700 text-neutral-300"
              >
                −
              </button>
              <span className="w-4 text-center text-sm text-white">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(item.id, qty + 1)}
                className="h-7 w-7 rounded-full border border-neutral-700 text-neutral-300"
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Note for the kitchen (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="No onions, extra spicy…"
          className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
        />
      </label>

      <div className="flex justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm font-medium">
        <span className="text-white">Total</span>
        <span className="text-orange-500">{formatAmd(totalAmd)}</span>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="rounded-md bg-orange-500 px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send order"}
      </button>
    </div>
  );
}
