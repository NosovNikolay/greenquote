import { registerDemoUser } from "@/lib/demo-users";
import { registerFormSchema } from "@/lib/validation/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { fullName, email, password } = parsed.data;
  const apiUrl = process.env.API_URL?.replace(/\/$/, "");

  if (apiUrl) {
    const res = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    if (res.status === 409) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 },
      );
    }
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Registration failed" },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const builtIn = ["admin@test.com", "user@test.com"];
  const normalized = email.toLowerCase().trim();
  if (builtIn.includes(normalized)) {
    return NextResponse.json(
      { error: "This email is reserved for demo accounts" },
      { status: 409 },
    );
  }

  const out = registerDemoUser(normalized, password, fullName);
  if (!out.ok) {
    return NextResponse.json(
      { error: "Email is already registered" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
