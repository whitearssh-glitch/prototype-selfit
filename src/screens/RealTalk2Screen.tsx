/**
 * Real Talk 2 (Index 37)
 * 이미지 등장과 함께 realtalk1.mp3 재생 → 음원 종료 후 마이크 표시 → 클릭 시 음성인식.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';

const REALTALK_IMAGE_GIRL1 = '/girl1.png';
const REALTALK2_INTRO_AUDIO = '/realtalk1.mp3';
// 오답2 로직용: realtalk_x → (0.3초 후) realtalk1_x1
const REALTALK2_SECOND_INTRO_AUDIO = '/realtalk_x.mp3';
const REALTALK2_MODEL_AUDIO = '/realtalk1_x1.mp3';
// 오답3 로직용: 다음 대화로 넘어가는 전이
const REALTALK2_NEXT_AUDIO = '/real2.mp3';

/** 1차 오답 시 이미지 위 텍스트 (1행: Hi! I'm Cathy. / 2행: What's your name?) */
const REALTALK2_INCORRECT_TEXT_ABOVE = { line1: "Hi! I'm Cathy.", line2: "What's your name?" };
const REALTALK2_KOREAN_MEANING = '안녕! 나는 캐시야. 네 이름은 뭐야?';
// 기존 오답2 로직에서 사용하던 모델 문장 텍스트
const REALTALK2_MODEL_TEXT = 'My name is Jenny.';

type RealTalk2ScreenProps = {
  onNext?: () => void;
};

export function RealTalk2Screen({ onNext }: RealTalk2ScreenProps) {
  const [showMic, setShowMic] = useState(false);
  const [textAboveImage, setTextAboveImage] = useState<{ line1: string; line2: string } | null>(null);
  const [showMeaningKo, setShowMeaningKo] = useState(false);
  const [showModelText, setShowModelText] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const modelAudioRef = useRef<HTMLAudioElement | null>(null);

  const playRealtalk1 = useCallback((onEnd: () => void) => {
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current = null;
    }
    const audio = new Audio(REALTALK2_INTRO_AUDIO);
    introAudioRef.current = audio;
    audio.onended = () => {
      introAudioRef.current = null;
      onEnd();
    };
    audio.onerror = () => {
      introAudioRef.current = null;
    };
    audio.play().catch(() => {
      introAudioRef.current = null;
    });
  }, []);

  const playSecondIncorrectSequence = useCallback(() => {
    // 이전 오디오 정리
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current = null;
    }
    if (modelAudioRef.current) {
      modelAudioRef.current.pause();
      modelAudioRef.current = null;
    }

    // 상단 말풍선 제거, 모델 문장 텍스트 모드로 전환 준비
    setTextAboveImage(null);
    setShowMeaningKo(false);
    setShowModelText(false);

    // 1) realtalk_x.mp3 재생 (성공적으로 끝난 뒤에만 다음 단계로 진행)
    const first = new Audio(REALTALK2_SECOND_INTRO_AUDIO);
    introAudioRef.current = first;

    first.onended = () => {
      introAudioRef.current = null;
      // 0.3초 쉬고 모델 문장 오디오 + 텍스트
      setTimeout(() => {
        const model = new Audio(REALTALK2_MODEL_AUDIO);
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

    first.onerror = () => {
      introAudioRef.current = null;
      setShowMic(true);
    };
    first.play().catch(() => {
      introAudioRef.current = null;
      setShowMic(true);
    });
  }, []);

  const playThirdIncorrectSequence = useCallback(() => {
    // 오답3: 다음 대화로 넘어가는 전이 – 상단 텍스트 제거, real2.mp3 재생 후 다음 턴으로 넘어감
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current = null;
    }
    if (modelAudioRef.current) {
      modelAudioRef.current.pause();
      modelAudioRef.current = null;
    }

    setTextAboveImage(null);
    setShowMeaningKo(false);
    setShowModelText(false);

    const nextAudio = new Audio(REALTALK2_NEXT_AUDIO);
    introAudioRef.current = nextAudio;
    const finish = () => {
      introAudioRef.current = null;
      // real2 재생이 끝나면 턴3 화면으로 전환
      onNext?.();
    };
    nextAudio.onended = finish;
    nextAudio.onerror = finish;
    nextAudio.play().catch(finish);
  }, [onNext]);

  const onSTTResult = useCallback(() => {
    // 첫 번째 시도: 오답1 로직 (말풍선 + realtalk1 재생)
    // 두 번째 시도: 오답2 로직 (상단 텍스트 제거 → realtalk_x + realtalk1_x1 + 모델 문장 텍스트)
    // 세 번째 시도 이후: 오답3 로직 (상단 텍스트 제거 → real2.mp3 재생 → 마이크 재등장)
    setShowMic(false);
    setShowMeaningKo(false);

    if (attemptCount === 0) {
      // 오답1 로직
      setAttemptCount(1);
      setTextAboveImage(REALTALK2_INCORRECT_TEXT_ABOVE);
      playRealtalk1(() => setShowMic(true));
    } else if (attemptCount === 1) {
      // 오답2 로직
      setAttemptCount(2);
      playSecondIncorrectSequence();
    } else {
      // 오답3 로직 (3번째 시도부터)
      setAttemptCount((prev) => prev + 1);
      playThirdIncorrectSequence();
    }
  }, [attemptCount, playRealtalk1, playSecondIncorrectSequence, playThirdIncorrectSequence]);

  const { start: startSTT, isListening } = useSTT(onSTTResult, { useApiStt: false });

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    // 오답3 로직: 세 번째 시도(이전까지 attemptCount >= 2)부터는
    // 마이크 누르는 순간 상단 텍스트/모델 텍스트를 바로 제거
    if (attemptCount >= 2) {
      setTextAboveImage(null);
      setShowMeaningKo(false);
      setShowModelText(false);
    }
    startSTT();
  }, [showMic, startSTT, attemptCount]);

useEffect(() => {
    playRealtalk1(() => setShowMic(true));
    return () => {
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current = null;
      }
      if (modelAudioRef.current) {
        modelAudioRef.current.pause();
        modelAudioRef.current = null;
      }
    };
  }, [playRealtalk1]);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="realtalk2-layout realtalk-layout--reserve-go-space realtalk-layout--with-text-slots">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        <div
          className={
            'realtalk2-text-above realtalk2-slot-two-lines' +
            (textAboveImage || showModelText ? ' realtalk2-text-above--has-content' : '')
          }
          aria-hidden={!(textAboveImage || showModelText)}
        >
          {textAboveImage ? (
            <div className="realtalk2-text-frame">
              <button
                type="button"
                className="realtalk2-globe-btn"
                onClick={() => setShowMeaningKo((v) => !v)}
                aria-label={showMeaningKo ? '영어로 보기' : '한글로 보기'}
              >
                <span aria-hidden>{showMeaningKo ? 'E' : 'K'}</span>
              </button>
              <div className="realtalk2-text-lines">
                {/* 영어 텍스트는 항상 레이아웃 기준이 되도록 렌더링 (한글일 때는 ghost 처리) */}
                <p
                  className={
                    'realtalk2-text-frame-line' +
                    (showMeaningKo ? ' realtalk2-text-frame-line--ghost' : '')
                  }
                >
                  {textAboveImage.line1}
                </p>
                <p
                  className={
                    'realtalk2-text-frame-line' +
                    (showMeaningKo ? ' realtalk2-text-frame-line--ghost' : '')
                  }
                >
                  {textAboveImage.line2}
                </p>
                {showMeaningKo && (
                  <div className="realtalk2-text-lines-ko">
                    <p className="realtalk2-text-frame-line realtalk2-text-frame-line--ko">
                      안녕! 나는 캐시야.
                    </p>
                    <p className="realtalk2-text-frame-line realtalk2-text-frame-line--ko">
                      네 이름은 뭐야?
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : showModelText ? (
            <p className="realtalk2-model-text main-text--gradient-sequential">
              {REALTALK2_MODEL_TEXT}
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
