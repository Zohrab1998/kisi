"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/current-business";

async function ownedTable(businessId: string, tableId: string) {
  const table = await db.table.findFirst({ where: { id: tableId, businessId } });
  if (!table) throw new Error("Table not found");
  return table;
}

export async function startBillAction(tableId: string) {
  const business = await requireBusiness();
  const table = await ownedTable(business.id, tableId);

  const existing = await db.bill.findFirst({ where: { tableId: table.id, status: "OPEN" } });
  if (!existing) {
    await db.bill.create({ data: { businessId: business.id, tableId: table.id } });
  }
  revalidatePath(`/admin/tables/${tableId}`);
}

export async function cancelBillAction(tableId: string, billId: string) {
  const business = await requireBusiness();
  await ownedTable(business.id, tableId);

  await db.bill.updateMany({
    where: { id: billId, businessId: business.id, status: "OPEN" },
    data: { status: "CANCELLED", closedAt: new Date() },
  });
  revalidatePath(`/admin/tables/${tableId}`);
}

const addItemSchema = z.object({
  name: z.string().trim().min(1).max(60),
  unitPriceAmd: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(100),
});

export async function addBillItemAction(tableId: string, billId: string, formData: FormData) {
  const business = await requireBusiness();
  await ownedTable(business.id, tableId);

  const bill = await db.bill.findFirst({
    where: { id: billId, businessId: business.id, status: "OPEN" },
  });
  if (!bill) throw new Error("Bill not open");

  const menuItemId = formData.get("menuItemId");
  if (menuItemId && typeof menuItemId === "string" && menuItemId !== "") {
    const menuItem = await db.menuItem.findFirst({
      where: { id: menuItemId, businessId: business.id },
    });
    if (!menuItem) throw new Error("Menu item not found");
    const quantity = z.coerce.number().int().positive().max(100).parse(formData.get("quantity"));

    await db.billItem.create({
      data: {
        billId: bill.id,
        name: menuItem.name,
        unitPriceAmd: menuItem.priceAmd,
        quantity,
      },
    });
  } else {
    const { name, unitPriceAmd, quantity } = addItemSchema.parse({
      name: formData.get("name"),
      unitPriceAmd: formData.get("unitPriceAmd"),
      quantity: formData.get("quantity"),
    });

    await db.billItem.create({ data: { billId: bill.id, name, unitPriceAmd, quantity } });
  }

  revalidatePath(`/admin/tables/${tableId}`);
}

export async function removeBillItemAction(tableId: string, billItemId: string) {
  const business = await requireBusiness();
  await ownedTable(business.id, tableId);

  await db.billItem.deleteMany({
    where: { id: billItemId, quantityPaid: 0, bill: { businessId: business.id } },
  });
  revalidatePath(`/admin/tables/${tableId}`);
}
