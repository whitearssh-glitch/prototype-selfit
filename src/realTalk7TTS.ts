/**
 * Real Talk 7 – TTS (남자 음성)
 * Real Talk 6과 동일. voice='onyx' (남성) 사용.
 */

let currentAudio: HTMLAudioElement | null = null;
let speakSeq = 0;

const VOICE = 'onyx'; // 미국식 남성 음성 (American male)
const SPEED = 0.77;

async function speakVoiceRSS(text: string, onEnd?: () => void): Promise<void> {
  const mySeq = ++speakSeq;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), voice: VOICE, speed: SPEED }),
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
