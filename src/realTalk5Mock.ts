/**
 * Real Talk 5 – Mock AI (Meet New Friends)
 * 7턴 (AI 4턴, 학생 3턴). 처음 만나 인사하는 설정.
 * 핵심 표현: Hi / Hello / Nice to meet you / I'm 이름 / My name is 이름 / I'm 나이
 */

import type { ErrorLogItem, SummaryItem } from './realTalk5Types';

export type AIEvaluationResult = {
  cathyPhrase: string;
  cathyPhraseKo?: string;
  isMainDialogue: boolean;
  correction?: {
    type: 'grammar' | 'naturalness';
    sentence: string;
    explanation?: string;
  };
  isOffTopic?: boolean;
  isLastTurn?: boolean;
};

/** Cathy 첫 대사: 인사 */
const CATHY_FIRST_PHRASE = "Hi! I'm Cathy. Nice to meet you!";
const CATHY_FIRST_PHRASE_KO = '안녕! 나는 캐시야. 만나서 반가워!';

/** Mock: Cathy 대사 시퀀스. 턴0 인사 / 턴1 인사 받아주고 이름 묻기 / 턴2 이름 받아주고 나이 묻기 / 턴3 내 이름은 Cathy + 좋은 친구 되자 마무리 */
const CATHY_PHRASES: { en: string; ko: string }[] = [
  { en: "Hi! I'm Cathy. Nice to meet you!", ko: '안녕! 나는 캐시야. 만나서 반가워!' },
  { en: "Oh! Nice to meet you too! What's your name?", ko: '나도 만나서 반가워! 네 이름은 뭐야?' },
  { en: 'Oh, nice to meet you! How old are you?', ko: '만나서 반가워! 몇 살이야?' },
  { en: "Me, too! Let's be good friends!", ko: '나도! 좋은 친구 되자!' },
];

/** Mock: 사용자 발화 평가. userTurnIndex 0-2 (7턴: AI 4, 학생 3) */
export function evaluateUserUtterance(
  userText: string,
  _expectedContext: string,
  userTurnIndex: number
): AIEvaluationResult {
  const t = userText.trim().toLowerCase();
  const nextCathyIdx = userTurnIndex + 1;
  const nextPhrase = CATHY_PHRASES[Math.min(nextCathyIdx, CATHY_PHRASES.length - 1)];

  if (!t) {
    return {
      cathyPhrase: CATHY_PHRASES[Math.max(0, nextCathyIdx - 1)]?.en ?? CATHY_FIRST_PHRASE,
      cathyPhraseKo: CATHY_PHRASES[Math.max(0, nextCathyIdx - 1)]?.ko ?? CATHY_FIRST_PHRASE_KO,
      isMainDialogue: false,
      isLastTurn: nextCathyIdx >= 3,
    };
  }

  // Turn 0: 사용자 인사 → Cathy 인사 받아주고 이름 묻기
  if (userTurnIndex === 0) {
    const getGreetingResponse = (): { en: string; ko: string } => {
      if (t.includes('nice') && t.includes('meet')) return { en: "Nice to meet you too! What's your name?", ko: '나도 만나서 반가워! 네 이름은 뭐야?' };
      if (t.startsWith('hello') || t === 'hello') return { en: "Hello! Nice to meet you! What's your name?", ko: '안녕! 만나서 반가워! 네 이름은 뭐야?' };
      if (t.startsWith('hey') || t === 'hey') return { en: "Hey! Nice to meet you! What's your name?", ko: '헤이! 만나서 반가워! 네 이름은 뭐야?' };
      if (t.startsWith('hi') || t === 'hi') return { en: "Hi! Nice to meet you too! What's your name?", ko: '안녕! 나도 만나서 반가워! 네 이름은 뭐야?' };
      if (t.includes('good morning')) return { en: "Good morning! Nice to meet you! What's your name?", ko: '좋은 아침! 만나서 반가워! 네 이름은 뭐야?' };
      if (t.includes('good afternoon')) return { en: "Good afternoon! Nice to meet you! What's your name?", ko: '좋은 오후! 만나서 반가워! 네 이름은 뭐야?' };
      if ((t.includes('who') && t.includes('you')) || (t.includes('what') && t.includes('you'))) return { en: "I'm Cathy! Nice to meet you! What's your name?", ko: '나는 캐시야! 만나서 반가워! 네 이름은 뭐야?' };
      return { en: "Oh! Nice to meet you! What's your name?", ko: '나도 만나서 반가워! 네 이름은 뭐야?' };
    };
    const phrase = getGreetingResponse();
    return {
      cathyPhrase: phrase.en,
      cathyPhraseKo: phrase.ko,
      isMainDialogue: true,
      isLastTurn: nextCathyIdx >= 3,
    };
  }

  // 질문형 발화 → 오프토픽 (턴1~2)
  const isQuestionLike = (q: string) => {
    if (q.endsWith('?')) return true;
    if (q.startsWith('i ') || q.startsWith("i'm ") || q.startsWith('i am ') || q.startsWith('my ')) return false;
    const qWords = ['what', 'how', 'where', 'why', 'when', 'who', 'doing', 'going', 'do you', 'are you'];
    return qWords.some((w) => q.includes(w));
  };
  const isQuestion = isQuestionLike(t);
  if (isQuestion && userTurnIndex >= 1 && userTurnIndex <= 2) {
    const redirects: Record<number, { en: string; ko: string }> = {
      1: { en: "I'm Cathy! Nice to meet you! What's your name?", ko: '나는 캐시야! 만나서 반가워! 네 이름은 뭐야?' },
      2: { en: "I'm eight! How old are you?", ko: '나는 여덟 살이야! 몇 살이야?' },
    };
    const r = redirects[userTurnIndex] ?? redirects[1];
    return {
      cathyPhrase: r.en,
      cathyPhraseKo: r.ko,
      isMainDialogue: false,
      isOffTopic: true,
      isLastTurn: false,
    };
  }

  // Turn 1: 이름 말하기 - "my name is" / "i'm" / "i am" 체크
  if (userTurnIndex === 1 && !t.includes('name') && !t.includes('i am') && !t.includes("i'm")) {
    const words = t.split(/\s+/).filter((w) => w.length > 0);
    const skip = ['name', 'i', 'my', 'the', 'a', 'is', 'am', 'me', 'call'];
    const nameWord = words.find((w) => !skip.includes(w.toLowerCase())) || words[words.length - 1] || 'there';
    const name = nameWord.charAt(0).toUpperCase() + nameWord.slice(1).toLowerCase();
    return {
      cathyPhrase: "Nice try! Say it like this.",
      cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
      isMainDialogue: false,
      correction: {
        type: 'grammar',
        sentence: `My name is ${name}.`,
        explanation: '이름을 말할 때 "My name is" 또는 "I\'m"을 사용해요.',
      },
    };
  }

  // Turn 2: 나이 말하기 - "I have eight years" → "I'm eight years old"
  if (userTurnIndex === 2 && t.includes('have') && t.includes('year')) {
    const ageMatch = t.match(/\b(\d+)\b|(eight|seven|nine|ten|eleven|six)/i);
    const age = ageMatch ? (ageMatch[1] || ageMatch[2]?.toLowerCase() || 'eight') : 'eight';
    return {
      cathyPhrase: "So close! You can also say!",
      cathyPhraseKo: '거의 다 왔어! 이렇게도 말해볼 수 있어!',
      isMainDialogue: false,
      correction: {
        type: 'naturalness',
        sentence: `I'm ${age} years old.`,
        explanation: '나이를 말할 때 "I\'m ~ years old"를 사용해요.',
      },
    };
  }

  // Turn 2 (마지막): 나이 받아주고 + "Me, too! 좋은 친구 되자!" 마무리
  if (userTurnIndex === 2) {
    const ageMatch = t.match(/\b(\d+)\b|(eight|seven|nine|ten|eleven|six)/i);
    const age = ageMatch ? (ageMatch[1] || ageMatch[2]?.toLowerCase() || 'eight') : 'eight';
    const ageCap = String(age).charAt(0).toUpperCase() + String(age).slice(1);
    return {
      cathyPhrase: `${ageCap}! Me, too! Let's be good friends!`,
      cathyPhraseKo: `${age}! 나도! 좋은 친구 되자!`,
      isMainDialogue: true,
      isLastTurn: true,
    };
  }

  // 맥락 체크 (주제 이탈) - 턴0~1에만 적용
  const topicWords = ['name', 'age', 'old', 'nice', 'meet', 'hello', 'hi', 'i am', "i'm", 'my', 'eight', 'seven', 'nine', 'ten'];
  const onTopic = topicWords.some((w) => t.includes(w));
  if (!onTopic && t.length > 3) {
    const redirectPhrase = CATHY_PHRASES[Math.min(nextCathyIdx, CATHY_PHRASES.length - 1)];
    return {
      cathyPhrase: redirectPhrase.en,
      cathyPhraseKo: redirectPhrase.ko,
      isMainDialogue: false,
      isOffTopic: true,
      isLastTurn: false,
    };
  }

  // Turn 1: 사용자 이름 에코 + 나이 묻기
  if (userTurnIndex === 1) {
    const words = t.split(/\s+/).filter((w) => w.length > 0);
    const skip = ['name', 'i', 'my', 'the', 'a', 'is', 'am', 'me', 'call', "i'm", 'im'];
    const nameWord = words.find((w) => !skip.includes(w.toLowerCase())) || words[words.length - 1];
    const name = nameWord ? nameWord.charAt(0).toUpperCase() + nameWord.slice(1).toLowerCase() : '';
    const phrase = name
      ? { en: `Oh, ${name}! Nice to meet you! How old are you?`, ko: `${name}! 만나서 반가워! 몇 살이야?` }
      : nextPhrase;
    return {
      cathyPhrase: phrase.en,
      cathyPhraseKo: phrase.ko,
      isMainDialogue: true,
      isLastTurn: nextCathyIdx >= 3,
    };
  }

  return {
    cathyPhrase: nextPhrase.en,
    cathyPhraseKo: nextPhrase.ko,
    isMainDialogue: true,
    isLastTurn: nextCathyIdx >= 3,
  };
}

/** Mock: Cathy 첫 대사 */
export function getCathyFirstPhrase(): { en: string; ko: string } {
  return { en: CATHY_FIRST_PHRASE, ko: CATHY_FIRST_PHRASE_KO };
}

/** Mock: 세션 평가 */
export function evaluateSession(
  _conversationSummary: SummaryItem[],
  errorLog: ErrorLogItem[]
): { topicRelevanceScore: number; expressionScore: number; overallFeedback: string } {
  const errorCount = errorLog.length;
  const topicScore = errorCount === 0 ? 5 : Math.max(1, 5 - errorCount);
  const exprScore = errorCount === 0 ? 5 : Math.max(1, 5 - Math.floor(errorCount / 2));
  const feedback =
    errorCount === 0
      ? '오늘 인사 대화 정말 잘했어요! 자신 있게 말하는 모습이 좋았어요.'
      : '조금 더 연습하면 더 좋아질 거예요. 화이팅!';
  return {
    topicRelevanceScore: topicScore,
    expressionScore: exprScore,
    overallFeedback: feedback,
  };
}
