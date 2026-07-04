import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Id de build para detectar "hay versión nueva" (se compara contra /version.json).
const BUILD_ID = String(Date.now())

// https://vite.dev/config/
export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ v: BUILD_ID }) })
      },
    },
  ],
  server: {
    port: 5173,
    open: true,
  },
})
