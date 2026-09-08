import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Ledger Khata",
        short_name: "Ledger",
        description: "Dealer ledger book with photo scan import",
        theme_color: "#1d4ed8",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
