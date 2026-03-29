/**
 * Real Talk 3·4·5 – TTS (OpenAI TTS 또는 VoiceRSS)
 * Basic 구간: 화면별 여성 음성 (`tts-voices-by-level.json` basicRealTalk3/4/5)
 */

import { VOICE_SPEED } from './config/voiceSpeed';
import { TTS_VOICES_BY_LEVEL } from './config/ttsVoicesByLevel';

let currentAudio: HTMLAudioElement | null = null;
/** 요청 순서: 동시에 여러 speak()가 완료될 때 최신만 재생 (겹침 방지) */
let speakSeq = 0;

async function speakVoiceRSS(voice: string, text: string, onEnd?: () => void): Promise<void> {
  const mySeq = ++speakSeq;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), voice, speed: VOICE_SPEED.ttsSpeed }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.warn('[TTS]', (err as { error?: string }).error);
      onEnd?.();
      return;
    }
    const blob = await res.blob();
    if (mySeq !== speakSeq) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      onEnd?.();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      console.warn('[TTS] play error', e);
      currentAudio = null;
      onEnd?.();
    };
    await audio.play();
  } catch (e) {
    console.warn('[TTS] play error', e);
    currentAudio = null;
    if (mySeq === speakSeq) onEnd?.();
  }
}

function speakWithVoice(voice: string, text: string, onEnd?: () => void): void {
  if (!text.trim()) {
    onEnd?.();
    return;
  }
  stopSpeaking();
  speakVoiceRSS(voice, text, onEnd);
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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
