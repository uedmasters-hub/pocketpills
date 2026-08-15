import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { ServerResponse } from "node:http";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (_err, _req, res) => {
            const r = res as ServerResponse;
            if (!r.headersSent) {
              r.writeHead(502, { "Content-Type": "application/json" });
            }
            r.end(
              JSON.stringify({
                error: "API server is not running. Restart with npm run dev.",
              }),
            );
          });
        },
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Ship source maps: a minified "r is not a function" is undiagnosable.
    // Browsers only fetch maps when devtools is open, so runtime cost is nil.
    sourcemap: true,
  },
});
