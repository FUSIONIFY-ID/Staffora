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
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Both extensions: component tests need .tsx, and a pure-logic test such as
    // tests/roles.test.ts needs no JSX at all. The Playwright suite lives in
    // tests/e2e as .spec.ts and is not matched here.
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Six files, one jsdom environment each. The default is one worker per core, and
    // on a loaded machine the pool intermittently failed to start a fork ("Failed to
    // start forks worker"), which reported as a test failure rather than a slow run.
    // Two workers keeps the suite well under a second while leaving headroom.
    maxWorkers: 2,
  },
})
