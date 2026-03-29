/**
 * 개발용: 음성 힌트(OpenAI 스타일 id)별로 /api/tts 텍스트 확인 후 브라우저 SpeechSynthesis 재생
 */

import { useCallback, useEffect, useState } from 'react';
import { speakBrowserTTS, stopBrowserTTS } from '../browserSpeechTTS';
import { OPENAI_TTS_VOICE_IDS, TTS_VOICES_BY_LEVEL } from '../config/ttsVoicesByLevel';

const DEFAULT_SAMPLE = 'Hello, I am happy today.';

export function OpenAiVoiceTestScreen({ onBack }: { onBack: () => void }) {
  const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopPlayback = useCallback(() => {
    stopBrowserTTS();
    setPlayingVoice(null);
  }, []);

  useEffect(() => () => stopBrowserTTS(), []);

  const playVoice = useCallback(
    (voice: string) => {
      const text = sampleText.trim();
      if (!text) {
        setError('문장을 입력해 주세요.');
        return;
      }
      setError(null);
      setPlayingVoice(voice);
      void speakBrowserTTS(voice, text, () => setPlayingVoice(null));
    },
    [sampleText],
  );

  return (
    <div className="openai-voice-test-screen">
      <div className="openai-voice-test-inner">
        <button type="button" className="openai-voice-test-back" onClick={onBack}>
          ← 홈
        </button>
        <h1 className="openai-voice-test-title">TTS 음성 (브라우저)</h1>
        <p className="openai-voice-test-hint">
          서버는 발화할 텍스트만 JSON으로 돌려주고, 실제 소리는 기기 Web Speech API입니다. 앱 설정: RT3{' '}
          {TTS_VOICES_BY_LEVEL.basicRealTalk3} · RT4 {TTS_VOICES_BY_LEVEL.basicRealTalk4} · RT5{' '}
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
        <ul className="openai-voice-test-list" aria-label="음성 힌트 목록">
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
