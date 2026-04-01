import { createGreenquoteClient } from "@greenquote/sdk";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Server-only typed client for the Nest API. Returns null when `API_URL` is unset (local BFF-only mode).
 */
export function createServerSdk(req: NextRequest) {
  const baseUrl = process.env.API_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    return null;
  }
  return createGreenquoteClient({
    baseUrl,
    getAccessToken: async () => {
      const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
      });
      return token?.accessToken as string | undefined;
    },
  });
}
