/**
 * Screen 17 – Type 2-4 (Speed Up section)
 * Center text: "나는 학생이에요." only (English hidden).
 * No audio. After mic click: "I am a student." with same sequential gradient as 2-3.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';
const CENTER_TEXT_LINE1_PREFIX = 'I am ';
const CENTER_TEXT_FILL = 'a student';
const CENTER_TEXT_LINE1 = CENTER_TEXT_LINE1_PREFIX + CENTER_TEXT_FILL + '.';
const CENTER_TEXT_LINE2 = '나는 학생이에요.';
const WRONG_AUDIO = '/i-am-a-student.mp3';

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

/** 효과음만 재생. onEnd 없으면 종료 시 아무 동작 안 함(스탬프 클릭으로만 다음 화면) */
function playFb4(onEnd?: () => void) {
  try {
    const fb4 = new Audio('/fb4.mp3');
    fb4.onended = () => { onEnd?.(); };
    fb4.play().catch(() => { onEnd?.(); });
  } catch {
    onEnd?.();
  }
}

function GoodStampOverlay({ onNext }: { onNext: () => void }) {
  return (
    <div
      className="screen7-stamp-popup screen7-stamp-popup--overlay"
      role="button"
      tabIndex={0}
      aria-label="다음으로"
      onClick={(e) => { e.stopPropagation(); onNext(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext(); } }}
    >
      <div className="screen7-stamp-circle">
        <svg className="screen7-stamp-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="stamp-small-star-17" d="M0 -2.1 L0.5 -0.5 L2.2 -0.5 L0.8 0.5 L1.3 2.1 L0 1.1 L-1.3 2.1 L-0.8 0.5 L-2.2 -0.5 L-0.5 -0.5 Z" fill="#fff" />
          </defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="3" />
          <use href="#stamp-small-star-17" transform="translate(98, 38) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(82, 22) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(60, 16) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(38, 22) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(22, 38) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(22, 82) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(38, 98) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(60, 104) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(82, 98) scale(2)" />
          <use href="#stamp-small-star-17" transform="translate(98, 82) scale(2)" />
          <text x="60" y="62" textAnchor="middle" dominantBaseline="central" className="screen7-stamp-text" fill="#fff">GOOD!</text>
        </svg>
      </div>
    </div>
  );
}

export function LectureScreen17({ onNext, hideSpeedDisplay, showGoodStampAndFb4, forceCorrect }: { onNext: () => void; hideSpeedDisplay?: boolean; showGoodStampAndFb4?: boolean; forceCorrect?: boolean }) {
  const [recognitionDone, setRecognitionDone] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showWrongMark, setShowWrongMark] = useState(false);
  const [showAnswerReveal, setShowAnswerReveal] = useState(false);
  const [showGoodStamp, setShowGoodStamp] = useState(false);
  const checkmarkShownRef = useRef(false);
  const goodStampAdvancedRef = useRef(false);
  /** GOOD 스탬프 보이는 화면(24)에서는 자동 진행 금지. 1500ms 타이머 콜백에서도 한 번 더 확인 */
  const goodStampOnlyRef = useRef(!!showGoodStampAndFb4);
  goodStampOnlyRef.current = !!showGoodStampAndFb4;

  const handleGoodStampNext = useCallback(() => {
    if (goodStampAdvancedRef.current) return;
    goodStampAdvancedRef.current = true;
    onNext();
  }, [onNext]);

  const onResult = useCallback((transcript: string) => {
    if (checkmarkShownRef.current) return;
    checkmarkShownRef.current = true;
    setRecognitionDone(true);
    if (forceCorrect) {
      setShowCheckmark(true);
      playDingDong();
      if (!showGoodStampAndFb4) setTimeout(() => setShowCheckmark(false), 1200);
      return;
    }
    const expected = normalizeForCompare(CENTER_TEXT_LINE1);
    const said = normalizeForCompare(transcript);
    const isCorrect = said === expected || (said.includes('i am') && said.includes('student')) || (said.includes('i m') && said.includes('student'));
    if (isCorrect) {
      setShowCheckmark(true);
      playDingDong();
      if (!showGoodStampAndFb4) setTimeout(() => setShowCheckmark(false), 1200);
    } else {
      setShowWrongMark(true);
      setTimeout(() => {
        setShowWrongMark(false);
        setShowAnswerReveal(true);
        playWrongAudio(() => {});
      }, 800);
    }
  }, [showGoodStampAndFb4, forceCorrect]);
  const { start, isListening, useWhisper } = useSTT(onResult, { useApiStt: false });

  /* GOOD 스탬프 + fb4 효과음 표시 (스텝1 마지막 강의 LectureScreen7과 동일: 스탬프 클릭으로만 다음 화면) */
  useEffect(() => {
    if (!recognitionDone || !showGoodStampAndFb4 || showWrongMark) return;
    const t = setTimeout(() => {
      setShowCheckmark(false);
      setShowGoodStamp(true);
      playFb4(); /* 인자 없음 → 효과음만 재생, onNext 호출 없음 */
    }, 1200);
    return () => clearTimeout(t);
  }, [recognitionDone, showGoodStampAndFb4, showWrongMark]);

  /* GOOD 스탬프 없는 화면만 1.5초 후 자동 이동. 24(showGoodStampAndFb4)는 스탬프 클릭으로만 이동. 타이머 콜백에서도 ref 한 번 더 확인 */
  useEffect(() => {
    if (showGoodStampAndFb4) return;
    if (!recognitionDone || showWrongMark || showGoodStamp) return;
    const t = setTimeout(() => {
      if (goodStampOnlyRef.current) return;
      onNext();
    }, 1500);
    return () => clearTimeout(t);
  }, [showGoodStampAndFb4, recognitionDone, showWrongMark, showGoodStamp, onNext]);

  useEffect(() => {
    if (!showAnswerReveal) return;
    const t = setTimeout(() => {
      setShowAnswerReveal(false);
      onNext();
    }, 2800);
    return () => clearTimeout(t);
  }, [showAnswerReveal, onNext]);

  const showFill = isListening || recognitionDone;

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
              <p className="main-text main-text--two-lines answer-reveal-text answer-reveal-text--sequential">{CENTER_TEXT_LINE1}</p>
              <p className="main-text main-text--two-lines main-text--sub">{CENTER_TEXT_LINE2}</p>
            </>
          ) : (
            <>
              {showFill && (
                <p className="main-text main-text--two-lines">
                  <span className="main-text--gradient-sequential">{CENTER_TEXT_LINE1_PREFIX}{CENTER_TEXT_FILL}.</span>
                </p>
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

      {showGoodStamp && <GoodStampOverlay onNext={handleGoodStampNext} />}
    </div>
  );
}
