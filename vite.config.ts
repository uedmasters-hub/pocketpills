import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
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
