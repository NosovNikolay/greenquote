import { createGreenquoteClient } from "@greenquote/sdk";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { requireApiBaseUrl } from "./api-url";

/**
 * Typed Nest client for **server-side Route Handlers only**.
 * Requires `API_URL` (see `frontend/.env.example`). Quotes and auth always go through Nest.
 *
 * The browser never imports this; it calls `/api/*` (same-origin, cookie session).
 */
export function createServerSdk(req: NextRequest) {
  const baseUrl = requireApiBaseUrl();
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
