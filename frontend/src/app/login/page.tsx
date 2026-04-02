import { LoginForm } from "@/components/login-form";
import { auth } from "@/auth";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import loginHeroImage from "../../../public/header-solar-energy-photovoltaics-1150x650.webp";

export const metadata: Metadata = {
  title: "Sign in | Greenquote",
};

function LoginMarketingPanel() {
  return (
    <div className="relative flex min-h-[42vh] flex-col justify-end lg:min-h-screen">
      <Image
        src={loginHeroImage}
        alt="Solar panels on a roof — photovoltaics and clean energy"
        fill
        priority
        placeholder="blur"
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover object-center"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1628]/95 via-[#0a1628]/55 to-[#0a1628]/20"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-1 flex-col justify-end p-8 text-white sm:p-10 lg:p-12 lg:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/95">
          Our mission
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:max-w-lg lg:text-[2.35rem] lg:leading-[1.15]">
          Green energy for a cleaner world
        </h2>
        <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-emerald-50/95 sm:text-lg">
          <p>
            We help families and communities switch to renewable power with
            clarity and confidence.
          </p>
          <p>
            Every solar quote we deliver is a small step toward lower emissions,
            cleaner air, and a more sustainable planet. Together we can power
            homes from the sun and leave a lighter footprint for the next
            generation.
          </p>
        </div>
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
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:min-h-screen lg:grid-cols-2">
      <main className="order-1 flex flex-col justify-center px-5 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-14 lg:order-1 lg:px-12 lg:pb-16 lg:pt-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <p className="text-4xl font-black tracking-tight text-[var(--primary)] sm:text-5xl lg:text-6xl">
            Greenquote
          </p>
          <div className="mt-8 lg:mt-10">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
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
              className="mb-4 mt-6 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900"
              role="status"
            >
              Account created. Sign in with your email and password.
            </p>
          ) : null}
          <div className={registered ? "mt-4" : "mt-8"}>
            <Suspense
              fallback={
                <div className="h-48 w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--accent-soft)]/40" />
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      <aside className="order-2 lg:order-2 lg:min-h-screen">
        <LoginMarketingPanel />
      </aside>
    </div>
  );
}
