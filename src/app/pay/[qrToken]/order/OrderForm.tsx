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
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-sm font-medium text-green-800">Order sent to the kitchen!</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-3 text-sm text-green-700 underline"
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
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">{item.name}</p>
              <p className="text-xs text-neutral-500">{formatAmd(item.priceAmd)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty(item.id, qty - 1)}
                className="h-7 w-7 rounded-full border border-neutral-300 text-neutral-600"
              >
                −
              </button>
              <span className="w-4 text-center text-sm text-neutral-900">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(item.id, qty + 1)}
                className="h-7 w-7 rounded-full border border-neutral-300 text-neutral-600"
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Note for the kitchen (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="No onions, extra spicy…"
          className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>

      <div className="flex justify-between rounded-lg border border-neutral-200 bg-white p-4 text-sm font-medium">
        <span className="text-neutral-900">Total</span>
        <span className="text-neutral-900">{formatAmd(totalAmd)}</span>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send order"}
      </button>
    </div>
  );
}
