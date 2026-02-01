/**
 * Role Play Screen (Index 26, 27, …)
 * 캐릭터 말풍선 → 학생 말풍선 + 보기 3개 + 마이크 → (정답 시) 캐릭터 마무리 → 다음 화면
 * 캐릭터 대사(Turn 1, Turn 3)는 TTS로 재생 (ElevenLabs / VoiceRSS / 브라우저).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOPIC_TEXT } from '../App';
import { isWhisperAvailable, createWhisperRecorder, transcribeWithWhisper } from '../stt';
import { speakTTS, type TTSOptions, type VoiceStyle } from '../tts';

const STUDENT_NAME = 'Me';

export type RolePlayScript = {
  situationLabel: string;
  situationLines: string[];
  characterName: string;
  turn1Text: string;
  choices: string[];
  turn3Text: string;
  /** 발화 키워드별 턴3 대사 (값이 배열이면 그중 하나 랜덤 선택, 없으면 turn3Text) */
  turn3ByKeyword?: Record<string, string | string[]>;
  /** 한글 해석 (K 버튼용). 인덱스 26 등에서만 사용 */
  turn1TextKo?: string;
  choicesKo?: string[];
  turn3TextKo?: string;
  turn3ByKeywordKo?: Record<string, string | string[]>;
  /** 정답 인정: matchKeywords 중 하나 포함 시 정답. matchRequiresIAmAndKeyword 시 'I am'/'I'm' + 키워드 둘 다 있어야 함 */
  matchKeywords: string[];
  /** true면 (said에 'i am' / 'i m' / 'i feel' 중 하나) && (matchKeywords 중 하나) 일 때만 정답 */
  matchRequiresIAmAndKeyword?: boolean;
  ttsVoice: VoiceStyle;
  studentHint: string;
  feedbackPrefix: string;
};

const ROLEPLAY_SCRIPTS: RolePlayScript[] = [
  {
    situationLabel: 'Situation 1',
    situationLines: ['처음 보는 사람에게 자기 소개를 하는 상황이야.', '내 이름을 말해 볼까?'],
    characterName: 'Lisa',
    turn1Text: "Hello. What's your name?",
    choices: ['I am Kate.', "I'm Peter.", 'My name is Olivia.'],
    turn3Text: 'My name is Lisa. Happy to meet you!',
    turn3ByKeyword: {
      'i am': 'My name is Lisa. Happy to meet you!',
      'i m': 'My name is Lisa. Nice to meet you!',
      'my name is': 'My name is Lisa. Great to meet you!',
    },
    matchKeywords: ['i am', 'my name is', 'i m'],
    turn1TextKo: '안녕. 이름이 뭐야?',
    choicesKo: ['나는 Kate예요.', '나는 Peter예요.', '나는 Olivia예요.'],
    turn3TextKo: '나는 Lisa예요. 만나서 반가워!',
    turn3ByKeywordKo: {
      'i am': '나는 Lisa예요. 만나서 반가워!',
      'i m': '나는 Lisa예요. 만나서 반가워!',
      'my name is': '나는 Lisa예요. 만나서 반가워!',
    },
    ttsVoice: 'girl',
    studentHint: '나는(내 이름은) ~예요.',
    feedbackPrefix: "Ah, I understand! But how about saying it like this?",
  },
  {
    situationLabel: 'Situation 2',
    situationLines: ['누군가를 처음 만나는 상황이야.', '만나서 반갑다고 인사를 해 보자.'],
    characterName: 'Kevin',
    turn1Text: 'Hi! My name is Kevin.',
    choices: ['Nice to meet you.', 'Happy to meet you.', 'Glad to meet you.'],
    turn3Text: "Nice to meet you, too! Let's play together!",
    turn3ByKeyword: {
      'nice to meet you': [
        "Nice to meet you, too! Let's play together!",
        "Nice to meet you, too! Let's be friends!",
        "Nice to meet you, too! Let's have fun!",
        "Nice to meet you, too! Let's talk more!",
      ],
      'happy to meet you': [
        "Happy to meet you, too! Let's play together!",
        "Happy to meet you, too! Let's be friends!",
        "Happy to meet you, too! Let's have fun!",
        "Happy to meet you, too! Let's talk more!",
      ],
      'glad to meet you': [
        "Glad to meet you, too! Let's play together!",
        "Glad to meet you, too! Let's be friends!",
        "Glad to meet you, too! Let's have fun!",
        "Glad to meet you, too! Let's talk more!",
      ],
    },
    matchKeywords: ['nice to meet you', 'happy to meet you', 'glad to meet you'],
    turn1TextKo: '안녕! 나는 Kevin이야.',
    choicesKo: ['만나서 반가워.', '만나서 반가워.', '만나서 반가워.'],
    turn3TextKo: '나도 만나서 반가워! 같이 놀자!',
    turn3ByKeywordKo: {
      'nice to meet you': '나도 만나서 반가워! 같이 놀자!',
      'happy to meet you': '나도 만나서 반가워! 같이 놀자!',
      'glad to meet you': '나도 만나서 반가워! 같이 놀자!',
    },
    ttsVoice: 'boy',
    studentHint: '만나서 반가워요.',
    feedbackPrefix: "Ah, I understand! But how about saying it like this?",
  },
  {
    situationLabel: 'Situation 3',
    situationLines: ['오늘 내 기분은 어떤지 친구가 물어보고 있어.', '친구에게 나의 감정을 말해 보자.'],
    characterName: 'Vicky',
    turn1Text: 'How are you today?',
    choices: ['I am happy.', 'I am sad.', 'I am excited.'],
    turn3Text: 'I see. Thank you for telling me!',
    turn3ByKeyword: {
      happy: "That's great! I'm glad to hear that!",
      excited: "That's great! I'm glad to hear that!",
      good: "That's great! I'm glad to hear that!",
      great: "That's great! I'm glad to hear that!",
      fine: "That's great! I'm glad to hear that!",
      okay: "That's great! I'm glad to hear that!",
      calm: "That's great! I'm glad to hear that!",
      sad: "I'm sorry to hear that. I hope you feel better soon.",
      bad: "I'm sorry to hear that. I hope you feel better soon.",
      sick: "I'm sorry to hear that. I hope you feel better soon.",
      worried: "I'm sorry to hear that. I hope you feel better soon.",
      scared: "I'm sorry to hear that. I hope you feel better soon.",
      nervous: "I'm sorry to hear that. I hope you feel better soon.",
      tired: 'I see. Get some rest if you need it!',
      sleepy: 'I see. Get some rest if you need it!',
      bored: 'I see. Get some rest if you need it!',
      hungry: "Let's get something to eat!",
      angry: 'I see. I hope you feel better soon.',
    },
    matchKeywords: ['happy', 'sad', 'excited', 'angry', 'tired', 'good', 'great', 'fine', 'okay', 'bad', 'sick', 'nervous', 'bored', 'scared', 'worried', 'calm', 'sleepy', 'hungry'],
    matchRequiresIAmAndKeyword: true,
    turn1TextKo: '오늘 어때?',
    choicesKo: ['나는 행복해요.', '나는 슬퍼요.', '나는 신나요.'],
    turn3TextKo: '그렇구나. 말해줘서 고마워!',
    turn3ByKeywordKo: {
      happy: '기쁘다! 잘 들었어!',
      excited: '기쁘다! 잘 들었어!',
      good: '기쁘다! 잘 들었어!',
      great: '기쁘다! 잘 들었어!',
      fine: '기쁘다! 잘 들었어!',
      okay: '기쁘다! 잘 들었어!',
      calm: '기쁘다! 잘 들었어!',
      sad: '유감이야. 빨리 나아지길 바랄게.',
      bad: '유감이야. 빨리 나아지길 바랄게.',
      sick: '유감이야. 빨리 나아지길 바랄게.',
      worried: '유감이야. 빨리 나아지길 바랄게.',
      scared: '유감이야. 빨리 나아지길 바랄게.',
      nervous: '유감이야. 빨리 나아지길 바랄게.',
      tired: '그렇구나. 푹 쉬어.',
      sleepy: '그렇구나. 푹 쉬어.',
      bored: '그렇구나. 푹 쉬어.',
      hungry: '그럼 뭐 먹자!',
      angry: '그렇구나. 빨리 나아지길 바랄게.',
    },
    ttsVoice: 'girl',
    studentHint: '나는 (기분이나 상태가) ~해요.',
    feedbackPrefix: "Ah, I understand! But how about saying it like this?",
  },
];

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

function normalizeForCompare(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?\-']/g, ' ')  // 구두점·하이픈·어포스트로피 → 공백
    .replace(/\s+/g, ' ')
    .trim();
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 스크립트에 turn3ByKeyword가 있으면 학생 발화에서 매칭된 키워드의 대사 반환(값이 배열이면 랜덤), 없으면 turn3Text */
function getTurn3Text(script: RolePlayScript, studentTranscript: string): string {
  if (!script.turn3ByKeyword || !studentTranscript.trim()) return script.turn3Text;
  const said = normalizeForCompare(studentTranscript);
  for (const kw of script.matchKeywords) {
    const val = script.turn3ByKeyword[kw];
    if (said.includes(normalizeForCompare(kw)) && val != null) {
      return Array.isArray(val) ? pickRandom(val) : val;
    }
  }
  return script.turn3Text;
}

/** 턴3 한글 해석 (turn3ByKeywordKo 있으면 매칭된 키워드 대사, 값이 배열이면 랜덤) */
function getTurn3TextKo(script: RolePlayScript, studentTranscript: string): string {
  if (!script.turn3ByKeywordKo || !script.turn3TextKo) return script.turn3TextKo ?? '';
  if (!studentTranscript.trim()) return script.turn3TextKo;
  const said = normalizeForCompare(studentTranscript);
  for (const kw of script.matchKeywords) {
    const val = script.turn3ByKeywordKo[kw];
    if (said.includes(normalizeForCompare(kw)) && val != null) {
      return Array.isArray(val) ? pickRandom(val) : val;
    }
  }
  return script.turn3TextKo;
}

/** 학생 말풍선 한글 해석: transcript가 choices 중 하나와 매칭되면 choicesKo 해당 항목, 없으면 기본 문구 */
function getStudentBubbleKo(script: RolePlayScript, studentTranscript: string): string {
  if (!script.choicesKo || script.choicesKo.length === 0) return '';
  const said = normalizeForCompare(studentTranscript);
  for (let i = 0; i < script.choices.length; i++) {
    if (said.includes(normalizeForCompare(script.choices[i]))) return script.choicesKo[i] ?? '';
  }
  return '영어로 말했어요.';
}

/**
 * STT 표시용: 문장 첫 글자 대문자, 기존 . ! ? 뒤 글자 대문자, 끝에 구두점 없으면 마침표 추가.
 * (문장 중간에 새로 마침표를 넣는 건 문맥 판단이 필요해 규칙만으로는 어렵고, 구두점 복원 API/모델 연동 시 확장 가능)
 */
function formatTranscriptForDisplay(text: string): string {
  let s = (text || '').trim();
  if (!s) return s;
  s = s.charAt(0).toUpperCase() + s.slice(1);
  s = s.replace(/([.!?])\s+([a-z])/g, (_, punct, letter) => `${punct} ${letter.toUpperCase()}`);
  if (!/[.!?]$/.test(s)) s += '.';
  return s;
}

/** TTS 2번 재생 방지 (스크립트별 플래그) */
const turn1TTSPlayedByScript: Record<number, boolean> = {};
const turn3TTSPlayedByScript: Record<number, boolean> = {};

export function RolePlayScreen({ scriptIndex = 0, onNext }: { scriptIndex?: number; onNext: () => void }) {
  const script = ROLEPLAY_SCRIPTS[scriptIndex] ?? ROLEPLAY_SCRIPTS[0];
  const [showTurn1Bubble, setShowTurn1Bubble] = useState(false);
  const [turn, setTurn] = useState<1 | 2 | 3>(1);
  const [turn1Done, setTurn1Done] = useState(false);
  const [studentTranscript, setStudentTranscript] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [resolvedTurn3Text, setResolvedTurn3Text] = useState(''); // 턴3 진입 시 한 번만 결정(배열일 때 랜덤), 화면·TTS 공통
  const [resolvedTurn3TextKo, setResolvedTurn3TextKo] = useState(''); // 턴3 한글 해석 (K 버튼용)
  const [showTurn1Ko, setShowTurn1Ko] = useState(false);
  const [showStudentKo, setShowStudentKo] = useState(false);
  const [showTurn3Ko, setShowTurn3Ko] = useState(false);
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showGoodStamp, setShowGoodStamp] = useState(false); // 인덱스 28 전용: 별 후 GOOD 도장 → 클릭 시 다음
  const processedRef = useRef(false);
  const lastTranscriptRef = useRef('');
  const whisperRecorderRef = useRef<ReturnType<typeof createWhisperRecorder> | null>(null);
  const [useWhisper, setUseWhisper] = useState(false);

  useEffect(() => {
    isWhisperAvailable().then(setUseWhisper);
  }, []);

  /* 턴3 진입 시 대사 한 번 결정 (turn3ByKeyword 배열이면 랜덤, 화면·TTS 동일하게 사용) + 한글 해석 */
  useEffect(() => {
    if (turn === 3) {
      setResolvedTurn3Text(getTurn3Text(script, studentTranscript));
      setResolvedTurn3TextKo(script.turn3TextKo ? getTurn3TextKo(script, studentTranscript) : '');
    } else {
      setResolvedTurn3Text('');
      setResolvedTurn3TextKo('');
    }
  }, [turn, script, studentTranscript]);

  /* 상황 블록 표시 후 1초 뒤 캐릭터 1턴 말풍선 표시 */
  useEffect(() => {
    const t = setTimeout(() => setShowTurn1Bubble(true), 1000);
    return () => clearTimeout(t);
  }, []);

  /* 화면 벗어날 때만 플래그 초기화. 지연해서 Strict Mode 재마운트 시에는 플래그가 유지되도록 */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    return () => {
      t = setTimeout(() => {
        delete turn1TTSPlayedByScript[scriptIndex];
        delete turn3TTSPlayedByScript[scriptIndex];
      }, 300);
    };
  }, [scriptIndex]);

  const goToTurn3 = useCallback(() => {
    setTurn(3);
    setShowFeedback(false);
    /* studentTranscript 유지 – 학생 말풍선이 사라지지 않도록 */
  }, []);

  /** 스크립트에 따라 정답 판별 (matchRequiresIAmAndKeyword 시 'I am'/'I'm'/'I feel' + 감정·상태 키워드) */
  const checkMatch = useCallback(
    (transcript: string): boolean => {
      const said = normalizeForCompare(transcript);
      const hasKeyword = script.matchKeywords.some((kw) => said.includes(normalizeForCompare(kw)));
      if (script.matchRequiresIAmAndKeyword) {
        const hasStarter = said.includes('i am') || said.includes('i m') || said.includes('i feel');
        return hasStarter && hasKeyword;
      }
      return hasKeyword;
    },
    [script.matchKeywords, script.matchRequiresIAmAndKeyword]
  );

  const handleStudentResult = useCallback((transcript: string) => {
    if (processedRef.current) return;
    processedRef.current = true;
    setStudentTranscript(formatTranscriptForDisplay(transcript));
    if (checkMatch(transcript)) {
      setTimeout(() => goToTurn3(), 700); // 학생 발화 마무리 후 0.7초 뒤 Turn 3 말풍선
    } else {
      setShowFeedback(true);
      setFeedbackSuggestion(pickRandom(script.choices));
      setRetryCount(r => r + 1);
    }
  }, [checkMatch, goToTurn3, script.choices]);

  const handleRetryOrContinue = useCallback(() => {
    if (retryCount >= 2) {
      setTimeout(() => goToTurn3(), 700); // 마찬가지로 0.7초 뒤 Turn 3
      return;
    }
    setShowFeedback(false);
    processedRef.current = false;
    setIsListening(false);
    /* studentTranscript 유지 – 말풍선 텍스트가 사라지지 않게, 다음 STT 결과로 덮어쓸 때만 갱신 */
  }, [retryCount, goToTurn3]);

  /* Turn 1: 말풍선 뜬 뒤에만 TTS 재생 → 재생 끝난 뒤 1초 후 학생 영역 표시 */
  useEffect(() => {
    if (turn !== 1 || !showTurn1Bubble) return;
    if (turn1TTSPlayedByScript[scriptIndex]) return;
    turn1TTSPlayedByScript[scriptIndex] = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const ttsVoice: TTSOptions = { voice: script.ttsVoice };
    speakTTS(script.turn1Text, () => {
      timeoutId = setTimeout(() => {
        setTurn1Done(true);
        setTurn(2);
      }, 1000);
    }, ttsVoice);
    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [turn, showTurn1Bubble, scriptIndex, script.turn1Text, script.ttsVoice]);

  /* Turn 3: 캐릭터 마무리 TTS 1회만 재생 → 체크 마크 + 딩동 → 다음 화면 */
  useEffect(() => {
    if (turn !== 3 || !resolvedTurn3Text) return;
    if (turn3TTSPlayedByScript[scriptIndex]) return;
    turn3TTSPlayedByScript[scriptIndex] = true;
    let done = false;
    const goNext = () => {
      if (done) return;
      done = true;
      setShowCompletePopup(true);
      playDingDong();
    };
    speakTTS(resolvedTurn3Text, goNext, { voice: script.ttsVoice });
    const fallback = setTimeout(goNext, 8000); // TTS 실패 시 8초 후 자동 진행
    return () => clearTimeout(fallback);
  }, [turn, resolvedTurn3Text, scriptIndex, script.ttsVoice]);

  /* 별 팝업 1.2초 후: 인덱스 28이면 GOOD 도장으로, 아니면 다음 화면으로 */
  useEffect(() => {
    if (!showCompletePopup) return;
    const t = setTimeout(() => {
      setShowCompletePopup(false);
      if (scriptIndex === 2) {
        setShowGoodStamp(true);
      } else {
        onNext();
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [showCompletePopup, onNext, scriptIndex]);

  /* 인덱스 28: GOOD 도장 표시 시 fb3.mp3 재생 */
  useEffect(() => {
    if (!showGoodStamp || scriptIndex !== 2) return;
    try {
      const audio = new Audio('/fb3.mp3');
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, [showGoodStamp, scriptIndex]);

  const startRecognition = useCallback(() => {
    if (useWhisper) {
      if (!isListening) {
        processedRef.current = false;
        lastTranscriptRef.current = '';
        whisperRecorderRef.current = createWhisperRecorder();
        whisperRecorderRef.current.start().then(() => setIsListening(true)).catch(() => setIsListening(false));
      } else {
        const rec = whisperRecorderRef.current;
        whisperRecorderRef.current = null;
        setIsListening(false);
        if (!rec) return;
        rec.stop().then(async (blob) => {
          if (!blob) return;
          try {
            const text = await transcribeWithWhisper(blob);
            handleStudentResult(text || '');
          } catch {
            handleStudentResult('');
          }
        });
      }
      return;
    }
    const win = window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      setIsListening(false);
      return;
    }
    processedRef.current = false;
    lastTranscriptRef.current = '';
    const rec = new SR();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      if (!results || results.length === 0) return;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const alt = r.length ? (r[0] ?? (r as unknown as { item(i: number): SpeechRecognitionAlternative }).item(0)) : null;
        const transcript = alt != null ? String((alt as SpeechRecognitionAlternative & { transcript?: string }).transcript ?? '').trim() : '';
        if (transcript) {
          lastTranscriptRef.current = transcript;
          setStudentTranscript(formatTranscriptForDisplay(transcript));
          if (r.isFinal && !processedRef.current) {
            processedRef.current = true;
            if (checkMatch(transcript)) {
              setTimeout(() => goToTurn3(), 700);
            } else {
              setShowFeedback(true);
              setFeedbackSuggestion(pickRandom(script.choices));
              setRetryCount(c => c + 1);
            }
          }
        }
      }
    };
    rec.onend = () => {
      setIsListening(false);
      if (!processedRef.current) handleStudentResult(lastTranscriptRef.current);
    };
    rec.onerror = () => {
      setIsListening(false);
      if (!processedRef.current) handleStudentResult(lastTranscriptRef.current);
    };
    setIsListening(true);
    try {
      rec.start();
    } catch (_e) {
      setIsListening(false);
    }
  }, [useWhisper, isListening, checkMatch, goToTurn3, handleStudentResult, script.choices]);

  /* 롤플레이 화면 중 현재 화면 카운팅 */
  const progressFilled = scriptIndex + 1;
  const progressTotal = ROLEPLAY_SCRIPTS.length;

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="roleplay-layout">
        <div className="roleplay-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
          <div className="roleplay-progress-row" aria-label="Progress">
            <div className="roleplay-progress">
            {Array.from({ length: progressTotal }, (_, i) => i + 1).map((i) => (
              <div
                key={i}
                className={`roleplay-progress-segment ${i <= progressFilled ? 'roleplay-progress-segment--filled' : ''}`}
              />
            ))}
            </div>
          </div>
        </div>

        <div className="roleplay-situation-wrap" aria-label="상황">
          <div className="roleplay-situation-label">{script.situationLabel}</div>
          <div className="roleplay-description" aria-label="상황 설명">
            {script.situationLines.map((line, i) => (
              <div key={i} className="roleplay-description-line">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="roleplay-chat">
          {/* Turn 1: 상황 블록 1초 뒤 말풍선 표시 → TTS → 1초 후 학생 영역 */}
          {showTurn1Bubble && (
            <div className="roleplay-bubble-row roleplay-bubble-row--character">
              <img src="/ch.png" alt="" className="roleplay-avatar" aria-hidden />
              <div className="roleplay-bubble-wrap">
                <span className="roleplay-name">{script.characterName}</span>
                <div className="roleplay-bubble roleplay-bubble--character">
                  {showTurn1Ko && script.turn1TextKo ? script.turn1TextKo : script.turn1Text}
                </div>
                {script.turn1TextKo && (
                  <button type="button" className="roleplay-k-btn" onClick={() => setShowTurn1Ko((k) => !k)} aria-label="한글 해석 보기">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="10" ry="3"/><ellipse cx="12" cy="12" rx="3" ry="10"/></svg>
                </button>
                )}
              </div>
            </div>
          )}

          {/* Turn 2·3: Student area – STT 결과는 턴 3에서도 말풍선에 유지 */}
          {((turn1Done && turn === 2) || turn === 3) && (
            <div className="roleplay-bubble-row roleplay-bubble-row--student">
              <img src="/selena.png" alt="" className="roleplay-avatar roleplay-avatar--student" aria-hidden />
              <div className="roleplay-bubble-wrap">
                <span className="roleplay-name">{STUDENT_NAME}</span>
                <div
                  className={`roleplay-bubble roleplay-bubble--student${!studentTranscript && turn === 2 && !isListening ? ' roleplay-bubble--hint' : ''}`}
                >
                  {turn === 2 && isListening
                    ? '...'
                    : showStudentKo && script.choicesKo
                      ? (studentTranscript ? getStudentBubbleKo(script, studentTranscript) : script.studentHint)
                      : studentTranscript
                        ? studentTranscript
                        : turn === 2
                          ? script.studentHint
                          : '\u00A0'}
                </div>
                {script.choicesKo && studentTranscript && (
                  <button type="button" className="roleplay-k-btn" onClick={() => setShowStudentKo((k) => !k)} aria-label="한글 해석 보기">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="10" ry="3"/><ellipse cx="12" cy="12" rx="3" ry="10"/></svg>
                </button>
                )}
                {turn === 2 && !studentTranscript && (
                  <div className="roleplay-choices-wrap">
                    <span className="roleplay-choices-label">You can say:</span>
                    <div className="roleplay-choices">
                      {script.choices.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="roleplay-choice roleplay-choice-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentResult(c);
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {turn === 2 && showFeedback && (
                  <div className="roleplay-feedback">
                    {script.feedbackPrefix}
                    <div className="roleplay-feedback-suggestion">{feedbackSuggestion}</div>
                    <button type="button" onClick={handleRetryOrContinue} className="roleplay-retry-btn">
                      {retryCount >= 2 ? 'Continue' : 'Try again'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Turn 3: Character closing (발화 키워드에 따라 turn3ByKeyword 대사 표시) */}
          {turn === 3 && (
            <div className="roleplay-bubble-row roleplay-bubble-row--character">
              <img src="/ch.png" alt="" className="roleplay-avatar" aria-hidden />
              <div className="roleplay-bubble-wrap">
                <span className="roleplay-name">{script.characterName}</span>
                <div className="roleplay-bubble roleplay-bubble--character">
                  {showTurn3Ko && (resolvedTurn3TextKo || script.turn3TextKo)
                    ? (resolvedTurn3TextKo || script.turn3TextKo)
                    : (resolvedTurn3Text || getTurn3Text(script, studentTranscript))}
                </div>
                {(script.turn3TextKo || resolvedTurn3TextKo) && (
                  <button type="button" className="roleplay-k-btn" onClick={() => setShowTurn3Ko((k) => !k)} aria-label="한글 해석 보기">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="10" ry="3"/><ellipse cx="12" cy="12" rx="3" ry="10"/></svg>
                </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mic: Turn 2에서 항상 표시. 피드백 블록이 떠 있으면 비활성화, Try again 누르면 다시 활성화 */}
        {turn === 2 && turn1Done && (
          <div className="roleplay-bottom">
            <button
              type="button"
              className="mic-btn mic-btn--step3"
              onClick={startRecognition}
              disabled={showFeedback || (!useWhisper && isListening)}
              aria-label={useWhisper ? (isListening ? 'Stop and transcribe' : 'Start recording') : 'Microphone'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
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

      {showGoodStamp && scriptIndex === 2 && (
        <div
          className="screen7-stamp-popup screen7-stamp-popup--overlay roleplay-good-stamp-overlay"
          role="button"
          tabIndex={0}
          aria-label="다음으로"
          onClick={(e) => { e.stopPropagation(); setShowGoodStamp(false); onNext(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowGoodStamp(false); onNext(); } }}
        >
          <div className="screen7-stamp-circle roleplay-good-stamp-circle">
            <svg className="screen7-stamp-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="roleplay-stamp-star" d="M0 -2.1 L0.5 -0.5 L2.2 -0.5 L0.8 0.5 L1.3 2.1 L0 1.1 L-1.3 2.1 L-0.8 0.5 L-2.2 -0.5 L-0.5 -0.5 Z" fill="#fff" />
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="3" />
              <use href="#roleplay-stamp-star" transform="translate(98, 38) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(82, 22) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(60, 16) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(38, 22) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(22, 38) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(22, 82) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(38, 98) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(60, 104) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(82, 98) scale(2)" />
              <use href="#roleplay-stamp-star" transform="translate(98, 82) scale(2)" />
              <text x="60" y="62" textAnchor="middle" dominantBaseline="central" className="screen7-stamp-text" fill="#fff">GOOD!</text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
