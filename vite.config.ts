
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // This ensures process.env.API_KEY works in the browser after building
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
  }
});
