import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer'; // Assuming this is installed

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Put the Sentry vite plugin after all other plugins
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || "your-sentry-org", // Use env var or placeholder
      project: process.env.SENTRY_PROJECT || "your-sentry-project", // Use env var or placeholder
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemapExclude: ["node_modules"],
      include: ["./src"],
      ignore: ["node_modules"],
    }),
    visualizer({
      open: true, // Opens the report in your browser
      brotliSize: true, // Show brotli compressed size
      filename: "bundle-analysis.html", // Output file name
    }),
  ],
  build: {
    sourcemap: true, // Source maps are required for Sentry
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
});