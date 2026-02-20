/**
 * Real Talk 3 – TTS (OpenAI TTS 또는 VoiceRSS)
 * 서버 프록시 /api/tts 사용 → OPENAI_API_KEY 있으면 OpenAI TTS, 없으면 VoiceRSS
 * API 키는 .env에만 (클라이언트 노출 없음)
 */

let currentAudio: HTMLAudioElement | null = null;
/** 요청 순서: 동시에 여러 speak()가 완료될 때 최신만 재생 (겹침 방지) */
let speakSeq = 0;

const VOICE = 'nova'; // 미국식 여성 음성 (American female)
const SPEED = 0.77; // 1/1.3, 초등 저학년에 맞게 조금 느리게

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
    if (mySeq !== speakSeq) return; // 새 요청이 들어왔으면 재생하지 않음
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
