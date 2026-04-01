import { LoginForm } from "@/components/login-form";
import { auth } from "@/auth";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import heroImage from "../../../static/header-solar-energy-photovoltaics-1150x650.webp";

export const metadata: Metadata = {
  title: "Sign in | Greenquote",
};

function LoginHeroPanel({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[var(--primary)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--card-border)] ${className ?? ""}`}
    >
      <Image
        src={heroImage}
        alt="Solar panels on a roof, representing clean energy"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover object-center"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/25 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
          Greenquote
        </p>
        <p className="mt-2 max-w-sm text-lg font-semibold leading-snug tracking-tight sm:text-xl">
          Clear quotes for cleaner energy.
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-emerald-50/90">
          Sign in to review and manage your solar estimates in one place.
        </p>
      </div>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session) {
    redirect(params.callbackUrl ?? "/quotes");
  }

  const registered = params.registered === "1";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="order-1 flex flex-col justify-center bg-gradient-to-br from-[var(--accent-soft)]/80 via-[var(--background)] to-[var(--background)] px-4 pb-6 pt-8 sm:px-8 sm:pb-10 sm:pt-12 lg:order-1 lg:min-h-screen lg:p-10 lg:pb-10 lg:pt-10">
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none lg:flex lg:min-h-0 lg:flex-1 lg:items-center">
          <div className="relative aspect-[1150/650] w-full lg:aspect-auto lg:min-h-[min(520px,70vh)] lg:flex-1">
            <LoginHeroPanel className="absolute inset-0 h-full min-h-[200px]" />
          </div>
        </div>
      </aside>

      <main className="order-2 flex flex-col items-center justify-center px-4 pb-14 pt-2 sm:px-8 lg:order-2 lg:min-h-screen lg:px-12 lg:pb-12 lg:pt-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
              Greenquote
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--primary)]">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Demo:{" "}
              <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5">
                user@test.com
              </code>{" "}
              or{" "}
              <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5">
                admin@test.com
              </code>{" "}
              — password{" "}
              <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5">
                password123
              </code>
            </p>
          </div>
          {registered ? (
            <p
              className="mb-4 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900"
              role="status"
            >
              Account created. Sign in with your email and password.
            </p>
          ) : null}
          <Suspense
            fallback={
              <div className="h-48 w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--accent-soft)]/40" />
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
