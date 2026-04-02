import createClient from "openapi-fetch";
import type { components, paths } from "./generated/schema.js";

export type { components, paths } from "./generated/schema.js";

export type GreenquoteClient = ReturnType<typeof createGreenquoteClient>;

export function createGreenquoteClient(options: {
  baseUrl: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}) {
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  const client = createClient<paths>({ baseUrl });
  client.use({
    async onRequest({ request }) {
      const token = await options.getAccessToken?.();
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
    },
  });
  return client;
}
