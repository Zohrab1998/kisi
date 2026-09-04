import Link from "next/link";
import { signupAction } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold text-white">Create your account</h1>
      <p className="mt-1 text-sm text-neutral-400">Set up your restaurant, cafe, bar, or pub.</p>

      {error && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <form action={signupAction} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Business name
          <input
            name="name"
            required
            placeholder="Cascade Cafe"
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
          />
        </label>
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
            minLength={8}
            className="rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-400">
        Already have an account?{" "}
        <Link href="/admin/login" className="font-medium text-orange-500 underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
