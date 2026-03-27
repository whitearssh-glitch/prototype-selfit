/**
 * Real Talk 4 – Mock AI (Grocery Shopping)
 * 설정: AI=마트 점원, 학생=손님. I want / I want to / I need / I'm going to / Here you are 활용.
 */

import type { ErrorLogItem, SummaryItem } from './realTalk4Types';
import {
  RT4_ITEM_OPTS_EN,
  RT4_ITEM_OPTS_KO,
  rt4ItemWordToCanonical,
  rt4PhraseEnForItem,
  rt4PhraseKoForItem,
} from '../server/rt4GroceryItems.js';

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

/** Shopkeeper 첫 대사: 인사 + 뭘 사고 싶은지 묻기 */
const CATHY_FIRST_PHRASE = "Hi! Welcome! What do you want to buy today?";
const CATHY_FIRST_PHRASE_KO = '안녕! 어서 와! 오늘 뭐 사고 싶어?';

/** Shopkeeper 턴1: 물건별 옵션 (server/rt4GroceryItems.js 와 동일) */
const ITEM_OPTIONS: Record<string, { en: string; ko: string }> = Object.fromEntries(
  (Object.keys(RT4_ITEM_OPTS_EN) as (keyof typeof RT4_ITEM_OPTS_EN)[]).map((k) => [
    k,
    { en: RT4_ITEM_OPTS_EN[k], ko: RT4_ITEM_OPTS_KO[k] },
  ])
) as Record<string, { en: string; ko: string }>;

const MOCK_RT4_ITEM_WORDS: Record<string, string> = rt4ItemWordToCanonical;

function mockRt4ResolveCanonicalFromText(text: string): string {
  const low = text.toLowerCase();
  const keys = Object.keys(MOCK_RT4_ITEM_WORDS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(low)) return MOCK_RT4_ITEM_WORDS[k];
  }
  return 'apples';
}

function mockRt4HasBuyIntent(t: string): boolean {
  return (
    /\b(want|need)\b/.test(t) ||
    /\bbuy\b/.test(t) ||
    /\bget\b/.test(t) ||
    /\bi'?d like\b/.test(t) ||
    t.includes('i would like') ||
    t.includes("i'll take") ||
    /\bgive me\b/.test(t) ||
    /\bcan i get\b/.test(t) ||
    /\bcould i get\b/.test(t)
  );
}

function mockRt4ExtractItem(t: string): string {
  const keys = Object.keys(MOCK_RT4_ITEM_WORDS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(t)) return MOCK_RT4_ITEM_WORDS[k];
  }
  const m1 = t.match(/\b(?:want|need)\s+(?:to\s+(?:buy|get)\s+)?(?:a|an|the|some)?\s*([a-z]{2,})\b/);
  if (m1) {
    const w = m1[1].replace(/s$/i, '').toLowerCase();
    if (MOCK_RT4_ITEM_WORDS[w]) return MOCK_RT4_ITEM_WORDS[w];
    if (MOCK_RT4_ITEM_WORDS[`${w}s`]) return MOCK_RT4_ITEM_WORDS[`${w}s`];
  }
  const m2 = t.match(/\b(?:i'?d like|i would like)\s+(?:a|an|the|some)?\s*([a-z]{2,})\b/);
  if (m2) {
    const w = m2[1].replace(/s$/i, '').toLowerCase();
    if (MOCK_RT4_ITEM_WORDS[w]) return MOCK_RT4_ITEM_WORDS[w];
    if (MOCK_RT4_ITEM_WORDS[`${w}s`]) return MOCK_RT4_ITEM_WORDS[`${w}s`];
  }
  return '';
}

/** Mock: Cathy 대사 시퀀스. 턴0 인사+구매물품 / 턴1 옵션+어떤 거 / 턴2 다른 거 / 턴3 그게 다냐 / 턴4 가격 / 턴5 고맙다+인사 */
const CATHY_PHRASES: { en: string; ko: string }[] = [
  { en: "Hi! Welcome! What do you want to buy today?", ko: '안녕! 어서 와! 오늘 뭐 사고 싶어?' },
  { en: "We have apples, milk, and bread. What do you need?", ko: '사과, 우유, 빵 있어. 뭐 필요해?' },
  { en: "Do you need anything else?", ko: '다른 거 필요해?' },
  { en: "Is that all?", ko: '그게 다야?' },
  { en: "That's five dollars.", ko: '5달러야.' },
  { en: "Thank you! Have a nice day!", ko: '고마워! 좋은 하루 보내!' },
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

  // 질문형 발화 → 오프토픽 (단어 경계: "whole"에 "who" 포함되는 오탐 방지)
  const isQuestionLike = (q: string) => {
    if (q.endsWith('?')) return true;
    const patterns = ['\\bwhat\\b', '\\bhow\\b', '\\bwhere\\b', '\\bwhy\\b', '\\bwhen\\b', '\\bwho\\b', '\\bhow much\\b', '\\bhow many\\b'];
    return patterns.some((p) => new RegExp(p, 'i').test(q));
  };
  const isQuestion = isQuestionLike(t);
  if (isQuestion && userTurnIndex >= 1 && userTurnIndex <= 4) {
    const redirects: Record<number, { en: string; ko: string }> = {
      1: { en: "We have apples, milk, and bread. What do you need?", ko: '사과, 우유, 빵 있어. 뭐 필요해?' },
      2: { en: "Do you need anything else?", ko: '다른 거 필요해?' },
      3: { en: "Is that all?", ko: '그게 다야?' },
      4: { en: "That's five dollars.", ko: '5달러야.' },
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

  // Turn 0: 인사/구매의사 → 학생 발화 반영해서 자연스럽게
  if (userTurnIndex === 0) {
    const item = mockRt4ExtractItem(t);
    const hasBuyIntent = mockRt4HasBuyIntent(t);
    if (item && hasBuyIntent) {
      const opts = ITEM_OPTIONS[item] ?? { en: rt4PhraseEnForItem(item), ko: rt4PhraseKoForItem(item) };
      return {
        cathyPhrase: opts.en,
        cathyPhraseKo: opts.ko,
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
    if (t.startsWith('hello') || t === 'hello' || t.startsWith('hi') || t === 'hi' || t.startsWith('hey') || t === 'hey') {
      return {
        cathyPhrase: "Hi! What do you want to buy today?",
        cathyPhraseKo: '안녕! 오늘 뭐 사고 싶어?',
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
    if (t.includes('nice') && t.includes('meet')) {
      return {
        cathyPhrase: "Nice to meet you too! What do you want to buy?",
        cathyPhraseKo: '나도 만나서 반가워! 뭐 사고 싶어?',
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
    if (!hasBuyIntent && !item) {
      return {
        cathyPhrase: "Oh! What do you want to buy today?",
        cathyPhraseKo: '오늘 뭐 사고 싶어?',
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
  }

  // Turn 0: I want / I need / I want to 구문 체크 (문법 오류 시) — I'd like 등은 제외
  if (userTurnIndex === 0 && !mockRt4HasBuyIntent(t)) {
    const itemWords = t.split(/\s+/).filter((w) => w.length > 0);
    const skip = ['i', 'the', 'a', 'some', 'please', 'give', 'me'];
    const item = itemWords.find((w) => !skip.includes(w.toLowerCase())) || itemWords[itemWords.length - 1] || 'apple';
    const itemCap = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
    return {
      cathyPhrase: "Nice try! Say it like this.",
      cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
      isMainDialogue: false,
      correction: {
        type: 'grammar',
        sentence: `I want ${itemCap}.`,
        explanation: '물건을 살 때 "I want" 또는 "I need"를 사용해요.',
      },
    };
  }

  // Turn 1: 옵션 선택. 문법/자연스러움 교정
  if (userTurnIndex === 1) {
    const asksForOtherOptions = (t.includes('other') || t.includes('option') || t.includes('another') || t.includes('different') || t.includes('else') || t.includes('more')) && (t.includes('?') || t.includes('do') || t.includes('have') || t.includes('any'));
    if (asksForOtherOptions) {
      return {
        cathyPhrase: "Yeah, we have that! Do you need anything else?",
        cathyPhraseKo: '어, 그거 있어! 다른 거 필요한 거 없어?',
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
    const optionWords: Record<string, string> = {
      red: 'red',
      green: 'green',
      whole: 'whole',
      skim: 'skim',
      white: 'white',
      wheat: 'whole wheat',
      large: 'large',
      small: 'small',
      cold: 'cold',
      warm: 'warm',
      yellow: 'yellow',
      sweet: 'sweet',
      sour: 'sour',
      apple: 'apple',
      orange: 'orange',
      vanilla: 'vanilla',
      chocolate: 'chocolate',
      plain: 'plain',
      cheese: 'cheese',
      pepperoni: 'pepperoni',
      sesame: 'sesame',
      blueberry: 'blueberry',
      glazed: 'glazed',
      butter: 'butter',
      mini: 'mini',
      big: 'big',
      seedless: 'seedless',
      firm: 'firm',
      ripe: 'ripe',
    };
    let item = mockRt4ResolveCanonicalFromText(t);
    let chosen = '';
    for (const [k, v] of Object.entries(optionWords)) {
      if (t.includes(k)) { chosen = v; break; }
    }
    const itemCap = item
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
    const chosenCap = chosen ? chosen.charAt(0).toUpperCase() + chosen.slice(1) : itemCap;
    const hasWant = t.includes('want') || t.includes('need');
    const optionWithItem = chosen ? `${chosenCap} ${item}` : itemCap;

    if (!hasWant && (chosen || t.split(/\s+/).length <= 2)) {
      return {
        cathyPhrase: "Nice try! Say it like this.",
        cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
        isMainDialogue: false,
        correction: {
          type: 'grammar',
          sentence: `I want ${optionWithItem}.`,
          explanation: '옵션을 고를 때 "I want"를 사용해요.',
        },
      };
    }
    if (chosen && (t.includes('red apple') || t.includes('green apple') || t.includes('whole milk') || t.includes('white bread')) && !t.endsWith('s') && !t.includes('apples') && !t.includes('eggs')) {
      return {
        cathyPhrase: "So close! You can also say!",
        cathyPhraseKo: '거의 다 왔어! 이렇게도 말해볼 수 있어!',
        isMainDialogue: false,
        correction: {
          type: 'naturalness',
          sentence: `I want ${optionWithItem}.`,
          explanation: '물건은 복수형으로 말해요. (apples, eggs 등)',
        },
      };
    }
    return {
      cathyPhrase: chosen ? "Good choice! Do you need anything else?" : `${itemCap}! Do you need anything else?`,
      cathyPhraseKo: chosen ? '좋은 선택이야! 다른 건 필요 없어?' : `${itemCap}! 다른 거 필요해?`,
      isMainDialogue: true,
      isLastTurn: false,
    };
  }

  // Turn 2: no/추가 구매. 문법/자연스러움 교정
  if (userTurnIndex === 2) {
    const addItem = mockRt4ExtractItem(t);
    const addItemCap = addItem
      ? addItem.split(/\s+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
      : '';
    if ((t.includes('i no') || t.includes('no need') || t.includes('dont need') || t.includes("don't need")) && !t.includes('no,') && !t.includes('no thanks')) {
      return {
        cathyPhrase: "Nice try! Say it like this.",
        cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
        isMainDialogue: false,
        correction: {
          type: 'grammar',
          sentence: "No, thanks.",
          explanation: '부정할 때 "No, thanks." 또는 "I don\'t need anything else."를 사용해요.',
        },
      };
    }
    if ((t.includes('give me') || t.includes('give')) && addItem && !t.includes('need') && !t.includes('want')) {
      return {
        cathyPhrase: "So close! You can also say!",
        cathyPhraseKo: '거의 다 왔어! 이렇게도 말해볼 수 있어!',
        isMainDialogue: false,
        correction: {
          type: 'naturalness',
          sentence: addItemCap ? `I need ${addItemCap}.` : "I need milk.",
          explanation: '추가로 살 때 "I need" 또는 "I want"를 사용해요.',
        },
      };
    }
    if (t.includes('no') || t.includes("that's") || t.includes('all') || t.includes('nothing')) {
      return {
        cathyPhrase: "Okay! Is that all?",
        cathyPhraseKo: '알겠어! 그게 다야?',
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
    return {
      cathyPhrase: addItemCap ? `${addItemCap} too! Is that all?` : "Great! Is that all?",
      cathyPhraseKo: addItemCap ? `${addItemCap}도! 그게 다야?` : '좋아! 그게 다야?',
      isMainDialogue: true,
      isLastTurn: false,
    };
  }

  // Turn 3: 그게 다냐고 물어보기 → 가격만. 문법 교정
  if (userTurnIndex === 3) {
    if ((t.includes('its all') || t.includes('it all') || t.includes('that all') || t === 'all') && !t.includes("that's") && !t.includes('yes')) {
      return {
        cathyPhrase: "Nice try! Say it like this.",
        cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
        isMainDialogue: false,
        correction: {
          type: 'grammar',
          sentence: "That's all.",
          explanation: '"That\'s all." 또는 "Yes, that\'s all."을 사용해요.',
        },
      };
    }
    return {
      cathyPhrase: "That's five dollars.",
      cathyPhraseKo: '5달러야.',
      isMainDialogue: true,
      isLastTurn: false,
    };
  }

  // Turn 4: 가격 말해주기 → 사용자 "Here you are" / "Thank you" 등. 자연스러움 교정
  if (userTurnIndex === 4) {
    if ((t === 'here' || t === 'money' || t.length <= 3) && !t.includes('thank') && !t.includes('here you')) {
      return {
        cathyPhrase: "So close! You can also say!",
        cathyPhraseKo: '거의 다 왔어! 이렇게도 말해볼 수 있어!',
        isMainDialogue: false,
        correction: {
          type: 'naturalness',
          sentence: "Here you are.",
          explanation: '돈을 줄 때 "Here you are." 또는 "Thank you!"를 말해요.',
        },
      };
    }
    return {
      cathyPhrase: "Thank you! Have a nice day!",
      cathyPhraseKo: '고마워! 좋은 하루 보내!',
      isMainDialogue: true,
      isLastTurn: true,
    };
  }

  // 주제 이탈 체크
  const topicWords = ['want', 'need', 'buy', 'apple', 'milk', 'bread', 'egg', 'water', 'juice', 'dollar', 'thank', 'yes', 'no', 'here'];
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

  return {
    cathyPhrase: nextPhrase.en,
    cathyPhraseKo: nextPhrase.ko,
    isMainDialogue: true,
    isLastTurn: nextCathyIdx >= 5,
  };
}

/** Mock: Shopkeeper 첫 대사 */
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
      ? '오늘 쇼핑 대화 정말 잘했어요! 자신 있게 말하는 모습이 좋았어요.'
      : '조금 더 연습하면 더 좋아질 거예요. 화이팅!';
  return {
    topicRelevanceScore: topicScore,
    expressionScore: exprScore,
    overallFeedback: feedback,
  };
}
