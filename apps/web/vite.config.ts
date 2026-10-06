import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Inside the compose network the API is reachable by service name; on the host it is
// localhost. docker-compose.dev.yml sets VITE_API_PROXY_TARGET for the container.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000'

// Docker Desktop bind mounts from a Windows host do not deliver inotify events into the
// Linux container, so HMR would never fire. docker-compose.dev.yml sets CHOKIDAR_USEPOLLING
// to switch the watcher to polling there; host-native `npm run dev:web` keeps native events.
const usePolling = process.env.CHOKIDAR_USEPOLLING === 'true'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': apiProxyTarget },
    watch: { usePolling, interval: 300 },
  },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'], include: ['tests/**/*.test.tsx'] },
})
