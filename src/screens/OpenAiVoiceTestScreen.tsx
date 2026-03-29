/**
 * 개발용: OpenAI TTS 음성 선택 후 /api/tts 로 미리듣기
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_SPEED } from '../config/voiceSpeed';
import { OPENAI_TTS_VOICE_IDS, TTS_VOICES_BY_LEVEL } from '../config/ttsVoicesByLevel';

const DEFAULT_SAMPLE = 'Hello, I am happy today.';

export function OpenAiVoiceTestScreen({ onBack }: { onBack: () => void }) {
  const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const seqRef = useRef(0);

  const stopPlayback = useCallback(() => {
    seqRef.current += 1;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingVoice(null);
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const playVoice = useCallback(
    async (voice: string) => {
      const text = sampleText.trim();
      if (!text) {
        setError('문장을 입력해 주세요.');
        return;
      }
      setError(null);
      stopPlayback();
      const mySeq = ++seqRef.current;
      setPlayingVoice(voice);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, speed: VOICE_SPEED.ttsSpeed }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          if (mySeq === seqRef.current) {
            setError((err as { error?: string }).error || 'TTS 요청 실패');
            setPlayingVoice(null);
          }
          return;
        }
        const blob = await res.blob();
        if (mySeq !== seqRef.current) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
          audioRef.current = null;
          setPlayingVoice(null);
        };
        audio.onerror = () => {
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
          audioRef.current = null;
          setPlayingVoice(null);
          setError('재생에 실패했습니다.');
        };
        await audio.play();
      } catch {
        if (mySeq === seqRef.current) {
          setPlayingVoice(null);
          setError('네트워크 오류');
        }
      }
    },
    [sampleText, stopPlayback],
  );

  return (
    <div className="openai-voice-test-screen">
      <div className="openai-voice-test-inner">
        <button type="button" className="openai-voice-test-back" onClick={onBack}>
          ← 홈
        </button>
        <h1 className="openai-voice-test-title">OpenAI TTS 음성</h1>
        <p className="openai-voice-test-hint">
          앱 설정: RT3 {TTS_VOICES_BY_LEVEL.basicRealTalk3} · RT4 {TTS_VOICES_BY_LEVEL.basicRealTalk4} · RT5{' '}
          {TTS_VOICES_BY_LEVEL.basicRealTalk5} · Inter {TTS_VOICES_BY_LEVEL.intermediate} · Adv{' '}
          {TTS_VOICES_BY_LEVEL.advanced}
        </p>
        <label className="openai-voice-test-label" htmlFor="openai-tts-sample">
          샘플 문장 (영어)
        </label>
        <textarea
          id="openai-tts-sample"
          className="openai-voice-test-textarea"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          rows={3}
          autoComplete="off"
        />
        <div className="openai-voice-test-actions">
          <button type="button" className="openai-voice-test-stop" onClick={stopPlayback} disabled={!playingVoice}>
            정지
          </button>
        </div>
        {error && <p className="openai-voice-test-error">{error}</p>}
        <ul className="openai-voice-test-list" aria-label="OpenAI 음성 목록">
          {OPENAI_TTS_VOICE_IDS.map((id) => (
            <li key={id} className={'openai-voice-test-row' + (playingVoice === id ? ' openai-voice-test-row--playing' : '')}>
              <span className="openai-voice-test-name">{id}</span>
              <button type="button" className="openai-voice-test-play" onClick={() => playVoice(id)}>
                재생
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
