/**
 * Screen 2 – Type B (Speech Recognition)
 * LAYOUT FIXED: topic box, center text (no TTS), mic button. No Next; 1.5s after checkmark then auto-next.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOPIC_TEXT } from '../App';

const CENTER_TEXT = 'Hello, SELENA!';

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
    // ignore if AudioContext not supported
  }
}

export function LectureScreen2({ onNext }: { onNext: () => void }) {
  const [recognitionDone, setRecognitionDone] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const checkmarkShownRef = useRef(false);

  useEffect(() => {
    const audio = new Audio('/pop.mp3');
    audio.onerror = () => {};
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, []);

  const onResult = useCallback(() => {
    if (checkmarkShownRef.current) return;
    checkmarkShownRef.current = true;
    setRecognitionDone(true);
    setShowCheckmark(true);
    playDingDong();
    setTimeout(() => setShowCheckmark(false), 1200);
  }, []);

  useEffect(() => {
    if (!recognitionDone) return;
    const t = setTimeout(onNext, 1500);
    return () => clearTimeout(t);
  }, [recognitionDone, onNext]);

  const startRecognition = () => {
    const win = window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      onResult();
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = () => onResult();
    rec.onend = () => {
      setIsListening(false);
      if (!checkmarkShownRef.current) onResult();
    };
    rec.onerror = () => {
      setIsListening(false);
      if (!checkmarkShownRef.current) onResult();
    };
    setIsListening(true);
    rec.start();
  };

  return (
    <div className="screen-content">
      <div className="screen-center">
        <div className="topic-box">{TOPIC_TEXT}</div>
        <div className="screen-main screen-main--vertical-center">
          <p className={`main-text ${isListening || recognitionDone ? 'main-text--gradient' : ''}`}>{CENTER_TEXT}</p>
        </div>
        <div className="screen-bottom">
          <button
            type="button"
            className="mic-btn"
            onClick={startRecognition}
            disabled={isListening || recognitionDone}
            aria-label="Microphone"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </button>
        </div>
      </div>

      {showCheckmark && (
        <div className="checkmark-popup" role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      )}
    </div>
  );
}
