/**
 * 학습 단계별 음성 힌트 (서버 /api/tts JSON에 포함 → 브라우저 SpeechSynthesis 보이스 선택)
 * Basic(Real Talk 3·4·5) → 여성 쪽 / Inter·Adv → 남성 쪽
 * 수정: `tts-voices-by-level.json`만 편집 (alloy·shimmer 등 허용 id)
 * 이전 단일 키 `basic`만 있으면 세 Basic 모두 그 값으로 폴백
 */
import raw from './tts-voices-by-level.json';

/** OpenAI `tts-1` / `tts-1-hd` 가 실제로 받는 voice id (미리듣기·프록시와 동일 목록 유지) */
export const OPENAI_TTS_VOICE_IDS = [
  'alloy',
  'ash',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
] as const;

const OPENAI_VOICES = new Set<string>(OPENAI_TTS_VOICE_IDS);

function pick(v: unknown, fallback: string): string {
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  return OPENAI_VOICES.has(s) ? s : fallback;
}

const r = raw as Record<string, string>;

export const TTS_VOICES_BY_LEVEL = {
  basicRealTalk3: pick(r.basicRealTalk3 ?? r.basic, 'shimmer'),
  basicRealTalk4: pick(r.basicRealTalk4 ?? r.basic, 'coral'),
  basicRealTalk5: pick(r.basicRealTalk5 ?? r.basic, 'nova'),
  intermediate: pick(r.intermediate, 'echo'),
  advanced: pick(r.advanced, 'onyx'),
} as const;

export type TtsVoiceConfigKey = keyof typeof TTS_VOICES_BY_LEVEL;

export const TTS_SAMPLE_TEXT = 'Hello, I am happy today.';
