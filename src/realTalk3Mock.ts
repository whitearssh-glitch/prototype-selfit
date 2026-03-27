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

/** Mock: Cathy 대사 시퀀스. 턴0 greeting / 턴1-4 받아주기+질문 / 턴5 활동 기반 제안형 마무리. 짧은 반응(Oh! Wow! Nice!) 포함. */
const CATHY_PHRASES: { en: string; ko: string }[] = [
  { en: "Hi! I'm Cathy. Nice to meet you!", ko: '안녕! 나는 캐시야. 만나서 반가워!' },
  { en: "Oh! Nice to meet you too! What's your name?", ko: '나도 만나서 반가워! 네 이름은 뭐야?' },
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

  // Turn 0: 사용자 인사에 따라 Cathy Turn 1 응답 다르게
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
      isLastTurn: nextCathyIdx >= 5,
    };
  }

  // Turn 1~4: 질문형 발화 → 오프토픽. Cathy가 질문에 답하고 주제로 다시 이끔 (교정 X)
  const isQuestionLike = (q: string) => {
    if (q.endsWith('?')) return true;
    if (q.startsWith('i ') || q.startsWith("i'm ") || q.startsWith('i am ') || q.startsWith('my ')) return false;
    const qWords = ['what', 'how', 'where', 'why', 'when', 'who', 'doing', 'going', 'do you', 'are you'];
    return qWords.some((w) => q.includes(w));
  };
  const isQuestion = isQuestionLike(t);
  if (isQuestion && userTurnIndex >= 1 && userTurnIndex <= 4) {
    const redirects: Record<number, { en: string; ko: string }> = {
      1: { en: "I'm Cathy! Nice to meet you! What's your name?", ko: '나는 캐시야! 만나서 반가워! 네 이름은 뭐야?' },
      2: { en: "I'm eight! How old are you?", ko: '나는 여덟 살이야! 몇 살이야?' },
      3: { en: "I'm good! How are you feeling today?", ko: '나 괜찮아! 오늘 기분은 어때?' },
      4: { en: "I like soccer! What do you do after school?", ko: '나는 축구 좋아해! 학교 끝나고 뭘 해?' },
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

  // 맥락 부자연스러움 (예: "I have eight years" → "I'm eight years old")
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

  // 기분 턴: "I feeling good" → "I'm feeling good"
  if (userTurnIndex === 3 && t.includes('feeling') && !t.includes("i'm") && !t.includes('i am')) {
    return {
      cathyPhrase: "Nice try! Say it like this.",
      cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
      isMainDialogue: false,
      correction: {
        type: 'grammar',
        sentence: "I'm feeling good.",
        explanation: '"I\'m feeling" 또는 "I feel"를 사용해요.',
      },
    };
  }

  // 기분 턴: "I am feel good" → "I feel good"
  if (userTurnIndex === 3 && t.includes('am') && t.includes('feel') && !t.includes('ing')) {
    const feelMatch = t.match(/feel\s+(\w+)/);
    const feelWord = feelMatch ? feelMatch[1] : 'good';
    return {
      cathyPhrase: "Nice try! Say it like this.",
      cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
      isMainDialogue: false,
      correction: {
        type: 'grammar',
        sentence: `I feel ${feelWord}.`,
        explanation: '"I feel" 뒤에는 feel 그대로 써요.',
      },
    };
  }

  // 턴4: 문법/자연스러운 맥락 교정은 API에 위임 (특정 패턴 제거). Mock은 API 미연결 시 정상 응답만
  // 턴4(마지막): 사용자 활동 에코 + 제안형 마무리 (짧은 반응 포함)
  if (userTurnIndex === 4) {
    const activityMap: { word: string; phrase: string; ko: string }[] = [
      { word: 'restaurant', phrase: "Restaurant! That sounds delicious! Let's go to a restaurant together next time!", ko: '맛집! 맛있겠다! 다음에 같이 맛집 가자!' },
      { word: 'food', phrase: "Food! That sounds delicious! Let's eat together next time!", ko: '맛있는 거! 맛있겠다! 다음에 같이 먹자!' },
      { word: 'eat', phrase: "Eating! That sounds delicious! Let's eat together next time!", ko: '먹기! 맛있겠다! 다음에 같이 먹자!' },
      { word: 'soccer', phrase: "Soccer! That sounds fun! Let's play together next time!", ko: '축구! 재밌겠다! 다음에 같이 하자!' },
      { word: 'football', phrase: "Football! That sounds fun! Let's play together next time!", ko: '축구! 재밌겠다! 다음에 같이 하자!' },
      { word: 'draw', phrase: "Drawing! That sounds creative! Let's draw together next time!", ko: '그리기! 창의적이겠다! 다음에 같이 그리자!' },
      { word: 'paint', phrase: "Painting! That sounds creative! Let's draw together next time!", ko: '그리기! 창의적이겠다! 다음에 같이 그리자!' },
      { word: 'swim', phrase: "Swimming! That sounds fun! Let's swim together next time!", ko: '수영! 재밌겠다! 다음에 같이 수영하자!' },
      { word: 'read', phrase: "Reading! That sounds creative! Let's read together next time!", ko: '읽기! 좋겠다! 다음에 같이 읽자!' },
    ];
    const match = activityMap.find((a) => t.includes(a.word));
    const closing = match ? match.phrase : "Nice! Let's talk again next time!";
    const closingKo = match ? match.ko : '좋아! 다음에 또 얘기하자!';
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

  // Turn 1: 사용자 이름 에코 + 짧은 반응
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
      isLastTurn: nextCathyIdx >= 5,
    };
  }

  // Turn 2: 사용자 나이 에코 + 짧은 반응
  if (userTurnIndex === 2) {
    const ageMatch = t.match(/\b(\d+)\b|(eight|seven|nine|ten|eleven|six)/i);
    const age = ageMatch ? (ageMatch[1] || ageMatch[2]?.toLowerCase() || 'eight') : 'eight';
    const ageCap = String(age).charAt(0).toUpperCase() + String(age).slice(1);
    return {
      cathyPhrase: `${ageCap}! That's cool! How are you feeling?`,
      cathyPhraseKo: `${age}! 멋져! 오늘 기분은 어때?`,
      isMainDialogue: true,
      isLastTurn: nextCathyIdx >= 5,
    };
  }

  // Turn 3: 사용자 기분 에코 + 다양한 반응 (that sounds X 사용 안 함)
  if (userTurnIndex === 3) {
    const feelingWords = ['good', 'great', 'happy', 'tired', 'sad', 'hungry', 'excited', 'ok', 'okay', 'fine', 'sleepy'];
    let feeling = 'good';
    for (const w of feelingWords) {
      if (t.includes(w)) {
        feeling = w;
        break;
      }
    }
    const feelMap: Record<string, { en: string; ko: string }[]> = {
      good: [
        { en: "Good! I'm glad! What do you do after school?", ko: '좋아! 다행이야! 학교 끝나고 뭘 해?' },
        { en: "Good! Nice! What do you do after school?", ko: '좋아! 좋아! 학교 끝나고 뭘 해?' },
      ],
      great: [
        { en: "Great! I'm glad! What do you do after school?", ko: '멋져! 다행이야! 학교 끝나고 뭘 해?' },
      ],
      happy: [
        { en: "Happy! I'm glad! What do you do after school?", ko: '행복해! 다행이야! 학교 끝나고 뭘 해?' },
        { en: "Happy! Nice! What do you do after school?", ko: '행복해! 좋아! 학교 끝나고 뭘 해?' },
      ],
      tired: [
        { en: "Tired? Hope you feel better! What do you do after school?", ko: '피곤해? 빨리 나아! 학교 끝나고 뭘 해?' },
      ],
      hungry: [
        { en: "Hungry! Let's eat soon! What do you do after school?", ko: '배고파! 빨리 먹자! 학교 끝나고 뭘 해?' },
      ],
      excited: [
        { en: "Excited! Cool! What do you do after school?", ko: '신나! 멋져! 학교 끝나고 뭘 해?' },
      ],
      ok: [{ en: "Okay! Nice! What do you do after school?", ko: '괜찮아! 좋아! 학교 끝나고 뭘 해?' }],
      okay: [{ en: "Okay! Nice! What do you do after school?", ko: '괜찮아! 좋아! 학교 끝나고 뭘 해?' }],
      fine: [{ en: "Fine! Nice! What do you do after school?", ko: '괜찮아! 좋아! 학교 끝나고 뭘 해?' }],
      sleepy: [{ en: "Sleepy? Hope you feel better! What do you do after school?", ko: '졸려? 빨리 나아! 학교 끝나고 뭘 해?' }],
      sad: [{ en: "Hope you feel better! What do you do after school?", ko: '빨리 나아! 학교 끝나고 뭘 해?' }],
    };
    const list = feelMap[feeling] || feelMap.good;
    const phrase = list[Math.floor(Math.random() * list.length)];
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
