import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for better caching
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['lucide-react', '@headlessui/react'],
          'utils': ['clsx', 'tailwind-merge'],
        }
      }
    }
  }
});
