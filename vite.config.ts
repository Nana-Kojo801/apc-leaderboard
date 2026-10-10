import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The API uses a SameSite=Strict auth cookie and has no CORS policy, so the
// browser must talk to it on the same origin. In dev, Vite proxies /api to it.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'http://localhost:5008'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: { '/api': { target, changeOrigin: true } },
    },
    preview: {
      proxy: { '/api': { target, changeOrigin: true } },
    },
  }
})
