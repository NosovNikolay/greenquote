import { auth } from "@/auth";
import { UserMenu } from "@/components/user-menu";
import Link from "next/link";

export async function AppHeader() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <Link
          href="/quotes"
          className="shrink-0 text-sm font-semibold tracking-tight text-[var(--primary)]"
        >
          Greenquote
        </Link>
        <nav
          className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3"
          aria-label="Main"
        >
          <Link
            href="/quotes"
            className="rounded-[var(--radius-sm)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
          >
            My quotes
          </Link>
          <Link
            href="/new"
            className="rounded-[var(--radius-sm)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
          >
            New quote
          </Link>
          <div className="ml-1 flex items-center gap-2 border-l border-[var(--card-border)] pl-4 sm:ml-2 sm:pl-5">
            <UserMenu
              email={session.user.email ?? ""}
              isAdmin={isAdmin}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
