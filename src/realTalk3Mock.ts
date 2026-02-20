/**
 * Real Talk 3 – Mock AI (실제 API 연동 전 테스트용)
 */

import type { ErrorLogItem, SummaryItem } from './realTalk3Types';

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

/** Cathy 첫 대사: greeting (의문문 없음) */
const CATHY_FIRST_PHRASE = "Hi! I'm Cathy. Nice to meet you!";
const CATHY_FIRST_PHRASE_KO = '안녕! 나는 캐시야. 만나서 반가워!';

/** Mock: Cathy 대사 시퀀스. 턴0 greeting / 턴1-4 받아주기+질문 / 턴5 활동 기반 제안형 마무리 */
const CATHY_PHRASES: { en: string; ko: string }[] = [
  { en: "Hi! I'm Cathy. Nice to meet you!", ko: '안녕! 나는 캐시야. 만나서 반가워!' },
  { en: "Nice to meet you too! What's your name?", ko: '나도 만나서 반가워! 네 이름은 뭐야?' },
  { en: 'Oh, nice to meet you! How old are you?', ko: '만나서 반가워! 몇 살이야?' },
  { en: 'Cool! How are you feeling today?', ko: '멋져! 오늘 기분은 어때?' },
  { en: 'Good! What do you do after school?', ko: '좋아! 학교 끝나고 뭘 해?' },
  { en: 'Nice! Let\'s play together next time!', ko: '좋아! 다음에 같이 하자!' },
];

/** Mock: 사용자 발화 평가. userTurnIndex 0-4 (몇 번째 사용자 턴인지) */
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
      isLastTurn: nextCathyIdx >= 5,
    };
  }

  // 문법 체크 (예: "my name is" 누락) - ask name 후 사용자 턴. 사용자 발화한 이름으로 full sentence
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
        explanation: '이름을 말할 때 "My name is"를 사용해요.',
      },
    };
  }

  // 맥락 부자연스러움 (예: "I have eight years" → "I'm eight years old"). 사용자 발화한 나이로 full sentence
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

  // 턴4(마지막): 사용자 활동 기반 제안형 마무리 (Let's ~~ together!) - off-topic 체크보다 먼저 (마지막 턴은 무조건 마무리)
  if (userTurnIndex === 4) {
    const activityMap: { word: string; phrase: string; ko: string }[] = [
      { word: 'soccer', phrase: "Nice! Let's play soccer together next time!", ko: '좋아! 다음에 같이 축구하자!' },
      { word: 'football', phrase: "Nice! Let's play football together next time!", ko: '좋아! 다음에 같이 축구하자!' },
      { word: 'draw', phrase: "Nice! Let's draw together next time!", ko: '좋아! 다음에 같이 그리자!' },
      { word: 'paint', phrase: "Nice! Let's draw together next time!", ko: '좋아! 다음에 같이 그리자!' },
      { word: 'swim', phrase: "Nice! Let's swim together next time!", ko: '좋아! 다음에 같이 수영하자!' },
      { word: 'read', phrase: "Nice! Let's read together next time!", ko: '좋아! 다음에 같이 읽자!' },
    ];
    const match = activityMap.find((a) => t.includes(a.word));
    const closing = match ? match.phrase : "Nice! Let's play together next time!";
    const closingKo = match ? match.ko : '좋아! 다음에 같이 하자!';
    return {
      cathyPhrase: closing,
      cathyPhraseKo: closingKo,
      isMainDialogue: true,
      isLastTurn: true,
    };
  }

  // 맥락 체크 (주제 이탈) - 턴0~3에만 적용 (턴4는 위에서 이미 마무리됨)
  const topicWords = ['name', 'age', 'old', 'student', 'nice', 'meet', 'hello', 'hi', 'i am', "i'm", 'feel', 'good', 'happy', 'hungry', 'play', 'school', 'bye'];
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

  // Turn 1 응답에서만 이름 사용 (사용자가 방금 이름 말함)
  if (userTurnIndex === 1) {
    const words = t.split(/\s+/).filter((w) => w.length > 0);
    const skip = ['name', 'i', 'my', 'the', 'a', 'is', 'am', 'me', 'call'];
    const nameWord = words.find((w) => !skip.includes(w.toLowerCase())) || words[words.length - 1];
    const name = nameWord ? nameWord.charAt(0).toUpperCase() + nameWord.slice(1).toLowerCase() : '';
    const phrase = name
      ? { en: `Oh, ${name}! Nice to meet you! How old are you?`, ko: `${name}! 만나서 반가워! 몇 살이야?` }
      : nextPhrase;
    return {
      cathyPhrase: phrase.en,
      cathyPhraseKo: phrase.ko,
      isMainDialogue: true,
      isLastTurn: nextCathyIdx >= 5,
    };
  }

  return {
    cathyPhrase: nextPhrase.en,
    cathyPhraseKo: nextPhrase.ko,
    isMainDialogue: true,
    isLastTurn: nextCathyIdx >= 5,
  };
}

/** Mock: Cathy 첫 대사 */
export function getCathyFirstPhrase(): { en: string; ko: string } {
  return { en: CATHY_FIRST_PHRASE, ko: CATHY_FIRST_PHRASE_KO };
}

/** Mock: 세션 평가. 실제 API 연동 시 교체 */
export function evaluateSession(
  _conversationSummary: SummaryItem[],
  errorLog: ErrorLogItem[]
): { topicRelevanceScore: number; expressionScore: number; overallFeedback: string } {
  const errorCount = errorLog.length;
  const topicScore = errorCount === 0 ? 5 : Math.max(1, 5 - errorCount);
  const exprScore = errorCount === 0 ? 5 : Math.max(1, 5 - Math.floor(errorCount / 2));
  const feedback =
    errorCount === 0
      ? '오늘 대화 정말 잘했어요! 자신 있게 말하는 모습이 좋았어요.'
      : '조금 더 연습하면 더 좋아질 거예요. 화이팅!';
  return {
    topicRelevanceScore: topicScore,
    expressionScore: exprScore,
    overallFeedback: feedback,
  };
}
