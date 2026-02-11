/**
 * Real Talk 2 – Turn 6 (인덱스 40)
 * 마이크 음성인식 → real7.mp3 재생 완료 후 → 별 표시 팝업 + 딩동 효과음.
 * 별 팝업·효과음 후 화면 클릭 시 인덱스 41로 이동.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';

const REALTALK_IMAGE_GIRL1 = '/girl1.png';
const TURN6_AUDIO = '/real7.mp3';
/** real7 재생 완료 후 별 팝업+효과음까지 대기 시간(ms) */
const TURN6_DELAY_AFTER_REAL7_MS = 2000;

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

type RealTalk2Turn6ScreenProps = {
  onNext?: () => void;
};

export function RealTalk2Turn6Screen({ onNext }: RealTalk2Turn6ScreenProps) {
  const [showMic, setShowMic] = useState(true);
  const [showStarPopup, setShowStarPopup] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const starDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const starPopupDoneRef = useRef(false);

  const onSTTResult = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (starDelayTimerRef.current) {
      clearTimeout(starDelayTimerRef.current);
      starDelayTimerRef.current = null;
    }
    starPopupDoneRef.current = false;
    setShowMic(false);
    setShowStarPopup(false);

    const audio = new Audio(TURN6_AUDIO);
    audioRef.current = audio;

    const showStarPopupAndSound = () => {
      if (starPopupDoneRef.current) return;
      starPopupDoneRef.current = true;
      starDelayTimerRef.current = null;
      setShowStarPopup(true);
      playDingDong();
    };

    audio.onended = () => {
      audioRef.current = null;
      if (starDelayTimerRef.current) return;
      starDelayTimerRef.current = setTimeout(showStarPopupAndSound, TURN6_DELAY_AFTER_REAL7_MS);
    };
    audio.onerror = () => {
      audioRef.current = null;
    };
    audio.play().catch(() => {
      audioRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (starDelayTimerRef.current) {
        clearTimeout(starDelayTimerRef.current);
        starDelayTimerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const { start: startSTT, isListening } = useSTT(onSTTResult, { useApiStt: false });

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    startSTT();
  }, [showMic, startSTT]);

  return (
    <div
      className="screen-content screen-content--step3-colors-no-frame" data-screen="40"
      onClick={showStarPopup ? () => onNext?.() : undefined}
      role={showStarPopup ? 'button' : undefined}
      tabIndex={showStarPopup ? 0 : undefined}
    >
      <div className="realtalk2-layout realtalk-layout--reserve-go-space realtalk-layout--with-text-slots">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        <div className="realtalk2-text-above realtalk2-slot-two-lines" aria-hidden="true">
          <span className="realtalk2-text-placeholder" />
        </div>
        <div className="realtalk-main">
          <img src={REALTALK_IMAGE_GIRL1} alt="" className="realtalk-main-image" />
        </div>
        <div className="realtalk2-text-below realtalk2-slot-two-lines" aria-hidden="true">
          <span className="realtalk2-text-placeholder" />
        </div>
        <div className="realtalk-bottom realtalk2-bottom--fixed-height">
          <button
            type="button"
            className={
              'mic-btn mic-btn--step3' + (showMic ? '' : ' realtalk2-mic--hidden')
            }
            onClick={onMicClick}
            disabled={!showMic || isListening}
            aria-label="Microphone"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </button>
        </div>
      </div>

      {showStarPopup && (
        <div
          className="checkmark-popup roleplay-complete-popup"
          role="button"
          tabIndex={0}
          aria-label="완료"
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext?.(); } }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
