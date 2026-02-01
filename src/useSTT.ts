/**
 * 공통 STT 훅: 서버에 OPENAI_API_KEY 있으면 Whisper, 없으면 Web Speech API
 * Whisper: 마이크 1회 클릭 → 녹음 시작, 2회 클릭 → 녹음 종료 후 전사 → onResult(텍스트)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  isWhisperAvailable,
  createWhisperRecorder,
  transcribeWithWhisper,
} from './stt';

export function useSTT(onResult: (transcript: string) => void) {
  const [useWhisper, setUseWhisper] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recorderRef = useRef<ReturnType<typeof createWhisperRecorder> | null>(null);
  const lastTranscriptRef = useRef('');
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    isWhisperAvailable().then(setUseWhisper);
  }, []);

  const start = useCallback(() => {
    const report = (t: string) => onResultRef.current(t ?? '');

    if (useWhisper) {
      if (!isListening) {
        recorderRef.current = createWhisperRecorder();
        recorderRef.current
          .start()
          .then(() => setIsListening(true))
          .catch(() => setIsListening(false));
      } else {
        const rec = recorderRef.current;
        recorderRef.current = null;
        setIsListening(false);
        if (!rec) return;
        rec.stop().then(async (blob) => {
          if (!blob) {
            report('');
            return;
          }
          try {
            const text = await transcribeWithWhisper(blob);
            report(text || '');
          } catch {
            report('');
          }
        });
      }
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      report('');
      return;
    }
    lastTranscriptRef.current = '';
    const rec = new SR();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      if (!results?.length) return;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const alt = r.length ? (r[0] ?? (r as unknown as { item(i: number): SpeechRecognitionAlternative }).item(0)) : null;
        const t = alt != null ? String((alt as SpeechRecognitionAlternative & { transcript?: string }).transcript ?? '').trim() : '';
        if (t) lastTranscriptRef.current = t;
      }
    };
    rec.onend = () => {
      setIsListening(false);
      report(lastTranscriptRef.current);
    };
    rec.onerror = () => {
      setIsListening(false);
      report(lastTranscriptRef.current);
    };
    setIsListening(true);
    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  }, [useWhisper, isListening]);

  return { start, isListening, useWhisper };
}
