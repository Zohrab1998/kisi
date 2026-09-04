"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/current-business";
import type { OrderStatus } from "@/generated/prisma/enums";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PLACED: "ACKNOWLEDGED",
  ACKNOWLEDGED: "PREPARING",
  PREPARING: "DELIVERED",
};

export async function advanceOrderStatusAction(orderId: string) {
  const business = await requireBusiness();
  const order = await db.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) return;

  const next = NEXT_STATUS[order.status];
  if (!next) return;

  await db.order.update({ where: { id: order.id }, data: { status: next } });
  revalidatePath("/admin/orders");
}

export async function cancelOrderAction(orderId: string) {
  const business = await requireBusiness();
  await db.order.updateMany({
    where: { id: orderId, businessId: business.id },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/admin/orders");
}
