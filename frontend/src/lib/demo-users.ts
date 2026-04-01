/** In-memory registrations when API_URL is unset (demo credentials auth). */

export type DemoUserRow = {
  password: string;
  name: string;
  role: "user" | "admin";
};

const registered = new Map<string, DemoUserRow>();

export function registerDemoUser(
  email: string,
  password: string,
  name: string,
): { ok: true } | { ok: false; reason: "exists" } {
  const key = email.toLowerCase().trim();
  if (registered.has(key)) {
    return { ok: false, reason: "exists" };
  }
  registered.set(key, { password, name, role: "user" });
  return { ok: true };
}

export function findRegisteredDemoUser(
  email: string,
): DemoUserRow | undefined {
  return registered.get(email.toLowerCase().trim());
}
