import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: 'localhost',
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    },
    headers: {
      // Disable service worker headers
      'Service-Worker-Allowed': 'false',
      'Service-Worker': 'false'
    }
  },
  build: {
    // Disable service worker generation during build
    manifest: false,
    rollupOptions: {
      output: {
        // Prevent service worker generation
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  // Disable service worker in development
  define: {
    'process.env.SERVICE_WORKER': 'false',
    'process.env.PWA': 'false',
    'import.meta.env.VITE_SERVICE_WORKER': 'false'
  },
  // Clear any existing service worker cache
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      }
    }
  },
  // Experimental features to disable PWA
  experimental: {
    renderBuiltUrl: () => {
      return { relative: true }
    }
  }
})
