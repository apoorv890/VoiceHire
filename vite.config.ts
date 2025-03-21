import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { ConfigEnv } from 'vite';

// https://vitejs.dev/config/
const PORT = 3000;

// Define API URLs for different environments
const DEV_API_URL = 'http://localhost:5000';
const PROD_API_URL = 'http://localhost:8000';

export default defineConfig(({ mode }: ConfigEnv) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: PORT,
    proxy: {
      '/api': {
        target: DEV_API_URL,
        changeOrigin: true
      }
    }
  },
  define: {
    'process.env.API_URL': JSON.stringify(mode === 'production' ? PROD_API_URL : DEV_API_URL)
  }
}));