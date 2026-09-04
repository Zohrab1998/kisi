import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900">Kisi</h1>
      <p className="mt-3 max-w-md text-neutral-500">
        Scan the QR at your table, split or select what you&apos;re paying for, add a tip, and pay
        with Idram or a Visa/Mastercard — no app install needed.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/signup"
          className="rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
        >
          Set up your restaurant
        </Link>
        <Link
          href="/admin/login"
          className="rounded-md border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-900"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
