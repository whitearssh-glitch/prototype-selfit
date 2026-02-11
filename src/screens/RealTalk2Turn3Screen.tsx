/**
 * Real Talk 2 – Turn 3
 * 턴3: 오답2 로직(STT → realtalk_x2 → realtalk2_x1 + Nice to meet you!) 후,
 * 마이크로 음성인식 하면 real3.mp3 재생 → 종료 시 인덱스 39(턴5)로 전환.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';

const REALTALK_IMAGE_GIRL1 = '/girl1.png';
const TURN3_INCORRECT2_FIRST_AUDIO = '/realtalk_x2.mp3';
const TURN3_INCORRECT2_MODEL_AUDIO = '/realtalk2_x1.mp3';
const TURN3_MODEL_TEXT = 'Nice to meet you!';
const TURN3_NEXT_AUDIO = '/real3.mp3';

type RealTalk2Turn3ScreenProps = {
  onNext?: () => void;
};

export function RealTalk2Turn3Screen({ onNext }: RealTalk2Turn3ScreenProps) {
  const [showMic, setShowMic] = useState(true);
  const [showModelText, setShowModelText] = useState(false);
  const [showTapToNext, setShowTapToNext] = useState(false);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const modelAudioRef = useRef<HTMLAudioElement | null>(null);
  const real3TimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapToNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const playTurn3Incorrect2 = useCallback(() => {
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current = null;
    }
    if (modelAudioRef.current) {
      modelAudioRef.current.pause();
      modelAudioRef.current = null;
    }

    setShowMic(false);
    setShowModelText(false);

    const first = new Audio(TURN3_INCORRECT2_FIRST_AUDIO);
    introAudioRef.current = first;

    first.onended = () => {
      introAudioRef.current = null;
      setTimeout(() => {
        const model = new Audio(TURN3_INCORRECT2_MODEL_AUDIO);
        modelAudioRef.current = model;
        setShowModelText(true);
        model.onended = () => {
          modelAudioRef.current = null;
          setShowMic(true);
        };
        model.onerror = () => {
          modelAudioRef.current = null;
          setShowMic(true);
        };
        model.play().catch(() => {
          modelAudioRef.current = null;
          setShowMic(true);
        });
      }, 300);
    };

    const onFirstError = () => {
      introAudioRef.current = null;
      setShowMic(true);
    };
    first.onerror = onFirstError;
    first.play().catch(onFirstError);
  }, []);

  const playReal3AndGoToTurn5 = useCallback(() => {
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current = null;
    }
    if (modelAudioRef.current) {
      modelAudioRef.current.pause();
      modelAudioRef.current = null;
    }
    if (real3TimeoutRef.current) {
      clearTimeout(real3TimeoutRef.current);
      real3TimeoutRef.current = null;
    }
    setShowMic(false);
    setShowTapToNext(false);
    if (tapToNextTimerRef.current) {
      clearTimeout(tapToNextTimerRef.current);
      tapToNextTimerRef.current = null;
    }
    tapToNextTimerRef.current = setTimeout(() => setShowTapToNext(true), 3000);

    const next = new Audio(TURN3_NEXT_AUDIO);
    introAudioRef.current = next;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (tapToNextTimerRef.current) {
        clearTimeout(tapToNextTimerRef.current);
        tapToNextTimerRef.current = null;
      }
      if (real3TimeoutRef.current) {
        clearTimeout(real3TimeoutRef.current);
        real3TimeoutRef.current = null;
      }
      introAudioRef.current = null;
      onNextRef.current?.();
    };
    next.onended = finish;
    next.onerror = finish;
    next.play().catch(finish);
    real3TimeoutRef.current = setTimeout(finish, 8000);
  }, []);

  const onSTTResult = useCallback(() => {
    // 오답2 한 번 보여준 뒤에는, 이후 STT 시 real3 재생 후 턴5로
    if (showModelText) {
      playReal3AndGoToTurn5();
    } else {
      playTurn3Incorrect2();
    }
  }, [showModelText, playTurn3Incorrect2, playReal3AndGoToTurn5]);

  const { start: startSTT, isListening } = useSTT(onSTTResult, { useApiStt: false });

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    startSTT();
  }, [showMic, startSTT]);

  useEffect(() => {
    return () => {
      if (tapToNextTimerRef.current) {
        clearTimeout(tapToNextTimerRef.current);
        tapToNextTimerRef.current = null;
      }
      if (real3TimeoutRef.current) {
        clearTimeout(real3TimeoutRef.current);
        real3TimeoutRef.current = null;
      }
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current = null;
      }
      if (modelAudioRef.current) {
        modelAudioRef.current.pause();
        modelAudioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="realtalk2-layout realtalk-layout--reserve-go-space realtalk-layout--with-text-slots">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        <div
          className={
            'realtalk2-text-above realtalk2-slot-two-lines' +
            (showModelText ? ' realtalk2-text-above--has-content' : '')
          }
          aria-hidden={!showModelText}
        >
          {showModelText ? (
            <p className="realtalk2-model-text main-text--gradient-sequential">
              {TURN3_MODEL_TEXT}
            </p>
          ) : (
            <span className="realtalk2-text-placeholder" />
          )}
        </div>
        <div className="realtalk-main">
          <img src={REALTALK_IMAGE_GIRL1} alt="" className="realtalk-main-image" />
        </div>
        <div className="realtalk2-text-below realtalk2-slot-two-lines" aria-hidden="true">
          <span className="realtalk2-text-placeholder" />
        </div>
        {showTapToNext && (
          <button
            type="button"
            className="realtalk2-tap-to-next"
            onClick={() => onNextRef.current?.()}
            aria-label="다음으로"
          >
            탭하여 다음
          </button>
        )}
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
    </div>
  );
}

