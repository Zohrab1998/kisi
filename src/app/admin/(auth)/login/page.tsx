import Link from "next/link";
import { loginAction } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage your tables, bills, and payments.</p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={loginAction} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-500">
        No account yet?{" "}
        <Link href="/admin/signup" className="font-medium text-neutral-900 underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
