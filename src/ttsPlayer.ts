/**
 * 통합 TTS 플레이어 — VoiceSetting 모드에 따라 OpenAI 또는 SpeechSynthesis로 재생
 *
 * AudioContext를 한 번 unlock하면 이후 사용자 제스처 없이도 재생 가능.
 * unlockAudioContext()는 최초 사용자 클릭 시점(GO 버튼 등)에 호출해야 함.
 */
import { getVoiceSetting, type TtsVoiceConfigKey } from './ttsVoiceSettings';
import { speakBrowserTTS, speakBrowserTTSDirect, stopBrowserTTS } from './browserSpeechTTS';
import { VOICE_SPEED } from './config/voiceSpeed';

// ── AudioContext (한 번 resume되면 이후 제스처 불필요) ──────────────────────
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** GO 버튼 등 사용자 제스처 핸들러 내에서 1회 호출 */
export function unlockAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // 무음 버퍼 재생으로 iOS Safari unlock
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

// ── 재생 상태 ───────────────────────────────────────────────────────────────
let currentSource: AudioBufferSourceNode | null = null;
let playSeq = 0;

export function stopTtsPlayer(): void {
  playSeq++;
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
    currentSource = null;
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
      const arrayBuffer = await res.arrayBuffer();
      if (seq !== playSeq) return;

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      if (seq !== playSeq) return;

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (seq !== playSeq) return;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSource = source;
      source.onended = () => {
        if (seq === playSeq) { currentSource = null; onEnd?.(); }
      };
      source.start(0);
    } catch {
      // decodeAudioData 실패 또는 기타 오류 → SpeechSynthesis 폴백
      currentSource = null;
      if (seq === playSeq) {
        await speakBrowserTTS(setting.voice, trimmed, onEnd);
      }
    }
  } else {
    // browser mode — 특정 SpeechSynthesis 음성으로 직접 재생
    void speakBrowserTTSDirect(setting.voiceName, trimmed, onEnd);
  }
}
