/**
 * Real Talk 3 – 인덱스 44
 * 11턴 대화 (AI 6턴, 사용자 5턴). Mock AI + TTS + STT.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';
import { speak, stopSpeaking } from '../realTalk3TTS';
import {
  evaluateUserUtterance,
  getCathyFirstPhrase,
  type AIEvaluationResult,
} from '../realTalk3Gemini';
import type { ErrorLogItem, RealTalk3Data, SummaryItem } from '../realTalk3Types';

const REALTALK_IMAGE_GIRL1 = '/girl1.png';

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

type RealTalk3ScreenProps = {
  /** GO 버튼 클릭 시 speak()가 호출된 후 종료되면 true. 사용자 제스처 보장용 */
  firstPhraseDone?: boolean;
  /** GO 클릭 후 speak 재생 중 (직접 진입이 아님) */
  firstPhraseInProgress?: boolean;
  onComplete: (data: RealTalk3Data) => void;
};

type Phase = 'cathy' | 'user' | 'correction' | 'no-speech';

export function RealTalk3Screen({ firstPhraseDone = false, firstPhraseInProgress = false, onComplete }: RealTalk3ScreenProps) {
  const [userTurnIndex, setUserTurnIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('cathy');
  const [conversationSummary, setConversationSummary] = useState<SummaryItem[]>([]);
  const [errorLog, setErrorLog] = useState<ErrorLogItem[]>([]);
  const [currentCathyPhrase, setCurrentCathyPhrase] = useState('');
  const [currentCathyPhraseKo, setCurrentCathyPhraseKo] = useState('');
  const [showTextAbove, setShowTextAbove] = useState(false);
  const [showKo, setShowKo] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [showMic, setShowMic] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showStarPopup, setShowStarPopup] = useState(false);
  const cathyPhraseRef = useRef('');
  const cathyPhraseKoRef = useRef('');
  const summaryRef = useRef<SummaryItem[]>([]);
  const errorLogRef = useRef<ErrorLogItem[]>([]);
  summaryRef.current = conversationSummary;
  errorLogRef.current = errorLog;

  const onResultRef = useRef<(t: string) => void>(() => {});
  const { start: startSTT, isListening } = useSTT(
    (t) => onResultRef.current(t),
    { useApiStt: false }
  );

  const playCathyAndShowMic = useCallback((phrase: string, phraseKo: string, showText: boolean) => {
    stopSpeaking();
    setShowMic(false);
    setShowTextAbove(showText);
    setCorrectionText('');
    cathyPhraseRef.current = phrase;
    cathyPhraseKoRef.current = phraseKo;
    setCurrentCathyPhrase(phrase);
    setCurrentCathyPhraseKo(phraseKo);
    speak(phrase, () => setShowMic(true));
  }, []);

  const doComplete = useCallback(() => {
    onComplete({
      conversationSummary: [...summaryRef.current],
      errorLog: [...errorLogRef.current],
    });
  }, [onComplete]);

  const handleUserAccepted = useCallback(
    (userText: string, result: AIEvaluationResult) => {
      const newSummary: SummaryItem[] = [
        ...summaryRef.current,
        { speaker: 'Me', textEn: userText },
        { speaker: 'Cathy', textEn: result.cathyPhrase, textKo: result.cathyPhraseKo },
      ];
      setConversationSummary(newSummary);
      summaryRef.current = newSummary;

      if (result.isLastTurn) {
        setShowMic(false);
        speak(result.cathyPhrase, () => {
          setShowStarPopup(true);
          playDingDong();
        });
        return;
      }

      setUserTurnIndex((i) => i + 1);
      setPhase('user');
      playCathyAndShowMic(result.cathyPhrase, result.cathyPhraseKo ?? '', false);
    },
    [userTurnIndex, playCathyAndShowMic, doComplete]
  );

  const handleUserUtterance = useCallback(
    async (userText: string) => {
      const t = userText.trim();
      if (!t) {
        setShowMic(false);
        setShowTextAbove(true);
        setPhase('no-speech');
        stopSpeaking(); // 이전 TTS 정지 후 재생 (겹침 방지)
        speak(cathyPhraseRef.current, () => setShowMic(true));
        return;
      }

      setShowMic(false);
      setIsEvaluating(true);
      const result = await evaluateUserUtterance(t, summaryRef.current, userTurnIndex);
      setIsEvaluating(false);

      if (result.correction) {
        const newError: ErrorLogItem = {
          original: t,
          corrected: result.correction.sentence,
          errorType: result.correction.type,
          explanation: result.correction.explanation,
        };
        setErrorLog((prev) => {
          const next = [...prev, newError];
          errorLogRef.current = next;
          return next;
        });
        // 교정 시: 1) 인트로 TTS → 2) 교정문 그라데이션 표시 + 교정문 TTS → 3) 마이크 (재시도, 턴 미포함)
        setPhase('correction');
        speak(result.cathyPhrase, () => {
          setCorrectionText(result.correction!.sentence);
          setShowTextAbove(true);
          speak(result.correction!.sentence, () => setShowMic(true));
        });
        return;
      }

      if (result.isOffTopic) {
        const newError: ErrorLogItem = {
          original: t,
          corrected: result.cathyPhrase,
          errorType: 'off-topic',
        };
        setErrorLog((prev) => {
          const next = [...prev, newError];
          errorLogRef.current = next;
          return next;
        });
        // 주제 이탈 시 요약에 추가하지 않음 (피드백 문장 제외)
        speak(result.cathyPhrase, () => setShowMic(true));
        return;
      }

      handleUserAccepted(t, result);
    },
    [userTurnIndex, handleUserAccepted]
  );

  useEffect(() => {
    onResultRef.current = handleUserUtterance;
  }, [handleUserUtterance]);

  useEffect(() => {
    if (phase === 'cathy' && userTurnIndex === 0) {
      const first = getCathyFirstPhrase();
      const init: SummaryItem[] = [{ speaker: 'Cathy', textEn: first.en, textKo: first.ko }];
      setConversationSummary(init);
      summaryRef.current = init;
      setCurrentCathyPhrase(first.en);
      setCurrentCathyPhraseKo(first.ko);
      cathyPhraseRef.current = first.en;
      cathyPhraseKoRef.current = first.ko;
      setPhase('user');
      setShowMic(false);
      // speak()는 App에서 GO 클릭 시 호출 (Chrome 사용자 제스처 필요)
    }
  }, []);

  useEffect(() => {
    if (firstPhraseDone) setShowMic(true);
  }, [firstPhraseDone]);

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    startSTT();
  }, [showMic, startSTT]);

  const onListenClick = useCallback(() => {
    const first = getCathyFirstPhrase();
    speak(first.en, () => setShowMic(true));
  }, []);

  const showListenBtn = !showMic && !firstPhraseDone && !firstPhraseInProgress && userTurnIndex === 0;

  return (
    <div
      className="screen-content screen-content--step3-colors-no-frame"
      onClick={showStarPopup ? () => doComplete() : undefined}
      role={showStarPopup ? 'button' : undefined}
      tabIndex={showStarPopup ? 0 : undefined}
      aria-label={showStarPopup ? '다음으로' : undefined}
      onKeyDown={showStarPopup ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doComplete(); } } : undefined}
    >
      <div className="realtalk2-layout realtalk-layout--reserve-go-space realtalk-layout--with-text-slots">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        <div
          className={
            'realtalk2-text-above realtalk2-slot-two-lines' +
            (showTextAbove || correctionText ? ' realtalk2-text-above--has-content' : '')
          }
          aria-hidden={!showTextAbove && !correctionText}
        >
          {phase === 'no-speech' && showTextAbove ? (
            <div className="realtalk2-text-frame">
              <button
                type="button"
                className="realtalk2-globe-btn"
                onClick={() => setShowKo((v) => !v)}
                aria-label={showKo ? '영어로 보기' : '한글로 보기'}
              >
                <span aria-hidden>{showKo ? 'E' : 'K'}</span>
              </button>
              <div className="realtalk2-text-lines">
                <p className={'realtalk2-text-frame-line' + (showKo ? ' realtalk2-text-frame-line--ghost' : '')}>
                  {currentCathyPhrase}
                </p>
                {showKo && (
                  <div className="realtalk2-text-lines-ko">
                    <p className="realtalk2-text-frame-line realtalk2-text-frame-line--ko">
                      {currentCathyPhraseKo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : correctionText ? (
            <p className="realtalk2-model-text main-text--gradient-sequential">{correctionText}</p>
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
          {showListenBtn ? (
            <button
              type="button"
              className="realtalk-go-btn"
              onClick={onListenClick}
              aria-label="Listen"
            >
              Listen
            </button>
          ) : (
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
          )}
        </div>
      </div>

      {showStarPopup && (
        <div
          className="checkmark-popup roleplay-complete-popup"
          role="status"
          aria-live="polite"
          onClick={(e) => { e.stopPropagation(); doComplete(); }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
