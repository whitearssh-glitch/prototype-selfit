/**
 * TTS 설정 패널 — 레벨별 음성 선택
 * OpenAI 탭: OpenAI TTS API 재생 / SpeechSynthesis 탭: 브라우저 직접 재생
 * 선택한 설정은 localStorage에 저장됩니다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { OPENAI_TTS_VOICE_IDS } from '../config/ttsVoicesByLevel';
import { getVoiceSetting, setVoiceSetting, type TtsVoiceConfigKey, type VoiceSetting } from '../ttsVoiceSettings';
import { stopBrowserTTS } from '../browserSpeechTTS';

const SAMPLE_TEXT = 'Hello, I am happy today.';
type Tab = 'openai' | 'browser';

// ── OpenAI 탭 ────────────────────────────────
function OpenAiVoiceList({
  selected,
  onSelect,
}: {
  selected: VoiceSetting;
  onSelect: (s: VoiceSetting) => void;
}) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playSeqRef = useRef(0);

  useEffect(() => () => {
    playSeqRef.current++;
    audioRef.current?.pause();
  }, []);

  const playVoice = useCallback(async (voice: string) => {
    const seq = ++playSeqRef.current;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingVoice(voice);
    try {
      const res = await fetch('/api/tts-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: SAMPLE_TEXT, voice }),
      });
      if (seq !== playSeqRef.current) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (seq !== playSeqRef.current) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); if (seq === playSeqRef.current) setPlayingVoice(null); };
      audio.onerror = () => { URL.revokeObjectURL(url); if (seq === playSeqRef.current) setPlayingVoice(null); };
      await audio.play();
    } catch {
      if (seq === playSeqRef.current) setPlayingVoice(null);
    }
  }, []);

  const isSelected = (id: string) => selected.mode === 'openai' && selected.voice === id;

  return (
    <ul className="tts-settings-list">
      {OPENAI_TTS_VOICE_IDS.map((id) => (
        <li
          key={id}
          className={'tts-settings-row' + (isSelected(id) ? ' tts-settings-row--selected' : '')}
          onClick={() => onSelect({ mode: 'openai', voice: id })}
        >
          <div className="tts-settings-row-left">
            <span className="tts-settings-check">{isSelected(id) ? '✓' : ''}</span>
            <span className="tts-settings-name">{id}</span>
          </div>
          <button
            type="button"
            className="tts-settings-play"
            onClick={(e) => { e.stopPropagation(); void playVoice(id); }}
          >
            {playingVoice === id ? '재생 중…' : '재생'}
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── SpeechSynthesis 탭 ───────────────────────
function BrowserVoiceList({
  selected,
  onSelect,
}: {
  selected: VoiceSetting;
  onSelect: (s: VoiceSetting) => void;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      const v = window.speechSynthesis.getVoices().filter((x) => x.lang.toLowerCase().startsWith('en'));
      if (v.length) setVoices(v);
    }
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => () => stopBrowserTTS(), []);

  const playVoice = useCallback((voiceName: string) => {
    stopBrowserTTS();
    setPlayingVoice(voiceName);
    const u = new SpeechSynthesisUtterance(SAMPLE_TEXT);
    u.lang = 'en-US';
    const target = voices.find((v) => v.name === voiceName);
    if (target) u.voice = target;
    u.onend = () => setPlayingVoice((cur) => (cur === voiceName ? null : cur));
    u.onerror = () => setPlayingVoice((cur) => (cur === voiceName ? null : cur));
    window.speechSynthesis.speak(u);
  }, [voices]);

  const isSelected = (name: string) => selected.mode === 'browser' && selected.voiceName === name;

  return (
    <>
      {voices.length === 0 && <p className="tts-settings-loading">영어 음성을 불러오는 중…</p>}
      <ul className="tts-settings-list">
        {voices.map((v) => (
          <li
            key={v.name}
            className={'tts-settings-row' + (isSelected(v.name) ? ' tts-settings-row--selected' : '')}
            onClick={() => onSelect({ mode: 'browser', voiceName: v.name })}
          >
            <div className="tts-settings-row-left">
              <span className="tts-settings-check">{isSelected(v.name) ? '✓' : ''}</span>
              <span className="tts-settings-name">{v.name}</span>
            </div>
            <button
              type="button"
              className="tts-settings-play"
              onClick={(e) => { e.stopPropagation(); playVoice(v.name); }}
            >
              {playingVoice === v.name ? '재생 중…' : '재생'}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ── 루트 패널 ────────────────────────────────
export function TtsSettingsPanel({
  voiceKey,
  onClose,
}: {
  voiceKey: TtsVoiceConfigKey;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<VoiceSetting>(() => getVoiceSetting(voiceKey));
  const [tab, setTab] = useState<Tab>(() => getVoiceSetting(voiceKey).mode === 'browser' ? 'browser' : 'openai');

  const handleSelect = useCallback((s: VoiceSetting) => {
    setSelected(s);
    setVoiceSetting(voiceKey, s);
  }, [voiceKey]);

  return (
    <div className="tts-settings-overlay" onClick={onClose}>
      <div className="tts-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="tts-settings-header">
          <span className="tts-settings-title">TTS</span>
        </div>
        <div className="tts-tabs tts-settings-tabs">
          <button
            type="button"
            role="tab"
            className={'tts-tab' + (tab === 'openai' ? ' tts-tab--active' : '')}
            onClick={() => setTab('openai')}
          >
            OpenAI
          </button>
          <button
            type="button"
            role="tab"
            className={'tts-tab' + (tab === 'browser' ? ' tts-tab--active' : '')}
            onClick={() => setTab('browser')}
          >
            SpeechSynthesis
          </button>
        </div>
        {tab === 'openai'
          ? <OpenAiVoiceList selected={selected} onSelect={handleSelect} />
          : <BrowserVoiceList selected={selected} onSelect={handleSelect} />
        }
      </div>
    </div>
  );
}
