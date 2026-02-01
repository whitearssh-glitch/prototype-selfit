/**
 * Screen 12 – Type 2-2 (Speed Up section)
 * Korean only visible at first; English appears with gradient when mic pressed.
 * No audio file.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';
const CENTER_TEXT_LINE1 = 'I am';
const CENTER_TEXT_LINE2 = '나는 ~예요';
const WRONG_AUDIO = '/i-am.mp3';

function normalizeForCompare(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?\-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

function playWrongAudio(onEnd: () => void) {
  try {
    const audio = new Audio(WRONG_AUDIO);
    audio.playbackRate = 1.0;
    audio.onended = onEnd;
    audio.play().catch(onEnd);
  } catch {
    onEnd();
  }
}

export function LectureScreen12({ onNext, hideSpeedDisplay }: { onNext: () => void; hideSpeedDisplay?: boolean }) {
  const [recognitionDone, setRecognitionDone] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showWrongMark, setShowWrongMark] = useState(false);
  const [showAnswerReveal, setShowAnswerReveal] = useState(false);
  const checkmarkShownRef = useRef(false);

  const onResult = useCallback((transcript: string) => {
    if (checkmarkShownRef.current) return;
    checkmarkShownRef.current = true;
    setRecognitionDone(true);
    const expected = normalizeForCompare(CENTER_TEXT_LINE1);
    const said = normalizeForCompare(transcript);
    if (said === expected || said.includes('i am') || said.includes('i m')) {
      setShowCheckmark(true);
      playDingDong();
      setTimeout(() => setShowCheckmark(false), 1200);
    } else {
      setShowWrongMark(true);
      setTimeout(() => {
        setShowWrongMark(false);
        setShowAnswerReveal(true);
        playWrongAudio(() => {});
      }, 800);
    }
  }, []);
  const { start, isListening, useWhisper } = useSTT(onResult);

  useEffect(() => {
    if (!recognitionDone || showWrongMark) return;
    const t = setTimeout(onNext, 1500);
    return () => clearTimeout(t);
  }, [recognitionDone, showWrongMark, onNext]);

  useEffect(() => {
    if (!showAnswerReveal) return;
    const t = setTimeout(() => {
      setShowAnswerReveal(false);
      onNext();
    }, 2800);
    return () => clearTimeout(t);
  }, [showAnswerReveal, onNext]);

  return (
    <div className="screen-content">
      <div className="screen-center">
        <div className="topic-box">{TOPIC_TEXT}</div>
        {!hideSpeedDisplay && (
          <div className="speed-display">
            <span className="speed-display-item speed-display-item--slow">Slow</span>
            <span className="speed-display-sep" aria-hidden>/</span>
            <span className="speed-display-item">Fast</span>
          </div>
        )}
        <div className="screen-main screen-main--vertical-center">
          {showAnswerReveal ? (
            <>
              <p className="main-text main-text--two-lines answer-reveal-text">{CENTER_TEXT_LINE1}</p>
              <p className="main-text main-text--two-lines main-text--sub">{CENTER_TEXT_LINE2}</p>
            </>
          ) : (
            <>
              {(isListening || recognitionDone) && (
                <p className="main-text main-text--two-lines main-text--gradient">{CENTER_TEXT_LINE1}</p>
              )}
              <p className="main-text main-text--two-lines main-text--sub">{CENTER_TEXT_LINE2}</p>
            </>
          )}
        </div>
        <div className="screen-bottom">
          <button
            type="button"
            className="mic-btn"
            onClick={start}
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

      {showWrongMark && (
        <div className="wrong-popup wrong-popup--exclamation-blue" role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13 7h-2v6h2V7zm0 8h-2v2h2v-2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
