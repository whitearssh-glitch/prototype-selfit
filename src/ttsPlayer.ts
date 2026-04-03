/**
 * 통합 TTS 플레이어 — VoiceSetting 모드에 따라 OpenAI 또는 SpeechSynthesis로 재생
 *
 * iOS autoplay 정책: 같은 HTMLAudioElement를 재사용하면 user gesture로
 * 한 번 unlock된 뒤 async 콜백에서도 계속 play() 가능.
 * unlockAudioContext()를 GO 버튼 클릭 시 반드시 호출해야 함.
 */
import { getVoiceSetting, type TtsVoiceConfigKey } from './ttsVoiceSettings';
import { speakBrowserTTS, speakBrowserTTSDirect, stopBrowserTTS } from './browserSpeechTTS';
import { VOICE_SPEED } from './config/voiceSpeed';

// ── 공유 오디오 엘리먼트 (GO 클릭 시 unlock, 이후 재사용) ─────────────────
let sharedAudio: HTMLAudioElement | null = null;

/** GO 버튼 등 사용자 제스처 핸들러에서 1회 호출 — 이후 async에서도 play() 가능 */
export function unlockAudioContext(): void {
  if (!sharedAudio) {
    sharedAudio = new Audio();
  }
  // user gesture 컨텍스트 내에서 play()를 호출해 엘리먼트를 unlock
  sharedAudio.play().catch(() => {});
}

// ── 재생 상태 ───────────────────────────────────────────────────────────────
let currentPrevUrl: string | null = null;
let playSeq = 0;

export function stopTtsPlayer(): void {
  playSeq++;
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.onended = null;
    sharedAudio.onerror = null;
  }
  if (currentPrevUrl) {
    URL.revokeObjectURL(currentPrevUrl);
    currentPrevUrl = null;
  }
  stopBrowserTTS();
}

// ── 재생 ────────────────────────────────────────────────────────────────────
export async function playForKey(key: TtsVoiceConfigKey, text: string, onEnd?: () => void): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) { onEnd?.(); return; }

  const setting = getVoiceSetting(key);

  if (setting.mode === 'openai') {
    stopTtsPlayer();
    const seq = ++playSeq;
    let url: string | null = null;
    try {
      const res = await fetch('/api/tts-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, voice: setting.voice, speed: VOICE_SPEED.ttsSpeed }),
      });
      if (seq !== playSeq) return;
      if (!res.ok) {
        await speakBrowserTTS(setting.voice, trimmed, seq === playSeq ? onEnd : undefined);
        return;
      }
      const blob = await res.blob();
      if (seq !== playSeq) return;

      url = URL.createObjectURL(blob);
      currentPrevUrl = url;

      // unlock된 공유 엘리먼트 재사용, 없으면 새로 생성
      const audio = sharedAudio ?? new Audio();
      audio.onended = null;
      audio.onerror = null;
      audio.src = url;

      audio.onended = () => {
        if (url) { URL.revokeObjectURL(url); currentPrevUrl = null; }
        audio.onended = null;
        audio.onerror = null;
        if (seq === playSeq) onEnd?.();
      };
      audio.onerror = () => {
        if (url) { URL.revokeObjectURL(url); currentPrevUrl = null; }
        audio.onended = null;
        audio.onerror = null;
        if (seq === playSeq) onEnd?.();
      };

      await audio.play();
    } catch {
      if (url) { URL.revokeObjectURL(url); currentPrevUrl = null; }
      if (seq === playSeq) {
        await speakBrowserTTS(setting.voice, trimmed, onEnd);
      }
    }
  } else {
    // browser mode — 특정 SpeechSynthesis 음성으로 직접 재생
    void speakBrowserTTSDirect(setting.voiceName, trimmed, onEnd);
  }
}
