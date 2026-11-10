import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = process.env.API_URL || 'http://localhost:5001';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': api, '/uploads': api } },
});
