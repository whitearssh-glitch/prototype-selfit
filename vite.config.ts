import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { whisperTranscribeMiddleware } from './server/whisper-proxy.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'whisper-transcribe',
      configureServer(server) {
        server.middlewares.use(whisperTranscribeMiddleware());
      },
    },
  ],
});
