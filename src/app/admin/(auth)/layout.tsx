export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12">
      <div className="mb-8 text-3xl font-extrabold tracking-tight text-white">
        KI<span className="text-orange-500">SI</span>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        {children}
      </div>
    </div>
  );
}
