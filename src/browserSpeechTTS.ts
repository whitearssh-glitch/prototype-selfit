/**
 * Real Talk 등: POST /api/tts 로 서버에서 발화할 텍스트(JSON)를 받은 뒤
 * 브라우저 SpeechSynthesis로 재생 (OpenAI 오디오 생성 지연 제거)
 */
import { VOICE_SPEED } from './config/voiceSpeed';

let speakSeq = 0;

const FEMALE_OPENAI = new Set(['shimmer', 'coral', 'nova', 'alloy']);
const MALE_OPENAI = new Set(['echo', 'onyx', 'fable', 'ash', 'sage']);

function pickSpeechVoice(openAiHint: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const v = openAiHint.trim().toLowerCase();
  const wantFemale = FEMALE_OPENAI.has(v) || !MALE_OPENAI.has(v);
  const voices = window.speechSynthesis.getVoices().filter((x) => x.lang.toLowerCase().startsWith('en'));
  if (voices.length === 0) return null;
  const femaleRe = /female|samantha|karen|victoria|zira|susan|hazel|sarah|google uk english female/i;
  const maleRe = /male|daniel|fred|david|mark|tom|google uk english male/i;
  if (wantFemale) {
    const f = voices.filter((vo) => femaleRe.test(vo.name));
    if (f.length) return f[0];
    return voices[0];
  }
  const m = voices.filter((vo) => maleRe.test(vo.name));
  if (m.length) return m[0];
  return voices[0];
}

function ensureVoicesLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const syn = window.speechSynthesis;
  if (!syn) return Promise.resolve();
  if (syn.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      syn.onvoiceschanged = null;
      resolve();
    };
    syn.onvoiceschanged = done;
    setTimeout(done, 400);
  });
}

/**
 * 특정 SpeechSynthesis 보이스 이름으로 직접 발화 (서버 호출 없음)
 */
export async function speakBrowserTTSDirect(voiceName: string, text: string, onEnd?: () => void): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) { onEnd?.(); return; }
  stopBrowserTTS();
  const mySeq = speakSeq;
  if (typeof window === 'undefined' || !window.speechSynthesis) { onEnd?.(); return; }
  await ensureVoicesLoaded();
  if (mySeq !== speakSeq) return;
  try {
    if (typeof window.speechSynthesis.resume === 'function') window.speechSynthesis.resume();
  } catch { /* ignore */ }
  const u = new SpeechSynthesisUtterance(trimmed);
  u.lang = 'en-US';
  u.rate = VOICE_SPEED.browserUtteranceRate;
  const target = window.speechSynthesis.getVoices().find((v) => v.name === voiceName);
  if (target) u.voice = target;
  u.onend = () => { if (mySeq === speakSeq) onEnd?.(); };
  u.onerror = () => { if (mySeq === speakSeq) onEnd?.(); };
  window.speechSynthesis.speak(u);
}

/** 진행 중 발화 취소 + 이후 onEnd 무시 */
export function stopBrowserTTS(): void {
  speakSeq += 1;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 서버가 돌려준 `text`로 브라우저 발화. fetch 실패 시 원문 `text`로 폴백.
 */
export async function speakBrowserTTS(voice: string, text: string, onEnd?: () => void): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    onEnd?.();
    return;
  }
  stopBrowserTTS();
  const mySeq = speakSeq;
  let toSpeak = trimmed;
  let voiceHint = voice;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, voice, speed: VOICE_SPEED.ttsSpeed }),
    });
    const j = (await res.json().catch(() => null)) as { text?: string; voice?: string } | null;
    if (mySeq !== speakSeq) return;
    if (res.ok && j && typeof j.text === 'string' && j.text.trim()) {
      toSpeak = j.text.trim();
      voiceHint = typeof j.voice === 'string' && j.voice.trim() ? j.voice.trim() : voice;
    }
  } catch {
    /* 네트워크 오류 → 아래에서 원문 발화 */
  }
  if (mySeq !== speakSeq) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  await ensureVoicesLoaded();
  if (mySeq !== speakSeq) return;
  try {
    if (typeof window.speechSynthesis.resume === 'function') window.speechSynthesis.resume();
  } catch {
    /* ignore */
  }
  const u = new SpeechSynthesisUtterance(toSpeak);
  u.lang = 'en-US';
  u.rate = VOICE_SPEED.browserUtteranceRate;
  const pv = pickSpeechVoice(voiceHint);
  if (pv) u.voice = pv;
  u.onend = () => {
    if (mySeq === speakSeq) onEnd?.();
  };
  u.onerror = () => {
    if (mySeq === speakSeq) onEnd?.();
  };
  window.speechSynthesis.speak(u);
}
