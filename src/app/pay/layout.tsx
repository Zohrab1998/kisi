export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex justify-center border-b border-neutral-900 py-5">
        <span className="text-2xl font-extrabold tracking-tight">
          KI<span className="text-orange-500">SI</span>
        </span>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
