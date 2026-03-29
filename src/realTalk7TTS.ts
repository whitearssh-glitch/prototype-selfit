/**
 * Real Talk 7 – TTS (Advanced: Adv A)
 * 남성 음성 — `tts-voices-by-level.json` → advanced
 */

import { VOICE_SPEED } from './config/voiceSpeed';
import { TTS_VOICES_BY_LEVEL } from './config/ttsVoicesByLevel';

let currentAudio: HTMLAudioElement | null = null;
let speakSeq = 0;

const VOICE = TTS_VOICES_BY_LEVEL.advanced;

async function speakVoiceRSS(text: string, onEnd?: () => void): Promise<void> {
  const mySeq = ++speakSeq;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), voice: VOICE, speed: VOICE_SPEED.ttsSpeed }),
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

export function speak(text: string, onEnd?: () => void): void {
  if (!text.trim()) {
    onEnd?.();
    return;
  }
  stopSpeaking();
  speakVoiceRSS(text, onEnd);
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
