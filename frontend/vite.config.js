import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";


export default defineConfig({
  base: process.env.PAGES_BASE_PATH || "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
    fs: {
      allow: [resolve(__dirname, "..")],
    },
  },
  preview: {
    port: 4173,
  },
});
