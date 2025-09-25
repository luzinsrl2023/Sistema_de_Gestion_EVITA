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
        },
        // Ensure consistent chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Improve module pre-bundling
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  // Add base path for Netlify deployment
  base: './',
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
});