"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const orderInputSchema = z.object({
  qrToken: z.string().min(1),
  note: z.string().trim().max(200).optional(),
  items: z
    .array(z.object({ menuItemId: z.string(), quantity: z.number().int().positive().max(50) }))
    .min(1),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export async function submitOrderAction(
  raw: OrderInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const input = parsed.data;

  const table = await db.table.findUnique({
    where: { qrToken: input.qrToken },
    include: { business: true },
  });
  if (!table) return { ok: false, error: "Table not found" };
  if (!table.business.orderingEnabled) return { ok: false, error: "Ordering is not available right now" };

  const menuItems = await db.menuItem.findMany({
    where: { businessId: table.businessId, available: true },
  });

  const orderItems: { menuItemId: string; name: string; unitPriceAmd: number; quantity: number }[] = [];
  for (const line of input.items) {
    const menuItem = menuItems.find((m) => m.id === line.menuItemId);
    if (!menuItem) return { ok: false, error: "One of the items is no longer available" };
    orderItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      unitPriceAmd: menuItem.priceAmd,
      quantity: line.quantity,
    });
  }

  await db.order.create({
    data: {
      businessId: table.businessId,
      tableId: table.id,
      note: input.note || null,
      items: { create: orderItems },
    },
  });

  return { ok: true };
}
