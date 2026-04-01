import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findRegisteredDemoUser } from "@/lib/demo-users";

const demoUsers: Record<
  string,
  { password: string; name: string; role: "user" | "admin" }
> = {
  "admin@test.com": {
    password: process.env.DEMO_ADMIN_PASSWORD ?? "password123",
    name: "Admin User",
    role: "admin",
  },
  "user@test.com": {
    password: process.env.DEMO_USER_PASSWORD ?? "password123",
    name: "Demo User",
    role: "user",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? user.email ?? "";
        token.role = user.role;
        token.accessToken = (
          user as { accessToken?: string }
        ).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin";
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const email =
          typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";
        if (!email || !password) return null;

        const apiUrl = process.env.API_URL?.replace(/\/$/, "");
        if (apiUrl) {
          try {
            const res = await fetch(`${apiUrl}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
              return null;
            }
            const data = (await res.json()) as {
              access_token: string;
              user: {
                id: string;
                email: string;
                fullName: string;
                role: string;
              };
            };
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.fullName,
              role: data.user.role as "user" | "admin",
              accessToken: data.access_token,
            };
          } catch {
            return null;
          }
        }

        const row = demoUsers[email] ?? findRegisteredDemoUser(email);
        if (!row || row.password !== password) return null;
        return {
          id: email,
          email,
          name: row.name,
          role: row.role,
        };
      },
    }),
  ],
});
