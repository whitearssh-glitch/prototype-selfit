/**
 * TTS 음성 설정 — localStorage 기반 런타임 override
 * 저장 키: 'tts-voice-settings'
 */
import { OPENAI_TTS_VOICE_IDS, TTS_VOICES_BY_LEVEL } from './config/ttsVoicesByLevel';
import type { TtsVoiceConfigKey } from './config/ttsVoicesByLevel';

export type { TtsVoiceConfigKey };

export type VoiceSetting =
  | { mode: 'openai'; voice: string }     // OpenAI TTS API 재생
  | { mode: 'browser'; voiceName: string }; // 브라우저 SpeechSynthesis 직접 재생

const STORAGE_KEY = 'tts-voice-settings';
const VALID_OPENAI = new Set<string>(OPENAI_TTS_VOICE_IDS);

function defaultSetting(key: TtsVoiceConfigKey): VoiceSetting {
  return { mode: 'openai', voice: TTS_VOICES_BY_LEVEL[key] };
}

function load(): Partial<Record<TtsVoiceConfigKey, VoiceSetting>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<TtsVoiceConfigKey, VoiceSetting>>) : {};
  } catch {
    return {};
  }
}

const overrides: Partial<Record<TtsVoiceConfigKey, VoiceSetting>> = load();

export function getVoiceSetting(key: TtsVoiceConfigKey): VoiceSetting {
  const s = overrides[key];
  if (!s) return defaultSetting(key);
  if (s.mode === 'openai' && VALID_OPENAI.has(s.voice)) return s;
  if (s.mode === 'browser' && s.voiceName) return s;
  return defaultSetting(key);
}

export function setVoiceSetting(key: TtsVoiceConfigKey, setting: VoiceSetting): void {
  overrides[key] = setting;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}
