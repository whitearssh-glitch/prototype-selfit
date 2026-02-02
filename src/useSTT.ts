/**
 * 공통 STT 훅: useApiStt true면 Gemini STT(API), false면 Web Speech API만 사용
 * 스텝1·2는 useApiStt: false로 API 사용량 절감
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  isWhisperAvailable,
  createWhisperRecorder,
  transcribeWithWhisper,
} from './stt';

export type UseSTTOptions = {
  /** false면 API(STT) 호출 없이 Web Speech API만 사용 (스텝1·2 기본) */
  useApiStt?: boolean;
};

export function useSTT(onResult: (transcript: string) => void, options?: UseSTTOptions) {
  const useApiStt = options?.useApiStt !== false;
  const [useWhisper, setUseWhisper] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [webSpeechUnavailable, setWebSpeechUnavailable] = useState(false);
  const recorderRef = useRef<ReturnType<typeof createWhisperRecorder> | null>(null);
  const transcribingRef = useRef(false);
  const lastTranscriptRef = useRef('');
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!useApiStt) return;
    isWhisperAvailable().then(setUseWhisper);
  }, [useApiStt]);

  const start = useCallback(() => {
    const report = (t: string) => onResultRef.current(t ?? '');

    if (useWhisper) {
      if (!isListening) {
        if (recorderRef.current) return;
        const rec = createWhisperRecorder();
        recorderRef.current = rec;
        rec.start()
          .then(() => setIsListening(true))
          .catch(() => {
            recorderRef.current = null;
            setIsListening(false);
          });
      } else {
        const rec = recorderRef.current;
        recorderRef.current = null;
        setIsListening(false);
        if (!rec || transcribingRef.current) return;
        transcribingRef.current = true;
        rec.stop().then(async (blob) => {
          try {
            if (!blob) {
              report('');
              return;
            }
            const text = await transcribeWithWhisper(blob);
            report(text || '');
          } catch {
            report('');
          } finally {
            transcribingRef.current = false;
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
      setWebSpeechUnavailable(true);
      report('');
      return;
    }
    console.log('[STT] Web Speech API 사용 중 (Gemini API 미사용)');
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

  return { start, isListening, useWhisper, webSpeechUnavailable };
}
