"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/current-business";

export async function setOrderingEnabledAction(formData: FormData) {
  const business = await requireBusiness();
  const enabled = formData.get("orderingEnabled") === "on";

  await db.business.update({ where: { id: business.id }, data: { orderingEnabled: enabled } });
  revalidatePath("/admin/settings");
}
