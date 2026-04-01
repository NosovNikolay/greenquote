import { RegisterForm } from "@/components/register-form";
import { auth } from "@/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session) {
    redirect("/quotes");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
          Greenquote
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--primary)]">
          Register
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          Create an account to request solar pre-qualification quotes.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
