/**
 * TTS: ElevenLabs > VoiceRSS > 브라우저 Web Speech API
 * - ElevenLabs: https://elevenlabs.io/ 에서 API 키 발급 후 .env에 VITE_ELEVENLABS_API_KEY 설정 (선택: VITE_ELEVENLABS_VOICE_ID)
 * - VoiceRSS: https://www.voicerss.org/ 무료 350회/일, VITE_VOICERSS_API_KEY
 * 화면마다 음성: speakTTS(text, onEnd, { voiceId: '...' }) 또는 { voice: 'woman' | 'man' | 'girl' | 'boy' }
 */

/** 목소리 베리에이션: woman(성인 여성) / man(성인 남성) / girl(소녀) / boy(소년) */
export type VoiceStyle = 'woman' | 'man' | 'girl' | 'boy';

/** 화면별 TTS 옵션 */
export type TTSOptions = {
  /** ElevenLabs 보이스 ID (ElevenLabs 사용 시만 적용) */
  voiceId?: string;
  /** 목소리 베리에이션: woman / man / girl / boy */
  voice?: VoiceStyle;
  /** 재생 속도 (1 = 기본, 0.8 = 0.8배속) */
  playbackRate?: number;
};

const ELEVENLABS_API_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_API_KEY
  ? String(import.meta.env.VITE_ELEVENLABS_API_KEY).trim()
  : '';
const ELEVENLABS_VOICE_ID = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_VOICE_ID
  ? String(import.meta.env.VITE_ELEVENLABS_VOICE_ID).trim()
  : '21m00Tcm4TlvDq8ikWAM'; // Rachel (기본 여성)
/** ElevenLabs: man / boy (성인·소년 남성) */
const ELEVENLABS_VOICE_ID_MAN = 'pNInz6obpgDQGcFmaJgB'; // Adam
/** ElevenLabs: girl (소녀) */
const ELEVENLABS_VOICE_ID_GIRL = 'pFZP5JQG7iQjIQuC4Bku'; // Lily

const VOICERSS_API_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_VOICERSS_API_KEY
  ? String(import.meta.env.VITE_VOICERSS_API_KEY).trim()
  : '';
const VOICERSS_VOICE_WOMAN = 'Linda';
const VOICERSS_VOICE_MAN = 'Mike';
const VOICERSS_VOICE_GIRL = 'Amy';
const VOICERSS_VOICE_BOY = 'Mike'; // VoiceRSS에서 소년용 별도 보이스 없음

function getFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  return voices.find(v => /female|woman|samantha|karen|victoria|google/i.test(v.name) || (v.lang.startsWith('en') && v.name.length > 0)) ?? null;
}

function getMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  return voices.find(v => /male|man|daniel|alex|david|google.*male/i.test(v.name) || (v.lang.startsWith('en') && v.name.length > 0 && !/female|woman|samantha|karen|victoria/i.test(v.name))) ?? voices[0] ?? null;
}

/** ElevenLabs: API로 오디오 받아서 재생 (API 키 필요) */
function speakElevenLabs(text: string, onEnd: () => void, voiceId?: string, playbackRate = 1): void {
  if (!ELEVENLABS_API_KEY || !text.trim()) {
    onEnd();
    return;
  }
  const id = voiceId?.trim() || ELEVENLABS_VOICE_ID;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}`;
  fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: 'eleven_multilingual_v2',
    }),
  })
    .then(res => {
      if (!res.ok) return Promise.reject(new Error(`ElevenLabs ${res.status}`));
      return res.arrayBuffer();
    })
    .then(buffer => {
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      audio.playbackRate = playbackRate;
      audio.onended = () => { URL.revokeObjectURL(objectUrl); onEnd(); };
      audio.onerror = () => { URL.revokeObjectURL(objectUrl); onEnd(); };
      audio.play().catch(() => { URL.revokeObjectURL(objectUrl); onEnd(); });
    })
    .catch(() => onEnd());
}

/** VoiceRSS: API로 오디오 받아서 재생 (API 키 필요) */
function speakVoiceRSS(text: string, onEnd: () => void, voice?: VoiceStyle, playbackRate = 1): void {
  const key = VOICERSS_API_KEY;
  if (!key) {
    onEnd();
    return;
  }
  const v = voice === 'man' ? VOICERSS_VOICE_MAN
    : voice === 'girl' ? VOICERSS_VOICE_GIRL
    : voice === 'boy' ? VOICERSS_VOICE_BOY
    : VOICERSS_VOICE_WOMAN;
  const url = `https://api.voicerss.org/?key=${encodeURIComponent(key)}&hl=en-us&v=${encodeURIComponent(v)}&c=MP3&src=${encodeURIComponent(text)}`;
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      if (blob.size < 100 && blob.type === 'text/plain') {
        blob.text().then(t => { if (t.startsWith('ERROR')) onEnd(); });
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      audio.playbackRate = playbackRate;
      audio.onended = () => { URL.revokeObjectURL(objectUrl); onEnd(); };
      audio.onerror = () => { URL.revokeObjectURL(objectUrl); onEnd(); };
      audio.play().catch(() => { URL.revokeObjectURL(objectUrl); onEnd(); });
    })
    .catch(() => onEnd());
}

/** 브라우저 내장 Web Speech API (무료, 사용자 제스처 직후 호출 권장) */
function speakBrowserTTS(text: string, onEnd: () => void, voice?: VoiceStyle, playbackRate = 1): void {
  if (!window.speechSynthesis) {
    onEnd();
    return;
  }
  speechSynthesis.cancel();
  if (typeof speechSynthesis.resume === 'function') speechSynthesis.resume();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = playbackRate * 0.95;
  u.pitch = voice === 'girl' ? 1.15 : voice === 'boy' ? 0.9 : 1;
  u.onend = () => onEnd();
  u.onerror = () => onEnd();

  const voices = speechSynthesis.getVoices();
  const selected = voices.length > 0
    ? (voice === 'man' || voice === 'boy' ? getMaleVoice() : getFemaleVoice())
    : null;
  if (selected) u.voice = selected;

  speechSynthesis.speak(u);
}

/**
 * TTS 재생. 우선순위: ElevenLabs > VoiceRSS > 브라우저 TTS.
 * @param options.voiceId - ElevenLabs 보이스 ID (ElevenLabs 사용 시)
 * @param options.voice - 'woman' | 'man' | 'girl' | 'boy'
 */
export function speakTTS(text: string, onEnd: () => void, options?: TTSOptions): void {
  const voiceId = options?.voiceId?.trim();
  const voice = options?.voice;
  const playbackRate = options?.playbackRate ?? 1;
  if (ELEVENLABS_API_KEY) {
    const id = voiceId
      || (voice === 'girl' ? ELEVENLABS_VOICE_ID_GIRL
      : voice === 'man' || voice === 'boy' ? ELEVENLABS_VOICE_ID_MAN
      : ELEVENLABS_VOICE_ID);
    speakElevenLabs(text, onEnd, id, playbackRate);
  } else if (VOICERSS_API_KEY) {
    speakVoiceRSS(text, onEnd, voice, playbackRate);
  } else {
    speakBrowserTTS(text, onEnd, voice, playbackRate);
  }
}

export function isElevenLabsEnabled(): boolean {
  return ELEVENLABS_API_KEY.length > 0;
}

export function isVoiceRSSEnabled(): boolean {
  return VOICERSS_API_KEY.length > 0;
}
