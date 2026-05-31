import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "ba00-2806-2f0-9180-ffcb-4122-5721-7e04-a8d4.ngrok-free.app",
    ],
  },
});
