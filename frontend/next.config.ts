import type { NextConfig } from "next";

if (!process.env.API_URL?.trim()) {
  throw new Error(
    "GreenQuote: API_URL is required (e.g. http://localhost:3001/api). Copy frontend/.env.example to .env.local.",
  );
}

const nextConfig: NextConfig = {
  transpilePackages: ["@greenquote/constants", "@greenquote/sdk"],
};

export default nextConfig;
