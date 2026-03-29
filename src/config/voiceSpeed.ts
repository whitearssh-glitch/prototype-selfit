/**
 * 음성/TTS 속도 단일 설정: `src/config/voice-speed.json`만 수정하면
 * React(브라우저 발화 rate, Speed Up 강의), /api/tts 요청 body, preview(Vite 주입)에 반영됩니다.
 */
import raw from './voice-speed.json';

type VoiceSpeedJson = {
  ttsSpeed?: number;
  browserUtteranceRate?: number;
  lecturePlaybackRate?: number;
};

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

const r = raw as VoiceSpeedJson;

const tts = Number(r.ttsSpeed);
const browser = Number(r.browserUtteranceRate);
const lecture = Number(r.lecturePlaybackRate);

/** `/api/tts` 요청 시 body.speed (서버는 로깅·호환용; 발화 속도는 browserUtteranceRate) */
export const VOICE_SPEED = {
  ttsSpeed: clamp(Number.isFinite(tts) ? tts : 1, 0.25, 4),
  /** Web Speech API SpeechSynthesisUtterance.rate (브라우저마다 범위 다름, 대략 0.1–2) */
  browserUtteranceRate: clamp(Number.isFinite(browser) ? browser : 1, 0.1, 2),
  /** 강의 MP3 HTMLAudioElement.playbackRate */
  lecturePlaybackRate: clamp(Number.isFinite(lecture) ? lecture : 1, 0.25, 4),
} as const;
