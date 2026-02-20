/**
 * Real Talk 3 – 인덱스 48
 * 교정 연습: grammar/naturalness만. Speed Up 레이아웃 (slow/fast/your turn 제외).
 * 정답: 별+효과음→다음 / 1차 오답: 문장 2번 깜빡+TTS→재시도 / 2차 오답: 그라데이션+TTS+별+효과음→다음
 * 완료: 굿 도장+fb1.mp3→클릭→0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';
import { speak, stopSpeaking } from '../realTalk3TTS';
import { evaluateCorrectionPractice } from '../realTalk3Gemini';
import { getCorrectionPracticeItems } from '../realTalk3Types';
import type { ErrorLogItem } from '../realTalk3Types';

const REALTALK_IMAGE_GIRL1 = '/girl1.png';
const GOOD_STAMP_AUDIO = '/fb1.mp3';

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

type RealTalk3CorrectionPracticeScreenProps = {
  items: ErrorLogItem[];
  onComplete: () => void;
};

export function RealTalk3CorrectionPracticeScreen({ items, onComplete }: RealTalk3CorrectionPracticeScreenProps) {
  const [index, setIndex] = useState(0);
  const [showMic, setShowMic] = useState(false);
  const [showText, setShowText] = useState(true);
  const [showStar, setShowStar] = useState(false);
  const [showGoodStamp, setShowGoodStamp] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [textKey, setTextKey] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = items[index];
  const isLast = index >= items.length - 1;

  const onResultRef = useRef<(t: string) => void>(() => {});
  const { start: startSTT, isListening } = useSTT((t) => onResultRef.current(t), { useApiStt: false });

  const handleResult = useCallback(
    async (transcript: string) => {
      if (!current) return;
      const t = transcript.trim();
      if (!t) return;

      setShowMic(false);
      setIsEvaluating(true);
      const { isCorrect } = await evaluateCorrectionPractice(t, current.corrected);
      setIsEvaluating(false);

      if (isCorrect) {
        setShowStar(true);
        playDingDong();
        setTimeout(() => {
          setShowStar(false);
          if (isLast) {
            setShowGoodStamp(true);
            const audio = new Audio(GOOD_STAMP_AUDIO);
            audioRef.current = audio;
            audio.onerror = () => {};
            audio.play().catch(() => {});
          } else {
            setIndex((i) => i + 1);
            setAttemptCount(0);
            setTextKey((k) => k + 1);
            setShowText(true);
          }
        }, 1200);
        return;
      }

      const nextAttempt = attemptCount + 1;
      setAttemptCount(nextAttempt);

      if (nextAttempt === 1) {
        // 1차 오답: 문장 2번 깜빡 + TTS + 마이크 재시도
        setShowText(true);
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          stopSpeaking();
          speak(current.corrected, () => setShowMic(true));
        }, 1000);
      } else {
        // 2차 오답: 그라데이션 효과로 다시 나타남 + TTS + 별+효과음 → 다음
        setTextKey((k) => k + 1);
        setShowText(true);
        stopSpeaking();
        speak(current.corrected, () => {
          setShowStar(true);
          playDingDong();
          setTimeout(() => {
            setShowStar(false);
            setAttemptCount(0);
            if (isLast) {
              setShowGoodStamp(true);
              const audio = new Audio(GOOD_STAMP_AUDIO);
              audioRef.current = audio;
              audio.onerror = () => {};
              audio.play().catch(() => {});
            } else {
              setIndex((i) => i + 1);
              setTextKey((k) => k + 1);
              setShowText(true);
            }
          }, 1200);
        });
      }
    },
    [current, isLast, attemptCount]
  );

  useEffect(() => {
    onResultRef.current = handleResult;
  }, [handleResult]);

  useEffect(() => {
    if (items.length === 0) {
      onComplete();
      return;
    }
    setShowText(true);
    setShowMic(false);
    speak(items[0].corrected, () => setShowMic(true));
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (items.length === 0 || index === 0) return;
    const item = items[index];
    if (!item) return;
    stopSpeaking();
    setShowMic(false);
    speak(item.corrected, () => setShowMic(true));
    return () => stopSpeaking();
  }, [index]);

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    startSTT();
  }, [showMic, startSTT]);

  const handleStampClick = useCallback(() => {
    if (showGoodStamp) onComplete();
  }, [showGoodStamp, onComplete]);

  if (items.length === 0) return null;

  return (
    <div
      className="screen-content screen-content--step3-colors-no-frame"
      data-screen="48"
      onClick={showGoodStamp ? handleStampClick : undefined}
      role={showGoodStamp ? 'button' : undefined}
      tabIndex={showGoodStamp ? 0 : undefined}
    >
      <div className="screen-center">
        <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        <div className="screen-main screen-main--vertical-center">
          {showText && current && (
            <p
              key={`${index}-${textKey}`}
              className={
                'main-text main-text--two-lines main-text--gradient-sequential' +
                (isBlinking ? ' main-text--correction-blink' : '')
              }
            >
              {current.corrected}
            </p>
          )}
        </div>
        <div className="screen-bottom">
          <button
            type="button"
            className={'mic-btn mic-btn--step3' + (showMic ? '' : ' realtalk2-mic--hidden')}
            onClick={onMicClick}
            disabled={!showMic || isListening || isEvaluating}
            aria-label="Microphone"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </button>
        </div>
      </div>

      {showStar && (
        <div className="checkmark-popup step12-complete-popup" role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}

      {showGoodStamp && (
        <div
          className="screen7-stamp-popup screen7-stamp-popup--overlay recap-good-stamp-overlay"
          role="status"
          aria-live="polite"
          onClick={(e) => { e.stopPropagation(); handleStampClick(); }}
        >
          <div className="screen7-stamp-circle recap-good-stamp-circle">
            <svg className="screen7-stamp-svg" viewBox="0 0 120 120" aria-hidden>
              <defs>
                <path id="recap-correction-stamp-star" d="M0 -2.1 L0.5 -0.5 L2.2 -0.5 L0.8 0.5 L1.3 2.1 L0 1.1 L-1.3 2.1 L-0.8 0.5 L-2.2 -0.5 L-0.5 -0.5 Z" fill="#fff" />
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth={3} />
              <use href="#recap-correction-stamp-star" transform="translate(98, 38) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(82, 22) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(60, 16) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(38, 22) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(22, 38) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(22, 82) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(38, 98) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(60, 104) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(82, 98) scale(2)" />
              <use href="#recap-correction-stamp-star" transform="translate(98, 82) scale(2)" />
              <text x="60" y="62" textAnchor="middle" dominantBaseline="central" className="screen7-stamp-text" fill="#fff">
                GOOD!
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
