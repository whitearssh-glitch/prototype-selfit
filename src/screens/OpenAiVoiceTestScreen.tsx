/**
 * 개발용: OpenAI TTS / 브라우저 SpeechSynthesis 음성 미리듣기 (탭 전환)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { stopBrowserTTS } from '../browserSpeechTTS';
import { OPENAI_TTS_VOICE_IDS } from '../config/ttsVoicesByLevel';

const DEFAULT_SAMPLE = 'Hello, I am happy today.';
type Tab = 'openai' | 'browser';

// ──────────────────────────────────────────────
// OpenAI TTS 탭
// ──────────────────────────────────────────────
function OpenAiTab({ sampleText }: { sampleText: string }) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playSeqRef = useRef(0);

  const stopPlayback = useCallback(() => {
    playSeqRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      const seq = ++playSeqRef.current;
      setPlayingVoice(voice);
      try {
        const res = await fetch('/api/tts-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice }),
        });
        if (seq !== playSeqRef.current) return;
        if (!res.ok) {
          const j = await res.json().catch(() => null) as { error?: string } | null;
          throw new Error(j?.error ?? `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        if (seq !== playSeqRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (seq === playSeqRef.current) setPlayingVoice(null);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (seq === playSeqRef.current) { setPlayingVoice(null); setError('재생 중 오류가 발생했습니다.'); }
        };
        await audio.play();
      } catch (e) {
        if (seq === playSeqRef.current) { setPlayingVoice(null); setError(String((e as Error).message ?? e)); }
      }
    },
    [sampleText],
  );

  return (
    <>
      {error && <p className="openai-voice-test-error">{error}</p>}
      <ul className="openai-voice-test-list" aria-label="OpenAI 음성 목록">
        {OPENAI_TTS_VOICE_IDS.map((id) => (
          <li key={id} className={'openai-voice-test-row' + (playingVoice === id ? ' openai-voice-test-row--playing' : '')}>
            <span className="openai-voice-test-name">{id}</span>
            <button type="button" className="openai-voice-test-play" onClick={() => void playVoice(id)}>
              {playingVoice === id ? '재생 중…' : '재생'}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ──────────────────────────────────────────────
// SpeechSynthesis 탭
// ──────────────────────────────────────────────
function BrowserTab({ sampleText }: { sampleText: string }) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices().filter((x) => x.lang.toLowerCase().startsWith('en'));
      if (v.length) setVoices(v);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => () => stopBrowserTTS(), []);

  const playVoice = useCallback(
    (voiceName: string) => {
      const text = sampleText.trim();
      if (!text) {
        setError('문장을 입력해 주세요.');
        return;
      }
      setError(null);
      stopBrowserTTS();
      setPlayingVoice(voiceName);

      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      const target = voices.find((v) => v.name === voiceName);
      if (target) u.voice = target;
      u.onend = () => setPlayingVoice((cur) => (cur === voiceName ? null : cur));
      u.onerror = () => setPlayingVoice((cur) => (cur === voiceName ? null : cur));
      window.speechSynthesis.speak(u);
    },
    [sampleText, voices],
  );

  return (
    <>
      {error && <p className="openai-voice-test-error">{error}</p>}
      {voices.length === 0 && <p className="openai-voice-test-hint">영어 음성을 불러오는 중…</p>}
      <ul className="openai-voice-test-list" aria-label="브라우저 음성 목록">
        {voices.map((v) => (
          <li key={v.name} className={'openai-voice-test-row' + (playingVoice === v.name ? ' openai-voice-test-row--playing' : '')}>
            <span className="openai-voice-test-name">{v.name}</span>
            <button type="button" className="openai-voice-test-play" onClick={() => playVoice(v.name)}>
              {playingVoice === v.name ? '재생 중…' : '재생'}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ──────────────────────────────────────────────
// 루트 화면
// ──────────────────────────────────────────────
export function OpenAiVoiceTestScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('openai');
  const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE);

  return (
    <div className="openai-voice-test-screen">
      <div className="openai-voice-test-inner">
        <button type="button" className="openai-voice-test-back" onClick={onBack}>
          ← 홈
        </button>
        <h1 className="openai-voice-test-title">TTS 음성 미리듣기</h1>

        {/* 탭 */}
        <div className="tts-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'openai'}
            className={'tts-tab' + (tab === 'openai' ? ' tts-tab--active' : '')}
            onClick={() => setTab('openai')}
          >
            OpenAI
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'browser'}
            className={'tts-tab' + (tab === 'browser' ? ' tts-tab--active' : '')}
            onClick={() => setTab('browser')}
          >
            SpeechSynthesis
          </button>
        </div>

        {/* 공통: 샘플 문장 */}
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

        {tab === 'openai' ? <OpenAiTab sampleText={sampleText} /> : <BrowserTab sampleText={sampleText} />}
      </div>
    </div>
  );
}
