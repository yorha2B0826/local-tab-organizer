import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { manifest } from "./src/manifest";

function chromeManifestPlugin(): Plugin {
  return {
    name: "local-tab-organizer-manifest",
    generateBundle() {
      mkdirSync("dist", { recursive: true });
      writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 2));
    }
  };
}

export default defineConfig({
  plugins: [react(), chromeManifestPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        serviceWorker: resolve(__dirname, "src/background/serviceWorker.ts")
      },
      output: {
        entryFileNames: (chunk) => chunk.name === "serviceWorker" ? "serviceWorker.js" : "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  },
  test: {
    environment: "node",
    globals: true
  }
});
