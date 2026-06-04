import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readProductVersion(): string {
  const fromEnv = process.env.VITE_APP_VERSION?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  for (const candidate of [
    resolve(__dirname, "VERSION"),
    resolve(__dirname, "../VERSION"),
  ]) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf-8").trim();
    }
  }
  throw new Error("VERSION file not found (expected frontend/VERSION or repo root VERSION)");
}

const productVersion = readProductVersion();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(productVersion),
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/notes": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
