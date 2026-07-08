import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para el frontend del Sistema Administrativo de Transporte.
export default defineConfig({
  base: '/transporte/',
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    open: false,
  },
});
