import { ThinkingImage } from '../components/ThinkingImage';
/**
 * Real Talk 8 – Grocery Shopping (Real Talk 4 기반) + 유저 턴 힌트(3개)
 *
 * - 힌트 생성 시작: AI 문장 확정 순간
 * - 힌트 노출: AI TTS 종료 후, 유저 턴 시작(마이크 ON) 시점
 * - 교정 턴: 기존 UX 유지 (힌트 시스템 개입 없음)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSTT } from '../useSTT';
import { speakRealTalk4, stopSpeaking } from '../realTalk3TTS';
import { evaluateUserUtterance, getCathyFirstPhrase, type AIEvaluationResult } from '../realTalk4Gemini';
import type { ErrorLogItem, RealTalk4Data, SummaryItem } from '../realTalk4Types';

const REALTALK8_TOPIC = 'TOPIC: Grocery Shopping';
const REALTALK8_IMAGE = '/woman1.png';
const STAR_POPUP_DELAY_MS = 2000;

type HintState =
  | { status: 'idle'; hints: string[] }
  | { status: 'loading'; hints: string[] }
  | { status: 'ready'; hints: string[] }
  | { status: 'fallback'; hints: string[] };

const FIRST_TURN_FIXED_HINTS = ['apples', 'juice', 'fruits'] as const;
const FIXED_HINTS_THATS_ALL = ['yes', 'all', 'yeah'] as const;
const FIXED_HINTS_PRICE = ['here', 'dollar', 'thank'] as const;

function shuffle3<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isThatsAllPhrase(phrase: string): boolean {
  const p = phrase.trim().toLowerCase();
  return p.includes('is that all') || p.includes("that's all") || p.includes('that is all');
}

function isPricePhrase(phrase: string): boolean {
  const p = phrase.trim().toLowerCase();
  return (
    p.includes('price') ||
    p.includes('cost') ||
    p.includes('total') ||
    p.includes('that will be') ||
    p.includes('dollar') ||
    p.includes('$')
  );
}

function getFallbackHints(cathyPhrase: string): string[] {
  const p = cathyPhrase.toLowerCase();
  if (p.includes('want') || p.includes('need')) return ['apples', 'milk', 'bread'];
  if (p.includes('anything') || p.includes('else')) return ['yes', 'no', 'more'];
  if (p.includes('how') && p.includes('much')) return ['here', 'cash', 'card'];
  return ['yes', 'no', 'please'];
}

async function fetchHints(payload: {
  cathyPhrase: string;
  conversationSummary: SummaryItem[];
  userTurnIndex: number;
}): Promise<string[]> {
  const res = await fetch('/api/realtalk8-hints', {
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
      osc.type = "sine";
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

type RealTalk8ScreenProps = {
  firstPhraseDone?: boolean;
  firstPhraseInProgress?: boolean;
  onComplete: (data: RealTalk4Data) => void;
};

type Phase = 'cathy' | 'user' | 'correction' | 'no-speech';

export function RealTalk8Screen({ firstPhraseDone = false, firstPhraseInProgress = false, onComplete }: RealTalk8ScreenProps) {
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
  /** no-speech 시 마이크에 맞출 재생 문장 (교정 턴이면 교정문, 아니면 점원 최근 발화) */
  const micPromptReplayRef = useRef('');
  const summaryRef = useRef<SummaryItem[]>([]);
  const errorLogRef = useRef<ErrorLogItem[]>([]);
  summaryRef.current = conversationSummary;
  errorLogRef.current = errorLog;

  const onResultRef = useRef<(t: string) => void>(() => {});
  const busyRef = useRef(false);
  const releaseBusy = useCallback(() => {
    busyRef.current = false;
  }, []);

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

      // 힌트 생성은 "AI 문장 확정 순간"에 시작 (단, 특정 턴/문구는 고정 힌트)
      if (nextUserTurnIndex === 0) {
        hintReqIdRef.current++;
        setHintState({ status: 'ready', hints: [...FIRST_TURN_FIXED_HINTS] });
      } else if (isThatsAllPhrase(phrase)) {
        hintReqIdRef.current++;
        setHintState({ status: 'ready', hints: shuffle3(FIXED_HINTS_THATS_ALL) });
      } else if (isPricePhrase(phrase)) {
        hintReqIdRef.current++;
        setHintState({ status: 'ready', hints: shuffle3(FIXED_HINTS_PRICE) });
      } else {
        generateHintsForPhrase(phrase, nextUserTurnIndex, summaryRef.current);
      }

      speakRealTalk4(phrase, () => {
        micPromptReplayRef.current = phrase;
        setShowMic(true);
        // 힌트 노출은 "AI TTS 종료 후 유저 턴 시작" 시점
        setShowHints(true);
        releaseBusy();
      });
    },
    [generateHintsForPhrase, releaseBusy]
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
        { speaker: 'Shopkeeper', textEn: result.cathyPhrase, textKo: result.cathyPhraseKo },
      ];
      setConversationSummary(newSummary);
      summaryRef.current = newSummary;

      if (result.isLastTurn) {
        setShowMic(false);
        setShowHints(false);
        speakRealTalk4(result.cathyPhrase, () => {
          setTimeout(() => {
            setShowStarPopup(true);
            playDingDong();
          }, STAR_POPUP_DELAY_MS);
          releaseBusy();
        });
        return;
      }

      const nextTurnIndex = userTurnIndex + 1;
      setUserTurnIndex(nextTurnIndex);
      setPhase('user');
      playCathyAndShowMic(result.cathyPhrase, result.cathyPhraseKo ?? '', false, nextTurnIndex);
    },
    [playCathyAndShowMic, releaseBusy, userTurnIndex]
  );

  const handleUserUtterance = useCallback(
    async (userText: string) => {
      if (busyRef.current) return;
      busyRef.current = true;

      const t = userText.trim();
      if (!t) {
        setShowMic(false);
        setShowHints(false);
        setShowTextAbove(true);
        setPhase('no-speech');
        stopSpeaking();
        const replay = micPromptReplayRef.current || cathyPhraseRef.current;
        speakRealTalk4(replay, () => {
          setShowMic(true);
          setShowHints(true);
          releaseBusy();
        });
        return;
      }

      setShowMic(false);
      setShowHints(false);
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
        // 교정 턴은 기존 UX 유지: 힌트 시스템은 관여하지 않음
        setPhase('correction');
        const directionPhrase = result.correction.type === 'naturalness'
          ? "So close! You can also say!"
          : "Nice try! Say it like this.";
        speakRealTalk4(directionPhrase, () => {
          setCorrectionText(result.correction!.sentence);
          setShowTextAbove(true);
          const corrSentence = result.correction!.sentence;
          speakRealTalk4(corrSentence, () => {
            micPromptReplayRef.current = corrSentence;
            setShowMic(true);
            setShowHints(false);
            releaseBusy();
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
        speakRealTalk4(result.cathyPhrase, () => {
          micPromptReplayRef.current = result.cathyPhrase;
          setShowMic(true);
          setShowHints(false);
          releaseBusy();
        });
        return;
      }

      handleUserAccepted(t, result);
    },
    [userTurnIndex, handleUserAccepted, releaseBusy]
  );

  useEffect(() => {
    onResultRef.current = handleUserUtterance;
  }, [handleUserUtterance]);

  useEffect(() => {
    if (phase === 'cathy' && userTurnIndex === 0) {
      const first = getCathyFirstPhrase();
      const init: SummaryItem[] = [{ speaker: 'Shopkeeper', textEn: first.en, textKo: first.ko }];
      setConversationSummary(init);
      summaryRef.current = init;
      setCurrentCathyPhrase(first.en);
      setCurrentCathyPhraseKo(first.ko);
      cathyPhraseRef.current = first.en;
      cathyPhraseKoRef.current = first.ko;
      micPromptReplayRef.current = first.en;
      setPhase('user');
      setShowMic(false);
      setShowHints(false);
      // 첫 유저 턴 힌트 고정
      hintReqIdRef.current++;
      setHintState({ status: 'ready', hints: [...FIRST_TURN_FIXED_HINTS] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstPhraseDone) {
      setShowMic(true);
      setShowHints(true);
      releaseBusy();
    }
  }, [firstPhraseDone, releaseBusy]);

  const onMicClick = useCallback(() => {
    if (!showMic) return;
    startSTT();
  }, [showMic, startSTT]);

  const onListenClick = useCallback(() => {
    const first = getCathyFirstPhrase();
    setShowMic(false);
    setShowHints(false);
    hintReqIdRef.current++;
    setHintState({ status: 'ready', hints: [...FIRST_TURN_FIXED_HINTS] });
    speakRealTalk4(first.en, () => {
      micPromptReplayRef.current = first.en;
      setShowMic(true);
      setShowHints(true);
      releaseBusy();
    });
  }, [releaseBusy]);

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
          <div className="topic-box topic-box--step3">{REALTALK8_TOPIC}</div>
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
          <ThinkingImage src={REALTALK8_IMAGE} className="realtalk-main-image" evaluating={isEvaluating} />
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

