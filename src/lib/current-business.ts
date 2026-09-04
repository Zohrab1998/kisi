import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionBusinessId } from "@/lib/auth";

export async function requireBusiness() {
  const businessId = await getSessionBusinessId();
  if (!businessId) redirect("/admin/login");

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) redirect("/admin/login");

  return business;
}
