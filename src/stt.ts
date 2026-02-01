/**
 * STT: 서버에 OPENAI_API_KEY 있으면 자동으로 Whisper, 없으면 Web Speech API
 * Whisper: 마이크 클릭 → 녹음 시작, 다시 클릭 → 녹음 종료 후 전사
 */

let whisperAvailableCache: boolean | null = null;

/** 서버에 Whisper 사용 가능 여부 물어보기 (캐시 1회) */
export async function isWhisperAvailable(): Promise<boolean> {
  if (whisperAvailableCache !== null) return whisperAvailableCache;
  try {
    const res = await fetch('/api/whisper-available');
    if (!res.ok) return false;
    const data = (await res.json()) as { available?: boolean };
    whisperAvailableCache = Boolean(data.available);
  } catch {
    whisperAvailableCache = false;
  }
  return whisperAvailableCache;
}

/** POST /api/transcribe with audio blob, returns transcript text */
export async function transcribeWithWhisper(blob: Blob): Promise<string> {
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: blob.type ? { 'Content-Type': blob.type } : {},
    body: blob,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || 'Transcribe failed');
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim();
}

export type WhisperRecorder = {
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
};

/** 녹음 시작/종료. stop() 시 녹음된 Blob 반환 (실패 시 null) */
export function createWhisperRecorder(): WhisperRecorder {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.start(100);
    },
    async stop(): Promise<Blob | null> {
      if (!recorder || recorder.state === 'inactive') return null;
      const mimeType = recorder.mimeType || 'audio/webm';
      return new Promise((resolve) => {
        recorder!.onstop = () => {
          stream?.getTracks().forEach((t) => t.stop());
          stream = null;
          recorder = null;
          if (chunks.length) resolve(new Blob(chunks, { type: mimeType }));
          else resolve(null);
        };
        recorder!.stop();
      });
    },
  };
}

/** @deprecated 환경변수 대신 isWhisperAvailable() 사용 */
export function useWhisperSTT(): boolean {
  return false;
}
