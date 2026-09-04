"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Business name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/admin/signup?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { name, email, password } = parsed.data;

  const existing = await db.business.findUnique({ where: { email } });
  if (existing) {
    redirect(`/admin/signup?error=${encodeURIComponent("An account with that email already exists")}`);
  }

  const business = await db.business.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });

  await createSession(business.id);
  redirect("/admin");
}

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/admin/login?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { email, password } = parsed.data;
  const business = await db.business.findUnique({ where: { email } });
  const ok = business ? await verifyPassword(password, business.passwordHash) : false;

  if (!business || !ok) {
    redirect(`/admin/login?error=${encodeURIComponent("Invalid email or password")}`);
  }

  await createSession(business.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
