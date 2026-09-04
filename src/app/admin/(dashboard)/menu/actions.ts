"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/current-business";
import { saveMenuItemImage } from "@/lib/uploads";

const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
});

export async function createMenuCategoryAction(formData: FormData) {
  const business = await requireBusiness();
  const { name } = categorySchema.parse({ name: formData.get("name") });

  await db.menuCategory.upsert({
    where: { businessId_name: { businessId: business.id, name } },
    create: { businessId: business.id, name },
    update: {},
  });
  revalidatePath("/admin/menu");
}

export async function deleteMenuCategoryAction(categoryId: string) {
  const business = await requireBusiness();
  // Items keep existing (categoryId set to null via onDelete: SetNull).
  await db.menuCategory.deleteMany({ where: { id: categoryId, businessId: business.id } });
  revalidatePath("/admin/menu");
}

const itemSchema = z.object({
  name: z.string().trim().min(1).max(60),
  priceAmd: z.coerce.number().int().positive(),
  categoryId: z.string().trim().optional(),
});

export async function createMenuItemAction(formData: FormData) {
  const business = await requireBusiness();
  const { name, priceAmd, categoryId } = itemSchema.parse({
    name: formData.get("name"),
    priceAmd: formData.get("priceAmd"),
    categoryId: formData.get("categoryId") || undefined,
  });

  if (categoryId) {
    const category = await db.menuCategory.findFirst({ where: { id: categoryId, businessId: business.id } });
    if (!category) throw new Error("Category not found");
  }

  let imageUrl: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    imageUrl = await saveMenuItemImage(image);
  }

  await db.menuItem.create({
    data: { businessId: business.id, name, priceAmd, categoryId: categoryId || null, imageUrl },
  });
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

const bulkImportSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1).max(40),
      items: z
        .array(z.object({ name: z.string().trim().min(1).max(60), priceAmd: z.coerce.number().int().positive() }))
        .min(1)
        .max(300),
    })
  )
  .min(1)
  .max(50);

export async function bulkImportMenuAction(
  raw: unknown
): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  const business = await requireBusiness();
  const parsed = bulkImportSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid import data" };

  const existing = await db.menuItem.findMany({
    where: { businessId: business.id },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));

  let created = 0;
  let skipped = 0;

  for (const cat of parsed.data) {
    const category = await db.menuCategory.upsert({
      where: { businessId_name: { businessId: business.id, name: cat.name } },
      create: { businessId: business.id, name: cat.name },
      update: {},
    });

    for (const item of cat.items) {
      if (existingNames.has(item.name.toLowerCase())) {
        skipped++;
        continue;
      }
      await db.menuItem.create({
        data: { businessId: business.id, categoryId: category.id, name: item.name, priceAmd: item.priceAmd },
      });
      existingNames.add(item.name.toLowerCase());
      created++;
    }
  }

  revalidatePath("/admin/menu");
  return { ok: true, created, skipped };
}
