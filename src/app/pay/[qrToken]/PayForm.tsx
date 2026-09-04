"use client";

import { useMemo, useState, useTransition } from "react";
import { formatAmd } from "@/lib/money";
import { createPaymentAction } from "./actions";

type Item = {
  id: string;
  name: string;
  unitPriceAmd: number;
  remainingAmd: number;
  wholeUnitsRemaining: number;
};

export default function PayForm({
  qrToken,
  items,
  remainingAmd,
  serviceFeePercent,
}: {
  qrToken: string;
  items: Item[];
  remainingAmd: number;
  serviceFeePercent: number;
}) {
  const [mode, setMode] = useState<"items" | "split">("items");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [partialAmounts, setPartialAmounts] = useState<Record<string, number>>({});
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
    return items.reduce((sum, item) => {
      const partial = partialAmounts[item.id];
      if (partial !== undefined) return sum + partial;
      return sum + (quantities[item.id] || 0) * item.unitPriceAmd;
    }, 0);
  }, [mode, ways, remainingAmd, items, quantities, partialAmounts]);

  const serviceFeeAmd = Math.round((itemsAmountAmd * serviceFeePercent) / 100);
  const tipAmd = tipPercent === "custom" ? customTip : Math.round((itemsAmountAmd * tipPercent) / 100);
  const totalAmd = itemsAmountAmd + serviceFeeAmd + tipAmd;

  function setQty(id: string, qty: number, max: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, Math.min(qty, max)) }));
  }

  function togglePartialMode(item: Item) {
    setPartialAmounts((prev) => {
      const next = { ...prev };
      if (next[item.id] !== undefined) {
        delete next[item.id];
      } else {
        setQuantities((q) => ({ ...q, [item.id]: 0 }));
        next[item.id] = 0;
      }
      return next;
    });
  }

  // No clamping while typing — clamping a controlled input's value on every
  // keystroke can reset the cursor position on some mobile keyboards,
  // making it look like input isn't registering. Clamp only once typing is
  // done (blur / Enter).
  function setPartialAmountRaw(id: string, raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    setPartialAmounts((prev) => ({ ...prev, [id]: digits === "" ? 0 : Number(digits) }));
  }

  function clampPartialAmount(id: string, max: number) {
    setPartialAmounts((prev) => ({ ...prev, [id]: Math.max(0, Math.min(prev[id] || 0, max)) }));
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
              .filter((i) => (quantities[i.id] || 0) > 0 || (partialAmounts[i.id] || 0) > 0)
              .map((i) =>
                partialAmounts[i.id] !== undefined && partialAmounts[i.id] > 0
                  ? { billItemId: i.id, kind: "amount" as const, amdAmount: partialAmounts[i.id] }
                  : { billItemId: i.id, kind: "quantity" as const, quantity: quantities[i.id] }
              ),
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
      <div className="flex rounded-lg border border-neutral-800 bg-neutral-900 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("items")}
          className={`flex-1 rounded-md py-2 font-medium ${
            mode === "items" ? "bg-orange-500 text-black" : "text-neutral-400"
          }`}
        >
          Pay for items
        </button>
        <button
          type="button"
          onClick={() => setMode("split")}
          className={`flex-1 rounded-md py-2 font-medium ${
            mode === "split" ? "bg-orange-500 text-black" : "text-neutral-400"
          }`}
        >
          Split evenly
        </button>
      </div>

      {mode === "items" ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const qty = quantities[item.id] || 0;
            const forcedPartial = item.wholeUnitsRemaining === 0;
            const isPartialMode = forcedPartial || partialAmounts[item.id] !== undefined;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-neutral-400">
                      {formatAmd(item.unitPriceAmd)} · {formatAmd(item.remainingAmd)} left
                    </p>
                  </div>
                  {isPartialMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={partialAmounts[item.id] || 0}
                      onChange={(e) => setPartialAmountRaw(item.id, e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onBlur={() => clampPartialAmount(item.id, item.remainingAmd)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      placeholder="AMD"
                      className="w-24 rounded-md border border-neutral-700 bg-black px-2 py-1 text-sm text-white"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, qty - 1, item.wholeUnitsRemaining)}
                        className="h-7 w-7 rounded-full border border-neutral-700 text-neutral-300"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm text-white">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, qty + 1, item.wholeUnitsRemaining)}
                        className="h-7 w-7 rounded-full border border-neutral-700 text-neutral-300"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
                {!forcedPartial && (
                  <button
                    type="button"
                    onClick={() => togglePartialMode(item)}
                    className="self-start text-xs text-orange-500 underline"
                  >
                    {isPartialMode ? "Pay by quantity instead" : "Sharing this? Pay part of it"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
            Split between how many people?
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={ways}
              onChange={(e) => setWays(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
              onBlur={() => setWays((w) => Math.min(Math.max(1, w), 50))}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <p className="mt-2 text-sm text-neutral-400">
            Your share: {formatAmd(itemsAmountAmd)} of {formatAmd(remainingAmd)} remaining
          </p>
        </div>
      )}

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-sm font-medium text-white">Add a tip</p>
        <div className="mt-2 flex gap-2">
          {[0, 10, 15, 20].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setTipPercent(pct)}
              className={`flex-1 rounded-md border py-2 text-sm ${
                tipPercent === pct
                  ? "border-orange-500 bg-orange-500 text-black"
                  : "border-neutral-700 text-neutral-300"
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
                ? "border-orange-500 bg-orange-500 text-black"
                : "border-neutral-700 text-neutral-300"
            }`}
          >
            Custom
          </button>
        </div>
        {tipPercent === "custom" && (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customTip}
            onChange={(e) => setCustomTip(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="Tip amount (AMD)"
            className="mt-2 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
          />
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Your name (optional)
        <input
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          placeholder="For the receipt"
          className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
        />
      </label>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-400">Items</span>
          <span className="text-white">{formatAmd(itemsAmountAmd)}</span>
        </div>
        {serviceFeePercent > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-400">Service fee ({serviceFeePercent}%)</span>
            <span className="text-white">{formatAmd(serviceFeeAmd)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-400">Tip</span>
          <span className="text-white">{formatAmd(tipAmd)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-neutral-800 pt-2 font-medium">
          <span className="text-white">Total</span>
          <span className="text-orange-500">{formatAmd(totalAmd)}</span>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => pay("IDRAM_WALLET")}
          className="rounded-md bg-orange-500 px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
        >
          {isPending ? "Processing…" : "Pay with Idram"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => pay("CARD")}
          className="rounded-md border border-orange-500 px-4 py-3 text-sm font-semibold text-orange-500 disabled:opacity-50"
        >
          {isPending ? "Processing…" : "Pay with Visa/Mastercard"}
        </button>
      </div>
    </div>
  );
}
