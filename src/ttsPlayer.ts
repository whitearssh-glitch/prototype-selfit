/**
 * 통합 TTS 플레이어 — VoiceSetting 모드에 따라 OpenAI 또는 SpeechSynthesis로 재생
 */
import { getVoiceSetting, type TtsVoiceConfigKey } from './ttsVoiceSettings';
import { speakBrowserTTS, speakBrowserTTSDirect, stopBrowserTTS } from './browserSpeechTTS';
import { VOICE_SPEED } from './config/voiceSpeed';

let currentAudio: HTMLAudioElement | null = null;
let playSeq = 0;

export function stopTtsPlayer(): void {
  playSeq++;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  stopBrowserTTS();
}

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
        // 서버 오류 → SpeechSynthesis 폴백
        await speakBrowserTTS(setting.voice, trimmed, seq === playSeq ? onEnd : undefined);
        return;
      }
      const blob = await res.blob();
      if (seq !== playSeq) return;
      url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url!);
        if (seq === playSeq) { currentAudio = null; onEnd?.(); }
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url!);
        if (seq === playSeq) { currentAudio = null; onEnd?.(); }
      };
      await audio.play();
    } catch {
      // audio.play() autoplay 차단 or 네트워크 오류 → SpeechSynthesis 폴백
      if (url) { URL.revokeObjectURL(url); }
      currentAudio = null;
      if (seq === playSeq) {
        await speakBrowserTTS(setting.voice, trimmed, onEnd);
      }
    }
  } else {
    // browser mode — 특정 SpeechSynthesis 음성으로 직접 재생
    void speakBrowserTTSDirect(setting.voiceName, trimmed, onEnd);
  }
}
