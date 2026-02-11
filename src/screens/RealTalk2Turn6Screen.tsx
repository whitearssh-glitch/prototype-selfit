/**
 * Real Talk 2 – Turn 6 (인덱스 40)
 * 마이크 음성인식 → real7.mp3 재생 완료 후 → Good job 도장 + fb1.mp3 재생.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';

const REALTALK_IMAGE_GIRL1 = '/girl1.png';
const TURN6_AUDIO = '/real7.mp3';
const TURN6_STAMP_AUDIO = '/fb1.mp3';
/** real7 재생 완료 후 도장+fb1까지 대기 시간(ms) */
const TURN6_DELAY_AFTER_REAL7_MS = 2000;

export function RealTalk2Turn6Screen() {
  const [showMic, setShowMic] = useState(true);
  const [showGoodStamp, setShowGoodStamp] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stampDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stampAndFb1DoneRef = useRef(false);

  const onSTTResult = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (stampDelayTimerRef.current) {
      clearTimeout(stampDelayTimerRef.current);
      stampDelayTimerRef.current = null;
    }
    stampAndFb1DoneRef.current = false;
    setShowMic(false);

    const audio = new Audio(TURN6_AUDIO);
    audioRef.current = audio;

    const showStampAndFb1 = () => {
      if (stampAndFb1DoneRef.current) return;
      stampAndFb1DoneRef.current = true;
      stampDelayTimerRef.current = null;
      setShowGoodStamp(true);
      const stamp = new Audio(TURN6_STAMP_AUDIO);
      stamp.onerror = () => {};
      stamp.play().catch(() => {});
    };

    audio.onended = () => {
      audioRef.current = null;
      if (stampDelayTimerRef.current) return;
      stampDelayTimerRef.current = setTimeout(showStampAndFb1, TURN6_DELAY_AFTER_REAL7_MS);
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
      if (stampDelayTimerRef.current) {
        clearTimeout(stampDelayTimerRef.current);
        stampDelayTimerRef.current = null;
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
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="40">
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

      {showGoodStamp && (
        <div
          className="screen7-stamp-popup screen7-stamp-popup--overlay recap-good-stamp-overlay"
          role="button"
          tabIndex={0}
          aria-label="Good"
          onClick={(e) => { e.stopPropagation(); setShowGoodStamp(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowGoodStamp(false); } }}
        >
          <div className="screen7-stamp-circle recap-good-stamp-circle">
            <svg className="screen7-stamp-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="turn6-stamp-star" d="M0 -2.1 L0.5 -0.5 L2.2 -0.5 L0.8 0.5 L1.3 2.1 L0 1.1 L-1.3 2.1 L-0.8 0.5 L-2.2 -0.5 L-0.5 -0.5 Z" fill="#fff" />
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="3" />
              <use href="#turn6-stamp-star" transform="translate(98, 38) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(82, 22) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(60, 16) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(38, 22) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(22, 38) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(22, 82) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(38, 98) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(60, 104) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(82, 98) scale(2)" />
              <use href="#turn6-stamp-star" transform="translate(98, 82) scale(2)" />
              <text x="60" y="62" textAnchor="middle" dominantBaseline="central" className="screen7-stamp-text" fill="#fff">Good!</text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
