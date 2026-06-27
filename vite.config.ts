import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.VITE_PORT || env.PORT || '5002', 10);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: port,
    },
    preview: {
      port: port,
      strictPort: true,
    },
  };
})
