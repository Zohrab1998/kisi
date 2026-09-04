import Link from "next/link";
import { requireBusiness } from "@/lib/current-business";
import { logoutAction } from "../(auth)/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await requireBusiness();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{business.name}</p>
            <p className="text-xs text-neutral-500">{business.email}</p>
          </div>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            <Link href="/admin" className="hover:text-neutral-900">
              Tables
            </Link>
            <Link href="/admin/menu" className="hover:text-neutral-900">
              Menu
            </Link>
            <Link href="/admin/orders" className="hover:text-neutral-900">
              Orders
            </Link>
            <Link href="/admin/settings" className="hover:text-neutral-900">
              Settings
            </Link>
            <form action={logoutAction}>
              <button className="text-neutral-400 hover:text-neutral-900">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
