import Link from "next/link";
import { loginAction } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold text-white">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-400">Manage your tables, bills, and payments.</p>

      {error && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <form action={loginAction} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-400">
        No account yet?{" "}
        <Link href="/admin/signup" className="font-medium text-orange-500 underline">
          Create one
        </Link>
      </p>
    </>
  );
}
