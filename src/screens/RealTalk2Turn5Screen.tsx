/**
 * Real Talk 2 – Turn 5 (인덱스 39)
 *
 * 플로우 (사양):
 * 1. 인덱스 39 진입 → 마이크 등장
 * 2. 음성인식 → 오답4 realtalk3_x1.mp3 재생 → 마이크 등장 (턴6 재시도)
 * 3. 음성인식 → 오답2 구성: realtalk_x3 재생 → 0.3초 후 realtalk4_x1 재생 + 이미지 위 "I am a student." 그라데이션 텍스트 → 마이크 등장
 * 4. 음성인식 → real5.mp3 재생
 * 5. 재생 완료 후 인덱스 40으로 이동
 * Next 버튼 없음.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';

const REALTALK_IMAGE_GIRL1 = '/girl1.png';
const TURN5_INCORRECT4_AUDIO = '/realtalk3_x1.mp3';
const TURN5_INCORRECT2_FIRST_AUDIO = '/realtalk_x3.mp3';
const TURN5_INCORRECT2_MODEL_AUDIO = '/realtalk4_x1.mp3';
const TURN5_MODEL_TEXT = 'I am a student.';
const TURN5_NEXT_AUDIO = '/real5.mp3';

type RealTalk2Turn5ScreenProps = {
  onNext?: () => void;
};

export function RealTalk2Turn5Screen({ onNext }: RealTalk2Turn5ScreenProps) {
  const [showMic, setShowMic] = useState(true);
  const [showModelText, setShowModelText] = useState(false);
  const [incorrect4Done, setIncorrect4Done] = useState(false);
  const [incorrect2StyleDone, setIncorrect2StyleDone] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firstAudioRef = useRef<HTMLAudioElement | null>(null);
  const modelAudioRef = useRef<HTMLAudioElement | null>(null);

  const clearAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (firstAudioRef.current) {
      firstAudioRef.current.pause();
      firstAudioRef.current = null;
    }
    if (modelAudioRef.current) {
      modelAudioRef.current.pause();
      modelAudioRef.current = null;
    }
  }, []);

  const playIncorrect4ThenShowMic = useCallback(() => {
    clearAllAudio();
    setShowMic(false);
    setShowModelText(false);

    const audio = new Audio(TURN5_INCORRECT4_AUDIO);
    audioRef.current = audio;
    const finish = () => {
      audioRef.current = null;
      setIncorrect4Done(true);
      setShowMic(true);
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  }, [clearAllAudio]);

  const playIncorrect2StyleThenShowMic = useCallback(() => {
    clearAllAudio();
    setShowMic(false);
    setShowModelText(false);

    const first = new Audio(TURN5_INCORRECT2_FIRST_AUDIO);
    firstAudioRef.current = first;

    first.onended = () => {
      firstAudioRef.current = null;
      setTimeout(() => {
        const model = new Audio(TURN5_INCORRECT2_MODEL_AUDIO);
        modelAudioRef.current = model;
        setShowModelText(true);
        model.onended = () => {
          modelAudioRef.current = null;
          setIncorrect2StyleDone(true);
          setShowMic(true);
        };
        model.onerror = () => {
          modelAudioRef.current = null;
          setIncorrect2StyleDone(true);
          setShowMic(true);
        };
        model.play().catch(() => {
          modelAudioRef.current = null;
          setIncorrect2StyleDone(true);
          setShowMic(true);
        });
      }, 300);
    };

    const onFirstError = () => {
      firstAudioRef.current = null;
      setIncorrect2StyleDone(true);
      setShowMic(true);
    };
    first.onerror = onFirstError;
    first.play().catch(onFirstError);
  }, [clearAllAudio]);

  const playReal5AndGoNext = useCallback(() => {
    clearAllAudio();
    setShowMic(false);

    const audio = new Audio(TURN5_NEXT_AUDIO);
    audioRef.current = audio;
    const finish = () => {
      audioRef.current = null;
      onNext?.();
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  }, [clearAllAudio, onNext]);

  const onSTTResult = useCallback(() => {
    if (!incorrect4Done) {
      playIncorrect4ThenShowMic();
    } else if (!incorrect2StyleDone) {
      playIncorrect2StyleThenShowMic();
    } else {
      playReal5AndGoNext();
    }
  }, [incorrect4Done, incorrect2StyleDone, playIncorrect4ThenShowMic, playIncorrect2StyleThenShowMic, playReal5AndGoNext]);

  const { start: startSTT, isListening } = useSTT(onSTTResult, { useApiStt: false });

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    startSTT();
  }, [showMic, startSTT]);

  useEffect(() => {
    return () => clearAllAudio();
  }, [clearAllAudio]);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="39">
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
              {TURN5_MODEL_TEXT}
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
