/**
 * Real Talk 7 – Mock AI (Ordering Hamburgers)
 * 설정: AI=햄버거 가게 직원, 학생이 햄버거 주문하는 대화.
 * 총 11턴. AI 첫 대화: 인사 + 뭐 주문할래? / AI 마지막: 마무리.
 * 햄버거 주문 주제 내에서 자유롭게 대화. 문법적 오류 피드백 교정.
 */

import type { ErrorLogItem, SummaryItem } from './realTalk7Types';

function randomIntInclusive(min: number, max: number): number {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export type AIEvaluationResult = {
  cathyPhrase: string;
  cathyPhraseKo?: string;
  isMainDialogue: boolean;
  correction?: {
    type: 'grammar' | 'naturalness' | 'context';
    sentence: string;
    explanation?: string;
  };
  isOffTopic?: boolean;
  isLastTurn?: boolean;
};

/** AI 첫 대사: 인사 + 뭐 주문할래? */
const CATHY_FIRST_PHRASE = "Hi! What would you like to order today?";
const CATHY_FIRST_PHRASE_KO = '안녕하세요! 오늘 뭐 주문하실래요?';

/** AI 중간 대사들 (햄버거 주문 흐름 - 자유롭게) */
const CATHY_PHRASES: { en: string; ko: string }[] = [
  { en: "Hi! What would you like to order today?", ko: '안녕하세요! 오늘 뭐 주문하실래요?' },
  { en: "Great! What size would you like?", ko: '좋아요! 사이즈는 어떻게 할까요?' },
  { en: "Got it! Anything else?", ko: '알겠어요! 다른 거 더 필요해요?' },
  { en: "For here or to go?", ko: '매장에서 드실래요, 아니면 가져가실래요?' },
  { en: "Okay! Your order will be ready soon.", ko: '알겠어요! 곧 준비해 드릴게요.' },
  { en: "Thank you! Enjoy your meal!", ko: '감사합니다! 맛있게 드세요!' },
];

/**
 * Grammar Error: subject-verb agreement, tense, articles (a/an/the), plural forms.
 * (발화 활동이므로 spelling 제외)
 */
function checkCommonGrammarErrors(t: string): { sentence: string; explanation: string } | null {
  // Articles: I want hamburger/burger (missing a/an) - fries는 복수라 article 없음
  if (!/\bi\s+want\s+(?:a|an|one)\s+/i.test(t) && /\bi\s+want\s+(?:the\s+)?(?:hamburger|burger|drink)\b/i.test(t)) {
    const match = t.match(/\b(hamburger|burger|drink)\b/i);
    const noun = match ? match[1].toLowerCase() : 'hamburger';
    const article = /^[aeiou]/.test(noun) ? 'an' : 'a';
    return { sentence: `I want ${article} ${noun}.`, explanation: '명사 앞에 "a" 또는 "an"을 붙여요.' };
  }
  // Plural: hamburger vs hamburgers (countable)
  if (/\bi\s+want\s+two\s+hamburger\b|\bi\s+want\s+3\s+hamburger\b/i.test(t)) {
    return { sentence: "I want two hamburgers.", explanation: '두 개 이상일 때는 복수형 "hamburgers"를 써요.' };
  }
  // Subject-verb: he want, she want
  if (/\b(he|she|it)\s+want\b/i.test(t)) {
    return { sentence: "I want a hamburger.", explanation: 'he/she/it 뒤에는 "wants"를 써요. "I" 뒤에는 "want"를 써요.' };
  }
  // Tense: I wanted (과거) when present expected
  if (/\bi\s+wanted\s+/i.test(t) && !t.includes('yesterday') && !t.includes('last')) {
    return { sentence: "I want a hamburger.", explanation: '지금 주문할 때는 현재형 "want"를 써요.' };
  }
  return null;
}

/** Context Error: Check if the answer matches the AI's previous question */
function checkContextError(
  userText: string,
  conversationSummary: SummaryItem[],
  userTurnIndex: number
): { sentence: string; explanation: string } | null {
  if (userTurnIndex >= conversationSummary.length) return null;
  const lastAi = conversationSummary.filter((s) => s.speaker === 'Kevin').pop();
  if (!lastAi?.textEn) return null;
  const lastQ = lastAi.textEn.toLowerCase();
  const t = userText.trim().toLowerCase();

  // Turn 0: AI asked "what would you like to order?" → expect order (hamburger, burger, fries, drink)
  if (userTurnIndex === 0 && /what would you like to order|what do you want/i.test(lastQ)) {
    const orderWords = ['hamburger', 'burger', 'fries', 'drink', 'cheeseburger', 'order'];
    if (!orderWords.some((w) => t.includes(w)) && t.length > 3) {
      return { sentence: "I want a hamburger.", explanation: '주문할 메뉴를 말해주세요.' };
    }
  }
  // Turn 1: AI asked "what size?" → expect size (small, medium, large)
  if (userTurnIndex === 1 && /size|how big/i.test(lastQ)) {
    const sizeWords = ['small', 'medium', 'large', 'big', 'regular'];
    if (!sizeWords.some((w) => t.includes(w)) && t.length > 3) {
      return { sentence: "Large, please.", explanation: '사이즈를 말해주세요. (small, medium, large)' };
    }
  }
  // Turn 2: AI asked "anything else?" → expect yes/no or additional item
  if (userTurnIndex === 2 && /anything else|else|more/i.test(lastQ)) {
    const okWords = ['yes', 'no', 'fries', 'drink', 'that', 'all', 'nothing', 'no thanks'];
    if (!okWords.some((w) => t.includes(w)) && t.length > 4) {
      return { sentence: "No, that's all.", explanation: '"Yes" 또는 "No, that\'s all" 등으로 답해주세요.' };
    }
  }
  // Turn 3: AI asked "for here or to go?" → expect here/go
  if (userTurnIndex === 3 && /for here|to go|here or/i.test(lastQ)) {
    const placeWords = ['here', 'go', 'take', 'out', 'stay'];
    if (!placeWords.some((w) => t.includes(w)) && t.length > 3) {
      return { sentence: "For here, please.", explanation: '"For here" 또는 "To go"로 답해주세요.' };
    }
  }
  return null;
}

/** Mock: 사용자 발화 평가. userTurnIndex 0-4 (5 user turns, 11 turns total) */
export function evaluateUserUtterance(
  userText: string,
  conversationSummary: SummaryItem[] | string,
  userTurnIndex: number
): AIEvaluationResult {
  const t = userText.trim().toLowerCase();
  const nextCathyIdx = userTurnIndex + 1;
  const isLastUserTurn = userTurnIndex === 4;
  const summary = Array.isArray(conversationSummary) ? conversationSummary : [];

  if (!t) {
    const prev = CATHY_PHRASES[Math.max(0, nextCathyIdx - 1)];
    return {
      cathyPhrase: prev?.en ?? CATHY_FIRST_PHRASE,
      cathyPhraseKo: prev?.ko ?? CATHY_FIRST_PHRASE_KO,
      isMainDialogue: false,
      isLastTurn: isLastUserTurn,
    };
  }

  // Grammar Error: subject-verb, tense, articles, plural forms
  const grammarErr = checkCommonGrammarErrors(t);
  if (grammarErr) {
    return {
      cathyPhrase: "Nice try! Say it like this.",
      cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
      isMainDialogue: false,
      correction: { type: 'grammar' as const, sentence: grammarErr.sentence, explanation: grammarErr.explanation },
    };
  }

  // Context Error: answer matches AI's previous question?
  const contextErr = checkContextError(t, summary, userTurnIndex);
  if (contextErr) {
    return {
      cathyPhrase: "Let's answer the question!",
      cathyPhraseKo: '질문에 맞게 답해볼까요?',
      isMainDialogue: false,
      correction: { type: 'context' as const, sentence: contextErr.sentence, explanation: contextErr.explanation },
    };
  }

  // 주제 이탈 (햄버거 주문과 무관)
  const topicWords = ['hamburger', 'burger', 'order', 'want', 'like', 'size', 'large', 'small', 'medium', 'fries', 'drink', 'here', 'go', 'please', 'yes', 'no', 'one', 'two', 'cheese', 'ketchup'];
  const onTopic = topicWords.some((w) => t.includes(w)) || t.length <= 4;
  if (!onTopic && t.length > 4) {
    const nextPhrase = CATHY_PHRASES[Math.min(nextCathyIdx, CATHY_PHRASES.length - 1)];
    return {
      cathyPhrase: nextPhrase.en,
      cathyPhraseKo: nextPhrase.ko,
      isMainDialogue: false,
      isOffTopic: true,
      isLastTurn: isLastUserTurn,
    };
  }

  // 마지막 턴: AI 마무리
  if (isLastUserTurn) {
    const asksPrice =
      t.includes('price') ||
      t.includes('cost') ||
      t.includes('total') ||
      t.includes('how much') ||
      t.includes('how many dollars') ||
      t.includes('$');
    if (asksPrice) {
      const price = randomIntInclusive(10, 20);
      return {
        cathyPhrase: `It's $${price}. Thanks! Enjoy your meal!`,
        cathyPhraseKo: `${price}달러예요. 고마워요! 맛있게 드세요!`,
        isMainDialogue: true,
        isLastTurn: true,
      };
    }
    return {
      cathyPhrase: "Thank you! Enjoy your meal!",
      cathyPhraseKo: '감사합니다! 맛있게 드세요!',
      isMainDialogue: true,
      isLastTurn: true,
    };
  }

  // 중간 턴: 흐름에 맞게 다음 질문
  const nextPhrase = CATHY_PHRASES[Math.min(nextCathyIdx, CATHY_PHRASES.length - 1)];
  return {
    cathyPhrase: nextPhrase.en,
    cathyPhraseKo: nextPhrase.ko,
    isMainDialogue: true,
    isLastTurn: false,
  };
}

/** Mock: AI 첫 대사 */
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
      ? '오늘 햄버거 주문 대화 정말 잘했어요! I want, please 같은 표현을 잘 썼어요.'
      : '조금 더 연습하면 더 좋아질 거예요. 화이팅!';
  return {
    topicRelevanceScore: topicScore,
    expressionScore: exprScore,
    overallFeedback: feedback,
  };
}
