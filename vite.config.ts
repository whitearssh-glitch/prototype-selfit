import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __viteDir = path.dirname(fileURLToPath(import.meta.url));

function injectPreviewVoiceScripts(): string {
  const speed = { ttsSpeed: 1, browserUtteranceRate: 1, lecturePlaybackRate: 1 };
  const voices = { basic: 'shimmer', intermediate: 'coral', advanced: 'sage' };
  try {
    Object.assign(speed, JSON.parse(readFileSync(path.resolve(__viteDir, 'src/config/voice-speed.json'), 'utf8')));
  } catch {
    /* ignore */
  }
  try {
    Object.assign(voices, JSON.parse(readFileSync(path.resolve(__viteDir, 'src/config/tts-voices-by-level.json'), 'utf8')));
  } catch {
    /* ignore */
  }
  return `<script>window.__VOICE_SPEED__=${JSON.stringify(speed)};window.__TTS_VOICES_BY_LEVEL__=${JSON.stringify(voices)};</script>`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [
      {
        name: 'inject-preview-voice-config',
        transformIndexHtml(html, ctx) {
          if (!ctx.path?.endsWith('preview.html')) return html;
          return html.replace('<head>', `<head>\n  ${injectPreviewVoiceScripts()}`);
        },
      },
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
