import { ThinkingImage } from '../components/ThinkingImage';
/**
 * Real Talk 10 – Favorite Movies (Real Talk 6 기반) + 유저 턴 힌트(3개)
 *
 * - 힌트 생성 시작: AI 문장 확정 순간
 * - 힌트 노출: AI TTS 종료 후, 유저 턴 시작(마이크 ON) 시점
 * - 교정 턴: 기존 UX 유지 (힌트 시스템 개입 없음)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSTT } from '../useSTT';
import { speak, stopSpeaking } from '../realTalk6TTS';
import { evaluateUserUtterance, getCathyFirstPhrase, type AIEvaluationResult } from '../realTalk6Gemini';
import type { ErrorLogItem, RealTalk6Data, SummaryItem } from '../realTalk6Types';

const REALTALK10_TOPIC = 'TOPIC: Favorite Movies';
const REALTALK10_IMAGE = '/man1.png';
const STAR_POPUP_DELAY_MS = 2000;

type HintState =
  | { status: 'idle'; hints: string[] }
  | { status: 'loading'; hints: string[] }
  | { status: 'ready'; hints: string[] }
  | { status: 'fallback'; hints: string[] };

const FIRST_TURN_FIXED_HINTS = ['yes', 'movie', 'like'] as const;
const SECOND_TURN_FIXED_HINTS = ['scary', 'funny', 'action'] as const;
const THIRD_TURN_FIXED_HINTS = ['yes', 'movie theater', 'go'] as const;
const FOURTH_TURN_FIXED_HINTS = ['good', 'great', 'sure'] as const;
const FIFTH_TURN_FIXED_HINTS = ["2 o'clock", "5 o'clock", "7 o'clock"] as const;

function shuffle3<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** nextUserTurnIndex 0~4: 고정 힌트 + 셔플. 5 이상: null → API 동적 생성 */
function getFixedHintsForUserTurn(nextUserTurnIndex: number): string[] | null {
  switch (nextUserTurnIndex) {
    case 0:
      return shuffle3(FIRST_TURN_FIXED_HINTS);
    case 1:
      return shuffle3(SECOND_TURN_FIXED_HINTS);
    case 2:
      return shuffle3(THIRD_TURN_FIXED_HINTS);
    case 3:
      return shuffle3(FOURTH_TURN_FIXED_HINTS);
    case 4:
      return shuffle3(FIFTH_TURN_FIXED_HINTS);
    default:
      return null;
  }
}

function getFallbackHints(cathyPhrase: string): string[] {
  const p = cathyPhrase.toLowerCase();
  if (p.includes('scary') || p.includes('funny')) return ['scary', 'funny', 'action'];
  if (p.includes('movie')) return ['yes', 'like', 'cool'];
  if (p.includes('time') || p.includes("o'clock")) return ["2 o'clock", "5 o'clock", "7 o'clock"];
  return ['good', 'sure', 'great'];
}

async function fetchHints(payload: {
  cathyPhrase: string;
  conversationSummary: SummaryItem[];
  userTurnIndex: number;
}): Promise<string[]> {
  const res = await fetch('/api/realtalk10-hints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as null | { hints?: unknown };
  if (!res.ok) throw new Error('hint api error');
  const hints = Array.isArray(data?.hints) ? data!.hints : null;
  if (!hints) throw new Error('invalid hint response');
  const normalizeOneWord = (s: string): string =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .trim()
      .split(/\s+/)[0] || '';
  const cleaned = hints
    .map((h) => normalizeOneWord(String(h ?? '')))
    .filter(Boolean)
    .slice(0, 3);
  if (cleaned.length !== 3) throw new Error('need 3 hints');
  return cleaned;
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

type RealTalk10ScreenProps = {
  firstPhraseDone?: boolean;
  firstPhraseInProgress?: boolean;
  onComplete: (data: RealTalk6Data) => void;
};

type Phase = 'cathy' | 'user' | 'correction' | 'no-speech';

export function RealTalk10Screen({ firstPhraseDone = false, firstPhraseInProgress = false, onComplete }: RealTalk10ScreenProps) {
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

  const [hintState, setHintState] = useState<HintState>({ status: 'idle', hints: [] });
  const [showHints, setShowHints] = useState(false);
  const hintReqIdRef = useRef(0);

  const cathyPhraseRef = useRef('');
  const cathyPhraseKoRef = useRef('');
  const summaryRef = useRef<SummaryItem[]>([]);
  const errorLogRef = useRef<ErrorLogItem[]>([]);
  summaryRef.current = conversationSummary;
  errorLogRef.current = errorLog;

  const onResultRef = useRef<(t: string) => void>(() => {});
  const isProcessingRef = useRef(false);
  const { start: startSTT, isListening, useWhisper } = useSTT((t) => onResultRef.current(t), { useApiStt: true });

  const generateHintsForPhrase = useCallback((phrase: string, idx: number, summary: SummaryItem[]) => {
    const reqId = ++hintReqIdRef.current;
    setHintState({ status: 'loading', hints: [] });
    void fetchHints({ cathyPhrase: phrase, userTurnIndex: idx, conversationSummary: summary })
      .then((hints) => {
        if (hintReqIdRef.current !== reqId) return;
        setHintState({ status: 'ready', hints });
      })
      .catch(() => {
        if (hintReqIdRef.current !== reqId) return;
        setHintState({ status: 'fallback', hints: getFallbackHints(phrase) });
      });
  }, []);

  const playCathyAndShowMic = useCallback(
    (phrase: string, phraseKo: string, showText: boolean, nextUserTurnIndex: number) => {
      stopSpeaking();
      setShowMic(false);
      setShowHints(false);
      setShowTextAbove(showText);
      setCorrectionText('');
      cathyPhraseRef.current = phrase;
      cathyPhraseKoRef.current = phraseKo;
      setCurrentCathyPhrase(phrase);
      setCurrentCathyPhraseKo(phraseKo);

      const fixed = getFixedHintsForUserTurn(nextUserTurnIndex);
      if (fixed) {
        hintReqIdRef.current++;
        setHintState({ status: 'ready', hints: fixed });
      } else {
        generateHintsForPhrase(phrase, nextUserTurnIndex, summaryRef.current);
      }

      speak(phrase, () => {
        setShowMic(true);
        setShowHints(true);
      });
    },
    [generateHintsForPhrase]
  );

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
        { speaker: 'Kevin', textEn: result.cathyPhrase, textKo: result.cathyPhraseKo },
      ];
      setConversationSummary(newSummary);
      summaryRef.current = newSummary;

      if (result.isLastTurn) {
        setShowMic(false);
        setShowHints(false);
        speak(result.cathyPhrase, () => {
          setTimeout(() => {
            setShowStarPopup(true);
            playDingDong();
          }, STAR_POPUP_DELAY_MS);
        });
        return;
      }

      const nextTurnIndex = userTurnIndex + 1;
      setUserTurnIndex(nextTurnIndex);
      setPhase('user');
      playCathyAndShowMic(result.cathyPhrase, result.cathyPhraseKo ?? '', false, nextTurnIndex);
    },
    [playCathyAndShowMic, userTurnIndex]
  );

  const handleUserUtterance = useCallback(
    async (userText: string) => {
      if (isProcessingRef.current) return;
      const t = userText.trim();
      if (!t) {
        setShowMic(false);
        setShowHints(false);
        setShowTextAbove(true);
        setPhase('no-speech');
        stopSpeaking();
        speak(cathyPhraseRef.current, () => {
          setShowMic(true);
          setShowHints(true);
        });
        return;
      }

      isProcessingRef.current = true;
      setShowMic(false);
      setShowHints(false);
      setIsEvaluating(true);
      const result = await evaluateUserUtterance(t, summaryRef.current, userTurnIndex);
      setIsEvaluating(false);
      isProcessingRef.current = false;

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
        setPhase('correction');
        const directionPhrase = result.correction.type === 'naturalness'
          ? 'So close! You can also say!'
          : 'Nice try! Say it like this.';
        speak(directionPhrase, () => {
          setCorrectionText(result.correction!.sentence);
          setShowTextAbove(true);
          speak(result.correction!.sentence, () => {
            setShowMic(true);
            setShowHints(false);
          });
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
      const init: SummaryItem[] = [{ speaker: 'Kevin', textEn: first.en, textKo: first.ko }];
      setConversationSummary(init);
      summaryRef.current = init;
      setCurrentCathyPhrase(first.en);
      setCurrentCathyPhraseKo(first.ko);
      cathyPhraseRef.current = first.en;
      cathyPhraseKoRef.current = first.ko;
      setPhase('user');
      setShowMic(false);
      setShowHints(false);
      hintReqIdRef.current++;
      setHintState({ status: 'ready', hints: getFixedHintsForUserTurn(0)! });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstPhraseDone) {
      setShowMic(true);
      setShowHints(true);
    }
  }, [firstPhraseDone]);

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    startSTT();
  }, [showMic, startSTT]);

  const onListenClick = useCallback(() => {
    const first = getCathyFirstPhrase();
    setShowMic(false);
    setShowHints(false);
    hintReqIdRef.current++;
    setHintState({ status: 'ready', hints: getFixedHintsForUserTurn(0)! });
    speak(first.en, () => {
      setShowMic(true);
      setShowHints(true);
    });
  }, []);

  const showListenBtn = !showMic && !firstPhraseDone && !firstPhraseInProgress && userTurnIndex === 0;

  const hintLines = useMemo(() => {
    if (!showHints) return null;
    if (hintState.status === 'loading') return ['Loading…', 'Loading…', 'Loading…'];
    const h = hintState.hints.length ? hintState.hints : getFallbackHints(currentCathyPhrase);
    return [h[0] || ' ', h[1] || ' ', h[2] || ' '];
  }, [hintState, showHints, currentCathyPhrase]);

  const showHintRow = Boolean(hintLines) && phase === 'user' && showMic && !showStarPopup;

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
          <div className="topic-box topic-box--step3">{REALTALK10_TOPIC}</div>
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
          <ThinkingImage src={REALTALK10_IMAGE} className="realtalk-main-image" evaluating={isEvaluating} />
        </div>

        <div className="realtalk2-text-below realtalk2-slot-two-lines" aria-hidden={!showHintRow}>
          {showHintRow && hintLines ? (
            <div className="realtalk-hints-frames-row" role="note" aria-label="Hints">
              <div className="realtalk-hint-word-frame realtalk-hint-word-frame--glow">
                <span className="realtalk-hint-word-frame-text">{hintLines[0]}</span>
              </div>
              <div className="realtalk-hint-word-frame realtalk-hint-word-frame--glow">
                <span className="realtalk-hint-word-frame-text">{hintLines[1]}</span>
              </div>
              <div className="realtalk-hint-word-frame realtalk-hint-word-frame--glow">
                <span className="realtalk-hint-word-frame-text">{hintLines[2]}</span>
              </div>
            </div>
          ) : (
            <span className="realtalk2-text-placeholder" />
          )}
        </div>

        <div className="realtalk-bottom realtalk2-bottom--fixed-height">
          {showListenBtn ? (
            <button type="button" className="realtalk-go-btn" onClick={onListenClick} aria-label="Listen">
              Listen
            </button>
          ) : (
            <button
              type="button"
              className={
                'mic-btn mic-btn--step3' +
                (isListening ? (useWhisper ? ' mic-btn--recording' : ' mic-btn--listening') : '') +
                (showMic ? '' : ' realtalk2-mic--hidden')
              }
              onClick={onMicClick}
              disabled={!showMic || isEvaluating || (!useWhisper && isListening)}
              aria-label={useWhisper && isListening ? '녹음 종료 (다시 누르기)' : '마이크'}
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

