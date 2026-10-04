import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  preview: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
});
