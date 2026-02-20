import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [
      react(),
      {
        name: 'whisper-transcribe',
        configureServer(server) {
          // 동적 import: build 시 서버 코드 로드 안 함 (Vercel 등에서 빌드 실패 방지)
          import('./server/whisper-proxy.js').then(({ whisperTranscribeMiddleware }) => {
            server.middlewares.use(whisperTranscribeMiddleware());
          });
        },
      },
    ],
  };
});
