import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Dev tunnels (cloudflared/ngrok) serve on a random hostname; without this Vite
    // rejects them as an unknown host.
    allowedHosts: true,
    proxy: { '/api': 'http://localhost:8000' },
  },
})
