"use client";

import { useTransition } from "react";
import { regenerateQrTokenAction } from "./actions";

export default function RegenerateQrButton({ tableId }: { tableId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      "This permanently invalidates the printed QR for this table — any existing sticker will stop working and you'll need to print the new one. Continue?"
    );
    if (!confirmed) return;
    startTransition(() => {
      regenerateQrTokenAction(tableId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
    >
      {isPending ? "Regenerating…" : "Regenerate QR (old sticker stops working)"}
    </button>
  );
}
