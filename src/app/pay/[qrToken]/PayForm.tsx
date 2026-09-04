"use client";

import { useMemo, useState, useTransition } from "react";
import { formatAmd } from "@/lib/money";
import { createPaymentAction } from "./actions";

type Item = {
  id: string;
  name: string;
  unitPriceAmd: number;
  remaining: number;
};

export default function PayForm({
  qrToken,
  items,
  remainingAmd,
}: {
  qrToken: string;
  items: Item[];
  remainingAmd: number;
}) {
  const [mode, setMode] = useState<"items" | "split">("items");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [ways, setWays] = useState(2);
  const [tipPercent, setTipPercent] = useState<number | "custom">(10);
  const [customTip, setCustomTip] = useState(0);
  const [payerName, setPayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemsAmountAmd = useMemo(() => {
    if (mode === "split") {
      return Math.min(Math.ceil(remainingAmd / Math.max(ways, 1)), remainingAmd);
    }
    return items.reduce((sum, item) => sum + (quantities[item.id] || 0) * item.unitPriceAmd, 0);
  }, [mode, ways, remainingAmd, items, quantities]);

  const tipAmd = tipPercent === "custom" ? customTip : Math.round((itemsAmountAmd * tipPercent) / 100);
  const totalAmd = itemsAmountAmd + tipAmd;

  function setQty(id: string, qty: number, max: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, Math.min(qty, max)) }));
  }

  function pay(method: "IDRAM_WALLET" | "CARD") {
    if (itemsAmountAmd <= 0) {
      setError("Select at least one item, or a split amount greater than zero.");
      return;
    }
    setError(null);

    const selection =
      mode === "items"
        ? {
            mode: "items" as const,
            shares: items
              .filter((i) => (quantities[i.id] || 0) > 0)
              .map((i) => ({ billItemId: i.id, quantity: quantities[i.id] })),
          }
        : { mode: "split" as const, ways };

    startTransition(async () => {
      const result = await createPaymentAction({
        qrToken,
        method,
        payerName: payerName || undefined,
        tipAmd,
        selection,
      });

      if (result.ok) {
        window.location.href = result.redirectUrl;
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex rounded-lg border border-neutral-200 bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("items")}
          className={`flex-1 rounded-md py-2 font-medium ${
            mode === "items" ? "bg-neutral-900 text-white" : "text-neutral-500"
          }`}
        >
          Pay for items
        </button>
        <button
          type="button"
          onClick={() => setMode("split")}
          className={`flex-1 rounded-md py-2 font-medium ${
            mode === "split" ? "bg-neutral-900 text-white" : "text-neutral-500"
          }`}
        >
          Split evenly
        </button>
      </div>

      {mode === "items" ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const qty = quantities[item.id] || 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="text-xs text-neutral-500">
                    {formatAmd(item.unitPriceAmd)} · {item.remaining} left
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty - 1, item.remaining)}
                    className="h-7 w-7 rounded-full border border-neutral-300 text-neutral-600"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm text-neutral-900">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty + 1, item.remaining)}
                    className="h-7 w-7 rounded-full border border-neutral-300 text-neutral-600"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Split between how many people?
            <input
              type="number"
              min={1}
              max={50}
              value={ways}
              onChange={(e) => setWays(Math.max(1, Number(e.target.value) || 1))}
              className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
            />
          </label>
          <p className="mt-2 text-sm text-neutral-500">
            Your share: {formatAmd(itemsAmountAmd)} of {formatAmd(remainingAmd)} remaining
          </p>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-900">Add a tip</p>
        <div className="mt-2 flex gap-2">
          {[0, 10, 15, 20].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setTipPercent(pct)}
              className={`flex-1 rounded-md border py-2 text-sm ${
                tipPercent === pct
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              {pct}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTipPercent("custom")}
            className={`flex-1 rounded-md border py-2 text-sm ${
              tipPercent === "custom"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-600"
            }`}
          >
            Custom
          </button>
        </div>
        {tipPercent === "custom" && (
          <input
            type="number"
            min={0}
            value={customTip}
            onChange={(e) => setCustomTip(Math.max(0, Number(e.target.value) || 0))}
            placeholder="Tip amount (AMD)"
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Your name (optional)
        <input
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          placeholder="For the receipt"
          className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Items</span>
          <span className="text-neutral-900">{formatAmd(itemsAmountAmd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Tip</span>
          <span className="text-neutral-900">{formatAmd(tipAmd)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 font-medium">
          <span className="text-neutral-900">Total</span>
          <span className="text-neutral-900">{formatAmd(totalAmd)}</span>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => pay("IDRAM_WALLET")}
          className="rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Processing…" : "Pay with Idram"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => pay("CARD")}
          className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
        >
          {isPending ? "Processing…" : "Pay with Visa/Mastercard"}
        </button>
      </div>
    </div>
  );
}
