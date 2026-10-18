import { defineConfig } from 'vite';

// Single root .env is the source of truth (see root .env.example).
// Same-origin fetches from the browser are proxied to the sender — no CORS middleware needed.
const sender = process.env.SENDER_URL ?? 'http://localhost:3000';

export default defineConfig({
  envDir: '..',
  server: {
    host: true, // listen on all interfaces (needed inside Docker / LAN dev)
    watch: process.env.DOCKER === '1' ? { usePolling: true } : undefined,
    proxy: {
      '/register-token': sender,
      '/subscribe': sender,
      '/send': sender,
      '/tokens': sender,
    },
  },
});
