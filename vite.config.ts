import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Define global constants replacement for the build
    // This allows access to process.env.VARIABLE in client-side code without crashing
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.ADMIN_EMAIL': JSON.stringify(env.ADMIN_EMAIL),
      'process.env.ADMIN_PASSWORD': JSON.stringify(env.ADMIN_PASSWORD),
      'process.env.ENCRYPTION_KEY': JSON.stringify(env.ENCRYPTION_KEY),
      // Fallback object to prevent 'process is not defined' errors
      'process.env': {},
      // Polyfill global for libraries that expect Node.js environment
      'global': 'window',
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['lucide-react', 'cheerio', 'crypto-js', '@google/genai']
          }
        }
      }
    }
  };
});