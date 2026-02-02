import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { whisperTranscribeMiddleware } from './server/whisper-proxy.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [
      react(),
      {
        name: 'whisper-transcribe',
        configureServer(server) {
          server.middlewares.use(whisperTranscribeMiddleware());
        },
      },
    ],
  };
});
