"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/current-business";

const nameSchema = z.string().trim().min(1, "Table name is required").max(40);

export async function createTableAction(formData: FormData) {
  const business = await requireBusiness();
  const name = nameSchema.parse(formData.get("name"));

  await db.table.create({ data: { businessId: business.id, name } });
  revalidatePath("/admin");
}
