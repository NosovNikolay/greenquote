import { createGreenquoteClient } from "@greenquote/sdk";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { requireApiBaseUrl } from "./api-url";

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
