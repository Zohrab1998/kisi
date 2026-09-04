import Link from "next/link";
import { requireBusiness } from "@/lib/current-business";
import { logoutAction } from "../(auth)/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await requireBusiness();

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-neutral-900 bg-black">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-lg font-extrabold tracking-tight text-white">
              KI<span className="text-orange-500">SI</span>
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">{business.name}</p>
              <p className="text-xs text-neutral-500">{business.email}</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-neutral-400">
            <Link href="/admin" className="hover:text-white">
              Tables
            </Link>
            <Link href="/admin/menu" className="hover:text-white">
              Menu
            </Link>
            <Link href="/admin/orders" className="hover:text-white">
              Orders
            </Link>
            <Link href="/admin/settings" className="hover:text-white">
              Settings
            </Link>
            <form action={logoutAction}>
              <button className="text-neutral-500 hover:text-white">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
