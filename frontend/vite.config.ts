import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BASE_URL || 'http://localhost:5002',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    build: {
      // Generate sourcemaps for better debugging
      sourcemap: true,
      // Skip TypeScript checking during build
      typescript: {
        noEmit: false,
        noChecks: true
      },
      // Improve output file structure
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            redux: ['redux', 'react-redux', '@reduxjs/toolkit'],
          }
        }
      }
    },
    // Properly handle 404s for SPA
    preview: {
      port: 4173,
      host: true
    }
  }
})
