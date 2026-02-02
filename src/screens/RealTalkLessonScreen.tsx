/**
 * Real Talk Lesson (Index 31)
 * LLM + STT로 Cathy(AI)와 대화하는 메신저 형태. 롤플레이와 다른 디자인.
 * Cathy: vicky.png / Me: student.png
 */

import { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';
import { isChatAvailable, sendChat, type ChatMessage } from '../llm';

const CATHY_NAME = 'Cathy';
const CATHY_AVATAR = '/vicky.png';
const ME_NAME = 'Me';
const ME_AVATAR = '/student.png';

const CATHY_FIRST_MESSAGE =
  "Hi! I'm Cathy. I don't think we've met. What's your name?";

const STUDENT_BUBBLE_DELAY_MS = 1000;
/** 턴1~5: 음성 재생 후 0.7초 뒤 학생 말풍선 / 턴6: 1초 뒤 별 팝업+효과음 */
const PAUSE_AFTER_AUDIO_MS = 700;
const PAUSE_AFTER_TURN6_MS = 1000;

/** 캐릭터 N턴 음원 재생 (real1~real6). 재생 종료 또는 실패 시 delayMs 후 onDone 호출 */
function playCharacterAudio(turn: number, onDone: () => void, delayMs: number = PAUSE_AFTER_AUDIO_MS): void {
  if (turn < 1 || turn > 6) {
    setTimeout(onDone, delayMs);
    return;
  }
  const audio = new Audio(`/real${turn}.mp3`);
  const schedule = () => setTimeout(onDone, delayMs);
  audio.onended = schedule;
  audio.onerror = schedule;
  audio.play().catch(schedule);
}

function playDingDong(): void {
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

const SYSTEM_PROMPT = `You are Cathy, a friendly English tutor. The student is practicing self-introduction. Keep your replies short (1-3 sentences). Use English only. Be warm and encouraging.`;

/** API 실패 시 fallback: Cathy가 이어갈 말 (턴 순서대로). 인덱스 31 대화 스크립트 */
const CATHY_SCRIPT: string[] = [
  "Oh, nice to meet you!",
  "Are you a student at this school?",
  "Oh, you don't want to talk? But I'd like to be friends with you... I'm a student at this school. How about you?",
  "Thanks for answering. How are you feeling today?",
  "I'm happy too, maybe because I met you! Let's be good friends!",
];

function getCathyReplyForTurn(turnIndex: number): string {
  return CATHY_SCRIPT[turnIndex] ?? "You're doing great! Tell me more.";
}

/** 자기소개/프리톡용 영어→한글 자체 번역 목록 (API 없음). 인덱스 31 스크립트 대사 포함 */
const LOCAL_EN_KO: [string, string][] = [
  ["Hi! I'm Cathy. I don't think we've met. What's your name?", "안녕! 난 캐시야. 처음 보는 것 같은데.. 네 이름은 뭐야?"],
  ["Oh, nice to meet you!", "오, 반가워."],
  ["Are you a student at this school?", "너는 여기 학교 학생이야?"],
  ["Oh, you don't want to talk? But I'd like to be friends with you... I'm a student at this school. How about you?", "오, 말하기 싫어? 하지만 난 너랑 친구하고 싶은데.. 난 여기 학교 학생이야. 너는?"],
  ["Thanks for answering. How are you feeling today?", "대답해 줘서 고마워. 오늘 기분은 어때?"],
  ["I'm happy too, maybe because I met you! Let's be good friends!", "나도 너랑 만나서 그런지 행복해! 우리 좋은 친구가 되자!"],
  ["It was nice talking to you! See you next time!", "이야기해 줘서 고마워! 다음에 또 보자!"],
  ["Hi! I'm Cathy.", "안녕! 나는 Cathy야."],
  ["What's your name?", "네 이름은 뭐야?"],
  ["My name is ...", "제 이름은 …이에요."],
  ["I'm [name].", "저는 [이름]이에요."],
  ["Nice to meet you!", "만나서 반가워요!"],
  ["Nice to meet you.", "만나서 반가워요."],
  ["Nice to meet you too!", "나도 만나서 반가워요!"],
  ["Nice to meet you, too!", "나도 만나서 반가워요!"],
  ["Same here!", "나도요!"],
  ["I'm glad to meet you.", "만나서 기뻐요."],
  ["I'm good, thanks!", "잘 지내요, 고마워요!"],
  ["I'm fine.", "잘 지내요."],
  ["I'm happy today.", "오늘 기분 좋아요."],
  ["I like ...", "저는 …을/를 좋아해요."],
  ["My hobby is ...", "제 취미는 …이에요."],
  ["I'm interested in ...", "저는 …에 관심이 있어요."],
  ["Sure!", "물론이에요!"],
  ["Of course.", "물론이에요."],
  ["Well, ...", "음, …"],
  ["I'm ...", "저는 …이에요."],
  ["That's great!", "그거 좋네요!"],
  ["That's wonderful!", "정말 좋네요!"],
  ["Tell me more!", "더 알려 줘!"],
  ["How are you?", "잘 지내요?"],
  ["What do you like?", "뭘 좋아해요?"],
  ["I didn't catch that. Try again!", "잘 못 들었어. 다시 말해 줄래?"],
  ["Let's go!", "가자!"],
  ["Sounds good!", "좋아!"],
];

function normalizeForMatch(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** 학생 4턴 정답: "a"가 student 앞에 있으면 통과 (I am a student / I'm a student) */
function isTurn4Correct(transcript: string): boolean {
  const t = normalizeForMatch(transcript);
  if (!t) return false;
  return /\b(i am|i'm)\s+a\s+student\b/.test(t) || /\ba\s+student\b/.test(t);
}

/** 자체 목록으로만 영어→한글 해석 (API 호출 없음). 긴 문장 우선 매칭 */
function getLocalTranslation(text: string): string {
  if (!text.trim()) return '';
  const normalized = normalizeForMatch(text);
  const sorted = [...LOCAL_EN_KO].sort((a, b) => b[0].length - a[0].length);
  for (const [en, ko] of sorted) {
    const enNorm = normalizeForMatch(en);
    if (normalized === enNorm || normalized.includes(enNorm) || enNorm.includes(normalized)) {
      return ko;
    }
  }
  return '';
}

/** 이전 캐릭터 대화(lastCathyText)에 맞춰 사용할 수 있는 간단한 표현 목록. 인덱스 31 스크립트 턴별 힌트 */
function getHintsForLastCathy(lastCathyText: string): string[] {
  const t = lastCathyText.toLowerCase();
  if (/\bwhat'?s your name|your name\b/.test(t)) {
    return ['I am', "I'm", 'my name is'];
  }
  if (/\bnice to meet you\b/i.test(t)) {
    return ['hi', 'nice to', 'happy to'];
  }
  if (/\bare you a student|student at this school\b/.test(t)) {
    return ['I am', "I'm", 'student'];
  }
  if (/\bdon'?t want to talk|how about you\b/.test(t)) {
    return ['I am', "I'm", 'student'];
  }
  if (/\bthanks for answering|how are you feeling|feeling today\b/.test(t)) {
    return ["I'm", 'excited', 'happy'];
  }
  return ['I am', "I'm", 'my name is'];
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="realtalk-lesson-heart-svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/** 세션 구조: AI 6턴 + 학생 5턴 = 11턴 (AI → Student → … → AI) */
const STUDENT_TURNS_MAX = 5;
const AI_TURNS_MAX = 6;
const TOTAL_TURNS = 11;

type RealTalkLessonScreenProps = {
  onNext?: () => void;
};

type BubbleMessage = { role: 'assistant' | 'user'; content: string };

export function RealTalkLessonScreen({ onNext }: RealTalkLessonScreenProps) {
  const [messages, setMessages] = useState<BubbleMessage[]>([
    { role: 'assistant', content: CATHY_FIRST_MESSAGE },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [chatAvailable, setChatAvailable] = useState(false);
  const [showStudentTurnBubble, setShowStudentTurnBubble] = useState(false);
  const [hasStudentBubbleEverShown, setHasStudentBubbleEverShown] = useState(false);
  const [showKoByIndex, setShowKoByIndex] = useState<Record<number, boolean>>({});
  const [koCache, setKoCache] = useState<Record<number, string>>({});
  const [feedbackTurn2Expanded, setFeedbackTurn2Expanded] = useState(true);
  const [feedbackTurn4Expanded, setFeedbackTurn4Expanded] = useState(true);
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showGoodStamp, setShowGoodStamp] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  const studentBubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const characterAudioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turn1AudioStartedRef = useRef(false);

  const handleGlobeClick = useCallback((index: number, content: string) => {
    const cached = koCache[index];
    if (cached !== undefined) {
      setShowKoByIndex((prev) => ({ ...prev, [index]: !prev[index] }));
      return;
    }
    const ko = getLocalTranslation(content);
    const toShow = ko || '해석 없음 (자체 목록에 없음)';
    setKoCache((prev) => ({ ...prev, [index]: toShow }));
    setShowKoByIndex((prev) => ({ ...prev, [index]: true }));
  }, [koCache]);

  /** 음성 재생 종료 후 0.7초 뒤 학생 말풍선·마이크 표시 */
  const showStudentBubbleAfterAudio = useCallback(() => {
    if (studentBubbleTimeoutRef.current) clearTimeout(studentBubbleTimeoutRef.current);
    studentBubbleTimeoutRef.current = setTimeout(() => {
      studentBubbleTimeoutRef.current = null;
      setShowStudentTurnBubble(true);
      setHasStudentBubbleEverShown(true);
    }, PAUSE_AFTER_AUDIO_MS);
  }, []);

  /** 캐릭터 6턴 음성 종료 후 1초 뒤 별 팝업 + 효과음 */
  const showCompletePopupAfterTurn6 = useCallback(() => {
    setShowCompletePopup(true);
    playDingDong();
  }, []);

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const isStudentTurn = messages.length % 2 === 1; // 1 msg → next student, 2 → next AI, …
  const canSpeak = isStudentTurn && userMessageCount < STUDENT_TURNS_MAX && !isSending;
  const sessionComplete = messages.length === TOTAL_TURNS;

  const handleUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;
      if (userMessageCount >= STUDENT_TURNS_MAX) return;

      const userMsg: BubbleMessage = { role: 'user', content: trimmed };
      setShowStudentTurnBubble(false);
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      /* 캐릭터 턴: 1턴=초기, 2~6턴=userMessageCount+2. 턴6은 1초 후 별 팝업+효과음 */
      const cathyTurn = userMessageCount + 2;

      /* 학생 4턴 오답: Cathy 5로 진행 (피드백은 느낌표 버튼으로 토글) */
      if (userMessageCount === 3 && !isTurn4Correct(trimmed)) {
        const cathyReply = getCathyReplyForTurn(3);
        setMessages((prev) => [...prev, { role: 'assistant', content: cathyReply }]);
        playCharacterAudio(5, showStudentBubbleAfterAudio);
        setIsSending(false);
        return;
      }

      try {
        if (!chatAvailable) {
          const cathyReply = getCathyReplyForTurn(userMessageCount);
          setMessages((prev) => [...prev, { role: 'assistant', content: cathyReply }]);
          if (cathyTurn === 6) {
            playCharacterAudio(6, showCompletePopupAfterTurn6, PAUSE_AFTER_TURN6_MS);
          } else {
            playCharacterAudio(cathyTurn, showStudentBubbleAfterAudio);
          }
          return;
        }
        const chatHistory: ChatMessage[] = [
          { role: 'assistant', content: CATHY_FIRST_MESSAGE },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: trimmed },
        ];
        const reply = await sendChat({ messages: chatHistory, system: SYSTEM_PROMPT });
        const cathyReply = reply?.trim() || getCathyReplyForTurn(userMessageCount);
        setMessages((prev) => [...prev, { role: 'assistant', content: cathyReply }]);
        if (cathyTurn === 6) {
          playCharacterAudio(6, showCompletePopupAfterTurn6, PAUSE_AFTER_TURN6_MS);
        } else {
          playCharacterAudio(cathyTurn, showStudentBubbleAfterAudio);
        }
      } catch (e) {
        const cathyReply = getCathyReplyForTurn(userMessageCount);
        setMessages((prev) => [...prev, { role: 'assistant', content: cathyReply }]);
        if (cathyTurn === 6) {
          playCharacterAudio(6, showCompletePopupAfterTurn6, PAUSE_AFTER_TURN6_MS);
        } else {
          playCharacterAudio(cathyTurn, showStudentBubbleAfterAudio);
        }
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, chatAvailable, userMessageCount, showStudentBubbleAfterAudio, showCompletePopupAfterTurn6]
  );

  const { start: toggleMic, isListening, useWhisper, webSpeechUnavailable } = useSTT(handleUserMessage);
  const sttUnavailable = !useWhisper && webSpeechUnavailable;

  useEffect(() => {
    isChatAvailable().then(setChatAvailable);
  }, []);

  /* 캐릭터 1턴: real1 1회만 재생 (Strict Mode 이중 실행 방지) → 종료 후 0.7초 뒤 학생 말풍선·마이크 표시 */
  useEffect(() => {
    if (turn1AudioStartedRef.current) return;
    turn1AudioStartedRef.current = true;

    const audio = new Audio('/real1.mp3');
    const schedule = () => {
      characterAudioTimeoutRef.current = setTimeout(() => {
        characterAudioTimeoutRef.current = null;
        setShowStudentTurnBubble(true);
        setHasStudentBubbleEverShown(true);
      }, PAUSE_AFTER_AUDIO_MS);
    };
    audio.onended = schedule;
    audio.onerror = schedule;
    audio.play().catch(schedule);
    return () => {
      if (characterAudioTimeoutRef.current) clearTimeout(characterAudioTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const scrollToEnd = () => listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    scrollToEnd();
    if (showStudentTurnBubble) {
      const id = setTimeout(scrollToEnd, 150);
      return () => clearTimeout(id);
    }
  }, [messages, feedbackTurn2Expanded, feedbackTurn4Expanded, showStudentTurnBubble]);

  /* 별 팝업 1초 후 숨기고 GOOD 도장 표시 + fb2.mp3 */
  useEffect(() => {
    if (!showCompletePopup) return;
    const t = setTimeout(() => {
      setShowCompletePopup(false);
      setShowGoodStamp(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [showCompletePopup]);

  /* GOOD 도장 표시 시 fb2.mp3 재생 (스텝3 청보라 도장) */
  useEffect(() => {
    if (!showGoodStamp) return;
    try {
      const audio = new Audio('/fb2.mp3');
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, [showGoodStamp]);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-realtalk-mode={chatAvailable ? 'gemini' : 'scripted'}>
      <div className="realtalk-lesson">
        <div className="realtalk-lesson-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
          <div className="realtalk-lesson-energy" aria-label="스피킹 에너지">
            {Array.from({ length: STUDENT_TURNS_MAX }, (_, i) => (
              <span
                key={i}
                className={`realtalk-lesson-heart ${i < userMessageCount ? 'realtalk-lesson-heart--used' : ''}`}
                aria-hidden
              >
                <HeartIcon />
              </span>
            ))}
          </div>
        </div>
        <div className="realtalk-lesson-chat" role="log" aria-label="대화">
          {messages.map((msg, i) => (
            <Fragment key={i}>
              <div
                className={
                  msg.role === 'assistant'
                    ? 'realtalk-lesson-row realtalk-lesson-row--cathy'
                    : 'realtalk-lesson-row realtalk-lesson-row--me'
                }
              >
                <div className="realtalk-lesson-row-inner">
                  {msg.role === 'assistant' && (
                    <img
                      src={CATHY_AVATAR}
                      alt=""
                      className="realtalk-lesson-avatar"
                      aria-hidden
                    />
                  )}
                  {msg.role === 'user' && (
                    <img
                      src={ME_AVATAR}
                      alt=""
                      className="realtalk-lesson-avatar"
                      aria-hidden
                    />
                  )}
                  <div className="realtalk-lesson-bubble-wrap">
                    <span className="realtalk-lesson-name">
                      {msg.role === 'assistant' ? CATHY_NAME : ME_NAME}
                    </span>
                    <div
                      className={
                        msg.role === 'assistant'
                          ? 'realtalk-lesson-bubble realtalk-lesson-bubble--cathy'
                          : 'realtalk-lesson-bubble realtalk-lesson-bubble--me'
                      }
                    >
                      {showKoByIndex[i] && koCache[i] !== undefined ? koCache[i] : msg.content}
                    </div>
                  </div>
                </div>
                <div className="realtalk-lesson-k-btn-row">
                  {msg.role === 'user' && messages.slice(0, i + 1).filter((m) => m.role === 'user').length === 2 && (
                    <button
                      type="button"
                      className={`realtalk-lesson-feedback-toggle ${feedbackTurn2Expanded ? 'realtalk-lesson-feedback-toggle--expanded' : ''}`}
                      onClick={() => setFeedbackTurn2Expanded((prev) => !prev)}
                      aria-label={feedbackTurn2Expanded ? '피드백 접기' : '피드백 보기'}
                      aria-expanded={feedbackTurn2Expanded}
                    >
                      !
                    </button>
                  )}
                  {msg.role === 'user' && messages.slice(0, i + 1).filter((m) => m.role === 'user').length === 4 && (
                    <button
                      type="button"
                      className={`realtalk-lesson-feedback-toggle ${feedbackTurn4Expanded ? 'realtalk-lesson-feedback-toggle--expanded' : ''}`}
                      onClick={() => setFeedbackTurn4Expanded((prev) => !prev)}
                      aria-label={feedbackTurn4Expanded ? '피드백 접기' : '피드백 보기'}
                      aria-expanded={feedbackTurn4Expanded}
                    >
                      !
                    </button>
                  )}
                  <button
                    type="button"
                    className="realtalk-lesson-k-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGlobeClick(i, msg.content);
                    }}
                    aria-label="한글 해석 보기"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <ellipse cx="12" cy="12" rx="10" ry="3" />
                      <ellipse cx="12" cy="12" rx="3" ry="10" />
                    </svg>
                  </button>
                </div>
              </div>
              {msg.role === 'user' && messages.slice(0, i + 1).filter((m) => m.role === 'user').length === 2 && feedbackTurn2Expanded && (
                <div className="realtalk-lesson-feedback" role="status" aria-label="2턴 피드백">
                  <p className="realtalk-lesson-feedback-head">Selena&apos;s Tip</p>
                  <p className="realtalk-lesson-feedback-note">
                    Good to see you. 는 알고 있는 사람을 다시 만났을 때 쓰는 표현이에요. 처음 만난 사람에게는 Nice to meet you. 를 써야 자연스러워요.
                  </p>
                </div>
              )}
              {msg.role === 'user' && messages.slice(0, i + 1).filter((m) => m.role === 'user').length === 4 && feedbackTurn4Expanded && (
                <div className="realtalk-lesson-feedback" role="status" aria-label="4턴 피드백">
                  <p className="realtalk-lesson-feedback-head">Selena&apos;s Tip</p>
                  <p className="realtalk-lesson-feedback-example">
                    <span className="realtalk-lesson-feedback-gray">I am</span>{' '}
                    <span className="realtalk-lesson-feedback-highlight">a</span>{' '}
                    <span className="realtalk-lesson-feedback-gray">student</span>.
                  </p>
                  <p className="realtalk-lesson-feedback-note">student 앞에는 a를 붙여야 해요.</p>
                </div>
              )}
            </Fragment>
          ))}
          {isSending && (
            <div className="realtalk-lesson-row realtalk-lesson-row--cathy">
              <div className="realtalk-lesson-row-inner">
                <img
                  src={CATHY_AVATAR}
                  alt=""
                  className="realtalk-lesson-avatar"
                  aria-hidden
                />
                <div className="realtalk-lesson-bubble-wrap">
                  <span className="realtalk-lesson-name">{CATHY_NAME}</span>
                  <div className="realtalk-lesson-bubble realtalk-lesson-bubble--cathy realtalk-lesson-bubble--typing">
                    ...
                  </div>
                </div>
              </div>
            </div>
          )}
          {isStudentTurn && showStudentTurnBubble && !isSending && !sessionComplete && (() => {
            const lastCathy = [...messages].reverse().find((m) => m.role === 'assistant');
            const hints = getHintsForLastCathy(lastCathy?.content ?? CATHY_FIRST_MESSAGE);
            return (
              <div className="realtalk-lesson-row realtalk-lesson-row--me realtalk-lesson-row--me-with-hints">
                <div className="realtalk-lesson-me-bubble-row">
                  <div className="realtalk-lesson-row-inner">
                    <img
                      src={ME_AVATAR}
                      alt=""
                      className="realtalk-lesson-avatar"
                      aria-hidden
                    />
                    <div className="realtalk-lesson-bubble-wrap">
                      <span className="realtalk-lesson-name">{ME_NAME}</span>
                      <div className="realtalk-lesson-bubble realtalk-lesson-bubble--me realtalk-lesson-bubble--hint">
                        {isListening ? '...' : '\u00A0'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="realtalk-lesson-hints" aria-label="말하기 힌트">
                  <span className="realtalk-lesson-hints-label">You can say:</span>
                  <ul className="realtalk-lesson-hints-list">
                    {hints.map((phrase, i) => (
                      <li key={i} className="realtalk-lesson-hints-item">{phrase}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
          <div ref={listEndRef} />
        </div>
        {hasStudentBubbleEverShown && !sessionComplete && (
        <div className="realtalk-lesson-bottom">
          {sttUnavailable && (
            <p className="realtalk-lesson-stt-hint" role="status">
              음성 인식을 사용하려면 .env에 GEMINI_API_KEY를 설정하고 개발 서버를 재시작해 주세요.
            </p>
          )}
          <button
            type="button"
            className={`realtalk-lesson-mic ${isListening ? 'realtalk-lesson-mic--on' : ''}`}
            onClick={toggleMic}
            disabled={!canSpeak}
            aria-label={isListening ? '녹음 중지' : sessionComplete ? '세션 완료' : '말하기'}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>
        )}
      </div>

      {showCompletePopup && (
        <div className="checkmark-popup roleplay-complete-popup" role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}

      {showGoodStamp && (
        <div
          className="screen7-stamp-popup screen7-stamp-popup--overlay roleplay-good-stamp-overlay"
          role="button"
          tabIndex={0}
          aria-label="다음으로"
          onClick={(e) => { e.stopPropagation(); setShowGoodStamp(false); onNext?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowGoodStamp(false); onNext?.(); } }}
        >
          <div className="screen7-stamp-circle roleplay-good-stamp-circle">
            <svg className="screen7-stamp-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="realtalk-stamp-star" d="M0 -2.1 L0.5 -0.5 L2.2 -0.5 L0.8 0.5 L1.3 2.1 L0 1.1 L-1.3 2.1 L-0.8 0.5 L-2.2 -0.5 L-0.5 -0.5 Z" fill="#fff" />
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="3" />
              <use href="#realtalk-stamp-star" transform="translate(98, 38) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(82, 22) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(60, 16) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(38, 22) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(22, 38) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(22, 82) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(38, 98) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(60, 104) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(82, 98) scale(2)" />
              <use href="#realtalk-stamp-star" transform="translate(98, 82) scale(2)" />
              <text x="60" y="62" textAnchor="middle" dominantBaseline="central" className="screen7-stamp-text" fill="#fff">GOOD!</text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
