/**
 * Real Talk 3·4·5 – TTS: POST /api/tts 로 텍스트 확인 후 브라우저 SpeechSynthesis 발화
 * Basic 구간: `tts-voices-by-level.json` 음성 힌트로 남/녀 브라우저 보이스 선택
 */

import { TTS_VOICES_BY_LEVEL } from './config/ttsVoicesByLevel';
import { speakBrowserTTS, stopBrowserTTS } from './browserSpeechTTS';

function speakWithVoice(voice: string, text: string, onEnd?: () => void): void {
  if (!text.trim()) {
    onEnd?.();
    return;
  }
  void speakBrowserTTS(voice, text, onEnd);
}

export function speakRealTalk3(text: string, onEnd?: () => void): void {
  speakWithVoice(TTS_VOICES_BY_LEVEL.basicRealTalk3, text, onEnd);
}

export function speakRealTalk4(text: string, onEnd?: () => void): void {
  speakWithVoice(TTS_VOICES_BY_LEVEL.basicRealTalk4, text, onEnd);
}

export function speakRealTalk5(text: string, onEnd?: () => void): void {
  speakWithVoice(TTS_VOICES_BY_LEVEL.basicRealTalk5, text, onEnd);
}

export function stopSpeaking(): void {
  stopBrowserTTS();
}
