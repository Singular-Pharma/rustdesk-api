import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
    ],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
    server: {
      port: 4300,
      proxy: {
        "/api/admin": {
          target:
            env.API_PROXY_TARGET || "https://remoto-api.singularpharma.com.br",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
