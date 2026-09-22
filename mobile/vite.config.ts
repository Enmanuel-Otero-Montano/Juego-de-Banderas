import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@capacitor') || id.includes('@revenuecat')) return 'native-services';
          if (id.includes('world-countries') || id.includes('country-json')) return 'country-data';
          if (id.includes('react') || id.includes('lucide-react')) return 'ui-vendor';
          return undefined;
        },
      },
    },
  },
});
