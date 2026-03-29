/**
 * Real Talk 7 – TTS (Advanced): 서버 텍스트 응답 + 브라우저 발화
 * `tts-voices-by-level.json` → advanced (남성 힌트)
 */

import { TTS_VOICES_BY_LEVEL } from './config/ttsVoicesByLevel';
import { speakBrowserTTS, stopBrowserTTS } from './browserSpeechTTS';

const VOICE = TTS_VOICES_BY_LEVEL.advanced;

export function speak(text: string, onEnd?: () => void): void {
  if (!text.trim()) {
    onEnd?.();
    return;
  }
  void speakBrowserTTS(VOICE, text, onEnd);
}

export function stopSpeaking(): void {
  stopBrowserTTS();
}
