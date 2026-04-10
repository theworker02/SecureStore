import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./frontend", import.meta.url)),
    },
  },
  server: {
    host: process.env.SECURESTORE_DEV_HOST ?? "127.0.0.1",
    port: Number(process.env.SECURESTORE_DEV_PORT ?? 1420),
    strictPort: process.env.SECURESTORE_DEV_STRICT_PORT === "true",
  },
});
