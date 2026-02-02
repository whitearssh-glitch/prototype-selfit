/**
 * Screen 13 – Type 2-3 (Speed Up section)
 * Line 1: "I am" + white rounded blank box → on recognition box becomes "Peter" with cyan-purple gradient.
 * Line 2: 나는 피터예요
 * Audio: i-am-peter.mp3 (tap to play)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';

const CENTER_TEXT_LINE1_PREFIX = 'I am ';
const CENTER_TEXT_FILL = 'Peter';
const CENTER_TEXT_LINE2 = '나는 피터예요.';
const AUDIO_FILE = '/i-am-peter.mp3';

function playDingDong() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(523, 0, 0.15);
    playTone(659, 0.2, 0.2);
  } catch {
    // ignore
  }
}

export interface LectureScreen13Props {
  onNext: () => void;
  speedDisplayVariant?: 'slow' | 'fast';
  playbackRate?: number;
}

export function LectureScreen13({ onNext, speedDisplayVariant = 'slow', playbackRate = 0.6 }: LectureScreen13Props) {
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [recognitionDone, setRecognitionDone] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const checkmarkShownRef = useRef(false);

  const onResult = useCallback((_transcript: string) => {
    if (checkmarkShownRef.current) return;
    checkmarkShownRef.current = true;
    setRecognitionDone(true);
    setShowCheckmark(true);
    playDingDong();
    setTimeout(() => setShowCheckmark(false), 1200);
  }, []);
  const { start, isListening, useWhisper } = useSTT(onResult, { useApiStt: false });

  useEffect(() => {
    if (!recognitionDone) return;
    const t = setTimeout(onNext, 1500);
    return () => clearTimeout(t);
  }, [recognitionDone, onNext]);

  const handleTapToPlayAudio = () => {
    if (audioPlayed) return;
    setAudioPlayed(true);
    const audio = new Audio(AUDIO_FILE);
    audio.playbackRate = playbackRate;
    audio.onerror = () => {};
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  const showFill = isListening || recognitionDone;

  return (
    <div className="screen-content" onClick={handleTapToPlayAudio} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTapToPlayAudio(); }} aria-label="Tap to listen">
      <div className="screen-center">
        <div className="topic-box">{TOPIC_TEXT}</div>
        <div className={'speed-display' + (speedDisplayVariant === 'fast' ? ' speed-display--fast-active' : '')}>
          <span className="speed-display-item speed-display-item--slow">Slow</span>
          <span className="speed-display-sep" aria-hidden>/</span>
          <span className={'speed-display-item' + (speedDisplayVariant === 'fast' ? ' speed-display-item--fast' : '')}>Fast</span>
        </div>
        <div className="screen-main screen-main--vertical-center">
          <p className="main-text main-text--two-lines">
            {showFill ? (
              <span className="main-text--gradient-sequential">{CENTER_TEXT_LINE1_PREFIX}{CENTER_TEXT_FILL}.</span>
            ) : (
              <>
                {CENTER_TEXT_LINE1_PREFIX}
                <span className="main-text-blank-box">
                  <span className="main-text-blank-box__hint">{CENTER_TEXT_FILL}</span>
                </span>
                .
              </>
            )}
          </p>
          <p className="main-text main-text--two-lines main-text--sub">{CENTER_TEXT_LINE2}</p>
        </div>
        <div className="screen-bottom">
          <button
            type="button"
            className="mic-btn"
            onClick={(e) => { e.stopPropagation(); start(); }}
            disabled={(!useWhisper && isListening) || recognitionDone}
            aria-label={useWhisper ? (isListening ? 'Stop and transcribe' : 'Start recording') : 'Microphone'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </button>
        </div>
      </div>

      {showCheckmark && (
        <div className="checkmark-popup step12-complete-popup" role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
