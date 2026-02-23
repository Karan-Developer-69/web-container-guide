import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        connect: resolve(__dirname, 'connect.html'),
        loading: resolve(__dirname, 'loading.html'),
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  plugins: [
    {
      name: 'configure-connect-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/connect.html' || req.url?.startsWith('/webcontainer/connect/')) {
            res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
            res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
          }
          next();
        });
      },
    },
  ],
});