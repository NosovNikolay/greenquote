import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f0f4f2]">
      <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--card-border)] bg-[var(--primary)] text-white">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
            Administration
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">Greenquote</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Admin">
          <Link
            href="/admin/quotes"
            className="rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            All quotes
          </Link>
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10"
          >
            <span aria-hidden>←</span> Back to app
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
