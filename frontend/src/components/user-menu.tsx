"use client";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

type Props = {
  email: string;
  isAdmin: boolean;
};

export function UserMenu({ email, isAdmin }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="flex max-w-[220px] items-center gap-2 rounded-[var(--radius-md)] border border-transparent px-3 py-2 text-left text-sm text-[var(--muted)] hover:border-[var(--card-border)] hover:bg-[var(--accent-soft)]/60"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="user-menu-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate" title={email}>
          {email}
        </span>
        <span className="shrink-0 text-xs opacity-70" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            id="user-menu-panel"
            role="menu"
            className="absolute right-0 z-50 mt-1 min-w-[220px] rounded-[var(--radius-md)] border border-[var(--card-border)] bg-white py-1 shadow-[var(--shadow-soft)]"
          >
            {isAdmin ? (
              <Link
                role="menuitem"
                href="/admin"
                className="block px-4 py-2.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--accent-soft)]/50"
                onClick={() => setOpen(false)}
              >
                Admin console
              </Link>
            ) : null}
            <div className="border-t border-[var(--card-border)] px-2 py-2">
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full justify-center"
                  role="menuitem"
                >
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
