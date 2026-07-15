import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.APPWRITE_ENDPOINT": JSON.stringify(
        process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1"
      ),
      "process.env.APPWRITE_PROJECT_ID": JSON.stringify(
        process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || ""
      ),
      "process.env.APPWRITE_DATABASE_ID": JSON.stringify(
        process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || ""
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
