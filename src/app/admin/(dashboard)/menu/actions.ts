"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/current-business";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(60),
  priceAmd: z.coerce.number().int().positive(),
});

export async function createMenuItemAction(formData: FormData) {
  const business = await requireBusiness();
  const { name, priceAmd } = itemSchema.parse({
    name: formData.get("name"),
    priceAmd: formData.get("priceAmd"),
  });

  await db.menuItem.create({ data: { businessId: business.id, name, priceAmd } });
  revalidatePath("/admin/menu");
}

export async function toggleMenuItemAction(menuItemId: string) {
  const business = await requireBusiness();
  const item = await db.menuItem.findFirst({ where: { id: menuItemId, businessId: business.id } });
  if (!item) return;

  await db.menuItem.update({ where: { id: item.id }, data: { available: !item.available } });
  revalidatePath("/admin/menu");
}

export async function deleteMenuItemAction(menuItemId: string) {
  const business = await requireBusiness();
  await db.menuItem.deleteMany({ where: { id: menuItemId, businessId: business.id } });
  revalidatePath("/admin/menu");
}
