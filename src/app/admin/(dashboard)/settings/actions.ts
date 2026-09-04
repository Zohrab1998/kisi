"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/current-business";

export async function setOrderingEnabledAction(formData: FormData) {
  const business = await requireBusiness();
  const enabled = formData.get("orderingEnabled") === "on";

  await db.business.update({ where: { id: business.id }, data: { orderingEnabled: enabled } });
  revalidatePath("/admin/settings");
}

const serviceFeeSchema = z.coerce.number().min(0).max(30);

export async function setServiceFeePercentAction(formData: FormData) {
  const business = await requireBusiness();
  const serviceFeePercent = serviceFeeSchema.parse(formData.get("serviceFeePercent"));

  await db.business.update({ where: { id: business.id }, data: { serviceFeePercent } });
  revalidatePath("/admin/settings");
}
