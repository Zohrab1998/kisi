"use client";

import { useMemo, useState, useTransition } from "react";
import { parseMenuImportText, type ParsedMenuCategory } from "@/lib/menuImport";
import { bulkImportMenuAction } from "./actions";

export default function BulkImportForm() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedMenuCategory[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemCount = useMemo(() => preview?.reduce((sum, c) => sum + c.items.length, 0) ?? 0, [preview]);

  function handleParse() {
    const parsed = parseMenuImportText(text);
    setPreview(parsed.categories);
    setWarnings(parsed.warnings);
    setResult(null);
    setError(null);
  }

  function updateCategoryName(index: number, name: string) {
    setPreview((prev) => prev?.map((c, i) => (i === index ? { ...c, name } : c)) ?? null);
  }
  function removeCategory(index: number) {
    setPreview((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }
  function updateItem(catIndex: number, itemIndex: number, patch: Partial<{ name: string; priceAmd: number }>) {
    setPreview(
      (prev) =>
        prev?.map((c, i) =>
          i === catIndex
            ? { ...c, items: c.items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)) }
            : c
        ) ?? null
    );
  }
  function removeItem(catIndex: number, itemIndex: number) {
    setPreview(
      (prev) =>
        prev?.map((c, i) => (i === catIndex ? { ...c, items: c.items.filter((_, j) => j !== itemIndex) } : c)) ??
        null
    );
  }

  function handleImport() {
    if (!preview || itemCount === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await bulkImportMenuAction(preview.filter((c) => c.items.length > 0));
      if (res.ok) {
        setResult({ created: res.created, skipped: res.skipped });
        setPreview(null);
        setWarnings([]);
        setText("");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <details className="rounded-lg border border-dashed border-neutral-700 p-4">
      <summary className="cursor-pointer text-sm font-medium text-white">Bulk import from a pasted list</summary>
      <div className="mt-4 flex flex-col gap-4">
        <p className="text-sm text-neutral-400">
          Paste a list: a category name on its own line, then &quot;Item name: price&quot; lines under it,
          one per line. Names split by &quot; / &quot; (e.g. &quot;Black / White Russian: 2400&quot;) become
          separate items — check the preview below and fix any that need a shared word added back.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"Armenian Cocktails\nSyunik Old Fashioned: 2900\nYerevan Mule: 4200"}
          className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={!text.trim()}
          className="self-start rounded-md border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-500 disabled:opacity-50"
        >
          Preview
        </button>

        {warnings.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        )}

        {preview && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-300">
              {preview.length} categories, {itemCount} items ready to import. Edit anything below first.
            </p>
            {preview.map((cat, ci) => (
              <div key={ci} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={cat.name}
                    onChange={(e) => updateCategoryName(ci, e.target.value)}
                    className="flex-1 rounded-md border border-neutral-700 bg-black px-2 py-1 text-sm font-medium text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(ci)}
                    className="text-xs text-neutral-500 hover:text-red-400"
                  >
                    remove category
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {cat.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2">
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                        className="flex-1 rounded-md border border-neutral-700 bg-black px-2 py-1 text-sm text-white"
                      />
                      <input
                        type="number"
                        value={item.priceAmd}
                        onChange={(e) => updateItem(ci, ii, { priceAmd: Number(e.target.value) || 0 })}
                        className="w-24 rounded-md border border-neutral-700 bg-black px-2 py-1 text-sm text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(ci, ii)}
                        className="text-xs text-neutral-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={isPending || itemCount === 0}
              onClick={handleImport}
              className="self-start rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {isPending ? "Importing…" : `Import ${itemCount} items`}
            </button>
          </div>
        )}

        {result && (
          <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
            Imported {result.created} items
            {result.skipped > 0 ? `, skipped ${result.skipped} that already existed` : ""}.
          </p>
        )}
      </div>
    </details>
  );
}
