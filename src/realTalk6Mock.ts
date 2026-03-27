/**
 * Real Talk 6 – Mock AI (Favorite Movies)
 * 설정: AI=친구, 학생과 좋아하는 영화에 대해 말하고 영화관 가자고 제안.
 * 핵심 표현: I like / I don't like / Let's / How about
 *
 * 대화 흐름:
 * 0: 영화 안 본 지 오래됐다면서 영화 좋아하냐고 질문
 * 1: 학생 대답에 반응 + 제일 좋아하는 영화가 뭔지 물어보기
 * 2: 학생 대답에 반응 + 영화관 가는 것도 좋아하는지 질문
 * 3: 학생 대답에 반응 + 이번 주말에 영화 보러 가자고 제안
 * 4: 학생 좋다고 하면 시간 물어보기 / 싫다고 하면 에이 그러지 말고 같이 가자~ 언제가 좋은지 물어보기
 * 5: 학생 좋다고 하면 그때 보자 하고 인사 / 싫다고 하면 어쩔 수 없지, 다음에 가자 하고 마무리
 */

import type { ErrorLogItem, SummaryItem } from './realTalk6Types';

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

/** Cathy 첫 대사: 영화 안 본 지 오래됐다 + 영화 좋아하냐고 */
const CATHY_FIRST_PHRASE = "It's been a long time since I watched a movie. Do you like movies?";
const CATHY_FIRST_PHRASE_KO = '영화 본 지 오래됐어. 영화 좋아해?';

/** Cathy 기본 시퀀스 (긍정 흐름) */
const CATHY_PHRASES: { en: string; ko: string }[] = [
  { en: "It's been a long time since I watched a movie. Do you like movies?", ko: '영화 본 지 오래됐어. 영화 좋아해?' },
  { en: "Cool! What's your favorite movie?", ko: '좋아! 제일 좋아하는 영화 뭐야?' },
  { en: "Nice! Do you like going to the movie theater?", ko: '좋다! 영화관 가는 거 좋아해?' },
  { en: "Me too! How about we go see a movie this weekend?", ko: '나도! 이번 주말에 영화 보러 갈래?' },
  { en: "Great! What time works for you?", ko: '좋아! 몇 시가 좋아?' },
  { en: "See you then! Bye!", ko: '그때 보자! 잘 가!' },
];

/** Turn 4: 학생이 싫다고 한 경우 */
const CATHY_TURN4_NO: { en: string; ko: string } = {
  en: "Come on, let's go together! When would be good for you?",
  ko: '에이 그러지 말고 같이 가자! 언제가 좋아?',
};

/** Turn 5: 학생이 싫다고 한 경우 */
const CATHY_TURN5_NO: { en: string; ko: string } = {
  en: "That's okay. Let's go next time. Bye!",
  ko: '괜찮아. 다음에 가자. 잘 가!',
};

function isPositiveResponse(t: string): boolean {
  const pos = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'love', 'like', 'great', 'cool', 'lets', "let's", 'saturday', 'sunday', 'morning', 'afternoon', 'evening', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  return pos.some((w) => t.includes(w));
}

function isNegativeResponse(t: string): boolean {
  const neg = ['no', 'not', "don't", 'dont', 'cant', "can't", 'sorry', 'busy', 'maybe', 'later', 'next'];
  return neg.some((w) => t.includes(w));
}

/** 공통 문법/맞춤법 오류 감지 - 모든 턴에 적용 (API 미사용 시 Mock 폴백) */
function checkCommonGrammarErrors(t: string, userTurnIndex: number): { sentence: string; explanation: string } | null {
  const isNeg = t.includes('no') || t.includes("don't") || t.includes('dont') || t.includes('not');
  // movies 오타
  if (/\bmoives\b|\bmovis\b|\bmoive\b|\bmoovies\b|\bmoviee\b|\bmovise\b|\bmvoies\b/i.test(t)) {
    return { sentence: isNeg ? "I don't like movies." : "I like movies.", explanation: '"movies"는 m-o-v-i-e-s로 써요.' };
  }
  // like 오타
  if (/\bliek\b|\blaik\b|\blik\b/i.test(t)) {
    return { sentence: isNeg ? "I don't like it." : "I like it.", explanation: '"like"는 l-i-k-e로 써요.' };
  }
  // I no like / I not like
  if (/\bno\s+like\b|\bnot\s+like\b/i.test(t)) {
    return { sentence: isNeg ? "I don't like movies." : "I like movies.", explanation: '"don\'t"는 do not을 줄인 말이에요. apostrophe(\')를 붙여요.' };
  }
  // lets (let's 오타)
  if (/\blets\b/.test(t) && !t.includes("let's")) {
    return { sentence: "Yes, let's go!", explanation: '"let\'s"는 let us를 줄인 말이에요. apostrophe(\')를 붙여요.' };
  }
  // cant (can't 오타)
  if (/\bcant\b/.test(t) && !t.includes("can't")) {
    return { sentence: "No, I can't.", explanation: '"can\'t"는 can과 not을 줄인 말이에요. apostrophe(\')를 붙여요.' };
  }
  // dont (don't 오타) - 문맥상 like/don't like 또는 Turn 3 거절
  if (/\bdont\b/.test(t) && !t.includes("don't") && (t.includes('like') || userTurnIndex <= 3)) {
    const sentence = userTurnIndex === 3 && isNeg ? "No, I can't." : isNeg ? "I don't like movies." : "I like movies.";
    return { sentence, explanation: '"don\'t"는 do not을 줄인 말이에요. apostrophe(\')를 붙여요.' };
  }
  // 시간/날짜 오타 (Turn 4)
  if (userTurnIndex === 4) {
    if (/\bsaterday\b|\bsundey\b|\bmornig\b|\bafternon\b|\beveing\b/i.test(t)) {
      return { sentence: t.includes('sundey') ? "How about Sunday afternoon?" : "How about Saturday afternoon?", explanation: '"Saturday"는 S-a-t-u-r-d-a-y, "afternoon"은 a-f-t-e-r-n-o-o-n으로 써요.' };
    }
  }
  return null;
}

/** Mock: 사용자 발화 평가. userTurnIndex 0-5 */
export function evaluateUserUtterance(
  userText: string,
  _expectedContext: string,
  userTurnIndex: number
): AIEvaluationResult {
  const t = userText.trim().toLowerCase();
  const nextCathyIdx = userTurnIndex + 1;

  if (!t) {
    const prev = CATHY_PHRASES[Math.max(0, nextCathyIdx - 1)];
    return {
      cathyPhrase: prev?.en ?? CATHY_FIRST_PHRASE,
      cathyPhraseKo: prev?.ko ?? CATHY_FIRST_PHRASE_KO,
      isMainDialogue: false,
      isLastTurn: nextCathyIdx >= 6,
    };
  }

  // 질문형 발화 → 오프토픽
  const isQuestionLike = (q: string) => {
    if (q.endsWith('?')) return true;
    const qWords = ['what', 'how', 'where', 'why', 'when', 'who', 'how much', 'how many'];
    return qWords.some((w) => q.includes(w));
  };
  if (isQuestionLike(t) && userTurnIndex >= 1 && userTurnIndex <= 5) {
    const redirects: Record<number, { en: string; ko: string }> = {
      1: { en: "Cool! What's your favorite movie?", ko: '좋아! 제일 좋아하는 영화 뭐야?' },
      2: { en: "Nice! Do you like going to the movie theater?", ko: '좋다! 영화관 가는 거 좋아해?' },
      3: { en: "Me too! How about we go see a movie this weekend?", ko: '나도! 이번 주말에 영화 보러 갈래?' },
      4: { en: "Great! What time works for you?", ko: '좋아! 몇 시가 좋아?' },
      5: { en: "See you then! Bye!", ko: '그때 보자! 잘 가!' },
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

  // 공통 문법 검사 (모든 턴에 적용)
  const grammarErr = checkCommonGrammarErrors(t, userTurnIndex);
  if (grammarErr) {
    return {
      cathyPhrase: "Nice try! Say it like this.",
      cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
      isMainDialogue: false,
      correction: { type: 'grammar' as const, sentence: grammarErr.sentence, explanation: grammarErr.explanation },
    };
  }

  // Turn 0: 영화 좋아하냐고 → I like / I don't like 등
  if (userTurnIndex === 0) {
    const hasLike = t.includes('like') || t.includes('love') || t.includes('yes') || t.includes('yeah') || t.includes('no') || t.includes("don't") || t.includes('dont');
    const isNegative = t.includes('no') || t.includes("don't") || t.includes('dont') || t.includes('not');

    if (!hasLike && t.length > 2) {
      return {
        cathyPhrase: "Nice try! Say it like this.",
        cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
        isMainDialogue: false,
        correction: {
          type: 'grammar',
          sentence: isNegative ? "I don't like movies." : "I like movies.",
          explanation: '좋아할 때 "I like ~", 싫어할 때 "I don\'t like ~"를 사용해요.',
        },
      };
    }
    if (isNegative) {
      return {
        cathyPhrase: "Oh, I see. So what movie did you watch recently?",
        cathyPhraseKo: '오, 그렇구나. 그럼 최근에 본 영화는 뭐야?',
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
    return {
      cathyPhrase: "Cool! What's your favorite movie?",
      cathyPhraseKo: '좋아! 제일 좋아하는 영화 뭐야?',
      isMainDialogue: true,
      isLastTurn: false,
    };
  }

  // Turn 1: 좋아하는 영화 말하기 (영화 이름 또는 3단어 이상 필요 - "I like"만으로는 부족)
  if (userTurnIndex === 1) {
    const movieWords = ['movie', 'film', 'toy', 'frozen', 'lion', 'spider', 'avenger', 'minion', 'coco', 'inside', 'finding', 'nemo', 'dory', 'moana', 'encanto'];
    const wordCount = t.split(/\s+/).filter(Boolean).length;
    const hasMovie = movieWords.some((w) => t.includes(w));
    const hasEnoughContent = hasMovie || wordCount >= 3;
    if (!hasEnoughContent) {
      return {
        cathyPhrase: "Nice try! Say it like this.",
        cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
        isMainDialogue: false,
        correction: {
          type: 'grammar',
          sentence: "I like Toy Story.",
          explanation: '"I like + 영화 이름"으로 말해요.',
        },
      };
    }
    return {
      cathyPhrase: "Nice! Do you like going to the movie theater?",
      cathyPhraseKo: '좋다! 영화관 가는 거 좋아해?',
      isMainDialogue: true,
      isLastTurn: false,
    };
  }

  // Turn 2: 영화관 가는 거 좋아하는지
  if (userTurnIndex === 2) {
    const hasLike = t.includes('like') || t.includes('love') || t.includes('yes') || t.includes('yeah') || t.includes('no') || t.includes("don't") || t.includes('dont');
    if (!hasLike && t.length > 2) {
      return {
        cathyPhrase: "So close! You can also say!",
        cathyPhraseKo: '거의 다 왔어! 이렇게도 말해볼 수 있어!',
        isMainDialogue: false,
        correction: {
          type: 'naturalness',
          sentence: t.includes('no') ? "I don't like it." : "I like it.",
          explanation: '좋아할 때 "I like it.", 싫어할 때 "I don\'t like it."를 사용해요.',
        },
      };
    }
    return {
      cathyPhrase: "Me too! How about we go see a movie this weekend?",
      cathyPhraseKo: '나도! 이번 주말에 영화 보러 갈래?',
      isMainDialogue: true,
      isLastTurn: false,
    };
  }

  // Turn 3: 주말에 영화 보러 갈래? → yes/no
  if (userTurnIndex === 3) {
    const saidYes = isPositiveResponse(t);
    const saidNo = isNegativeResponse(t);
    if (!saidYes && !saidNo && t.length > 2) {
      return {
        cathyPhrase: "Nice try! Say it like this.",
        cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
        isMainDialogue: false,
        correction: {
          type: 'grammar',
          sentence: saidNo ? "No, I can't." : "Yes, let's go!",
          explanation: '동의할 때 "Yes, let\'s go!" / "Let\'s!" 거절할 때 "No, I can\'t." / "I don\'t think so."를 사용해요.',
        },
      };
    }
    if (saidNo) {
      return {
        cathyPhrase: CATHY_TURN4_NO.en,
        cathyPhraseKo: CATHY_TURN4_NO.ko,
        isMainDialogue: true,
        isLastTurn: false,
      };
    }
    return {
      cathyPhrase: "Great! What time works for you?",
      cathyPhraseKo: '좋아! 몇 시가 좋아?',
      isMainDialogue: true,
      isLastTurn: false,
    };
  }

  // Turn 4: 시간 물어보기 → 학생이 시간 말하거나 / (거절한 경우) 언제가 좋은지
  if (userTurnIndex === 4) {
    const saidNoAt3 = false; // Mock에서는 이전 턴 추적 어려움. 시간/날짜 말하면 긍정으로 처리
    const hasTimeOrDate = /\d|saturday|sunday|morning|afternoon|evening|weekend|next\s+(week|weekend|saturday|sunday)/.test(t) || t.length >= 3;
    // "next week", "next weekend" = 긍정(언제 갈지 제안). "no", "next time", "maybe" = 부정
    const isNegativeForTurn4 = isNegativeResponse(t) && !/next\s+(week|weekend|saturday|sunday)/.test(t);
    if (saidNoAt3 || isNegativeForTurn4) {
      return {
        cathyPhrase: CATHY_TURN5_NO.en,
        cathyPhraseKo: CATHY_TURN5_NO.ko,
        isMainDialogue: true,
        isLastTurn: true,
      };
    }
    if (!hasTimeOrDate && t.length > 2) {
      return {
        cathyPhrase: "So close! You can also say!",
        cathyPhraseKo: '거의 다 왔어! 이렇게도 말해볼 수 있어!',
        isMainDialogue: false,
        correction: {
          type: 'naturalness',
          sentence: "How about Saturday afternoon?",
          explanation: '"How about + 시간/날짜?"로 제안해요.',
        },
      };
    }
    // 긍정: 학생 말에 반응 + 그때 보자! 안녕!
    const timeWord = t.includes('saturday') ? 'Saturday' : t.includes('sunday') ? 'Sunday' : t.includes('next week') ? 'Next week' : t.includes('weekend') ? 'Weekend' : t.includes('afternoon') ? 'Afternoon' : t.includes('morning') ? 'Morning' : '';
    const timeWordKo = t.includes('saturday') ? '토요일' : t.includes('sunday') ? '일요일' : t.includes('next week') ? '다음 주' : t.includes('weekend') ? '주말' : t.includes('afternoon') ? '오후' : t.includes('morning') ? '오전' : '';
    const react = timeWord ? `${timeWord}! ` : 'Great! ';
    const reactKo = timeWordKo ? `${timeWordKo}! ` : '좋아! ';
    return {
      cathyPhrase: react + "See you then! Bye!",
      cathyPhraseKo: reactKo + '그때 보자! 안녕!',
      isMainDialogue: true,
      isLastTurn: true,
    };
  }

  // Turn 5: (거절 흐름에서) 언제가 좋은지 물어본 후 → 학생 대답
  if (userTurnIndex === 5) {
    return {
      cathyPhrase: "See you then! Bye!",
      cathyPhraseKo: '그때 보자! 안녕!',
      isMainDialogue: true,
      isLastTurn: true,
    };
  }

  // 주제 이탈
  const topicWords = ['movie', 'like', 'cinema', 'theater', 'go', 'weekend', 'time', 'yes', 'no', 'lets', 'how about'];
  const onTopic = topicWords.some((w) => t.includes(w));
  if (!onTopic && t.length > 3) {
    const nextPhrase = userTurnIndex >= 4 ? CATHY_TURN5_NO : CATHY_PHRASES[Math.min(nextCathyIdx, CATHY_PHRASES.length - 1)];
    return {
      cathyPhrase: nextPhrase.en,
      cathyPhraseKo: nextPhrase.ko,
      isMainDialogue: false,
      isOffTopic: true,
      isLastTurn: nextCathyIdx >= 6,
    };
  }

  const nextPhrase = CATHY_PHRASES[Math.min(nextCathyIdx, CATHY_PHRASES.length - 1)];
  return {
    cathyPhrase: nextPhrase.en,
    cathyPhraseKo: nextPhrase.ko,
    isMainDialogue: true,
    isLastTurn: nextCathyIdx >= 6,
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
      ? '오늘 영화 대화 정말 잘했어요! I like, Let\'s 같은 표현을 잘 썼어요.'
      : '조금 더 연습하면 더 좋아질 거예요. 화이팅!';
  return {
    topicRelevanceScore: topicScore,
    expressionScore: exprScore,
    overallFeedback: feedback,
  };
}
