/**
 * Real Talk 3 – OpenAI API 연동
 * /api/realtalk3-evaluate, /api/realtalk3-session-evaluate 호출.
 * API 실패 시 mock으로 fallback.
 */

import {
  evaluateUserUtterance as mockEvaluateUserUtterance,
  evaluateSession as mockEvaluateSession,
  getCathyFirstPhrase,
} from './realTalk3Mock';
import type { ErrorLogItem, SummaryItem } from './realTalk3Types';

// F12 콘솔에서 [OpenAI API] 로그 확인
console.log('[OpenAI API] Real Talk 3 AI 모듈 로드됨');
// 앱 로드 시 연결 상태 확인
fetch('/api/realtalk3-available')
  .then((r) => r.json())
  .then((d) => console.log('[OpenAI API] 연결 상태:', d?.available ? '연결됨 ✓' : '연결 안 됨 (mock 사용)'))
  .catch((e) => console.warn('[OpenAI API] 연결 확인 실패:', e));

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

export type SessionEvaluation = {
  topicRelevanceScore: number;
  expressionScore: number;
  overallFeedback: string;
};

/** API 사용 가능 여부 (캐시) */
let apiAvailable: boolean | null = null;

/** 429 시 최대 1회 재시도 (3초 대기) */
async function fetchWithRetry(url: string, opts: RequestInit): Promise<Response> {
  const res = await fetch(url, opts);
  if (res.status === 429) {
    console.log('[OpenAI API] 429 Rate limit → 3초 후 재시도...');
    await new Promise((r) => setTimeout(r, 3000));
    return fetch(url, opts);
  }
  return res;
}

async function checkApiAvailable(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const res = await fetch('/api/realtalk3-available');
    const data = await res.json();
    apiAvailable = Boolean(data?.available);
    console.log('[OpenAI API] /api/realtalk3-available →', apiAvailable ? '연결됨 ✓' : '연결 안 됨 (mock 사용)');
    return apiAvailable;
  } catch (e) {
    apiAvailable = false;
    console.log('[OpenAI API] /api/realtalk3-available 요청 실패 → mock 사용', e);
    return false;
  }
}

/** 사용자 발화 평가 (Gemini API, 실패 시 mock) */
export async function evaluateUserUtterance(
  userText: string,
  conversationSummary: SummaryItem[],
  userTurnIndex: number
): Promise<AIEvaluationResult> {
  const useApi = await checkApiAvailable();
  if (!useApi) {
    console.log('[OpenAI API] evaluateUserUtterance → mock 사용 (API 미연결)');
    return mockEvaluateUserUtterance(userText, '', userTurnIndex);
  }
  try {
    console.log('[OpenAI API] evaluateUserUtterance → API 호출 중...', { userText: userText.slice(0, 30), userTurnIndex });
    const res = await fetchWithRetry('/api/realtalk3-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userText,
        conversationSummary,
        userTurnIndex,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn('[OpenAI API] evaluateUserUtterance 실패 → mock fallback', { status: res.status, error: String(data?.error || '').slice(0, 80) });
      if (data?.useMock) {
        return mockEvaluateUserUtterance(userText, '', userTurnIndex);
      }
      throw new Error(data?.error || 'API error');
    }
    console.log('[OpenAI API] evaluateUserUtterance → API 성공 ✓', { cathyPhrase: (data.cathyPhrase || '').slice(0, 40) });
    return normalizeEvaluationResult(data);
  } catch (e) {
    console.warn('[OpenAI API] evaluateUserUtterance 예외 → mock fallback', e);
    return mockEvaluateUserUtterance(userText, '', userTurnIndex);
  }
}

function normalizeEvaluationResult(data: Record<string, unknown>): AIEvaluationResult {
  return {
    cathyPhrase: String(data.cathyPhrase ?? ''),
    cathyPhraseKo: data.cathyPhraseKo != null ? String(data.cathyPhraseKo) : undefined,
    isMainDialogue: Boolean(data.isMainDialogue),
    correction:
      data.correction && typeof data.correction === 'object'
        ? {
            type: (data.correction as { type?: string }).type === 'naturalness' ? 'naturalness' : 'grammar',
            sentence: String((data.correction as { sentence?: string }).sentence ?? ''),
            explanation: (data.correction as { explanation?: string }).explanation,
          }
        : undefined,
    isOffTopic: Boolean(data.isOffTopic),
    isLastTurn: Boolean(data.isLastTurn),
  };
}

/** 세션 평가 (Gemini API, 실패 시 mock) */
export async function evaluateSession(
  conversationSummary: SummaryItem[],
  errorLog: ErrorLogItem[]
): Promise<SessionEvaluation> {
  const useApi = await checkApiAvailable();
  if (!useApi) {
    console.log('[OpenAI API] evaluateSession → mock 사용 (API 미연결)');
    return mockEvaluateSession(conversationSummary, errorLog);
  }
  try {
    console.log('[OpenAI API] evaluateSession → API 호출 중...');
    const res = await fetchWithRetry('/api/realtalk3-session-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationSummary, errorLog }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn('[OpenAI API] evaluateSession 실패 → mock fallback', { status: res.status, error: String(data?.error || '').slice(0, 80) });
      if (data?.useMock) {
        return mockEvaluateSession(conversationSummary, errorLog);
      }
      throw new Error(data?.error || 'API error');
    }
    console.log('[OpenAI API] evaluateSession → API 성공 ✓', { topicScore: data.topicRelevanceScore, exprScore: data.expressionScore });
    return {
      topicRelevanceScore: Math.max(1, Math.min(5, Number(data.topicRelevanceScore) || 5)),
      expressionScore: Math.max(1, Math.min(5, Number(data.expressionScore) || 5)),
      overallFeedback: String(data.overallFeedback ?? ''),
    };
  } catch (e) {
    console.warn('[OpenAI API] evaluateSession 예외 → mock fallback', e);
    return mockEvaluateSession(conversationSummary, errorLog);
  }
}

/** 교정 연습 채점: 사용자 발화 vs 정답 문장 비교. API 실패 시 로컬 isSimilar fallback */
export async function evaluateCorrectionPractice(
  userText: string,
  correctSentence: string
): Promise<{ isCorrect: boolean }> {
  const useApi = await checkApiAvailable();
  if (!useApi) {
    return { isCorrect: isSimilarLocal(userText, correctSentence) };
  }
  try {
    const res = await fetchWithRetry('/api/realtalk3-correction-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct: correctSentence, userText }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn('[OpenAI API] evaluateCorrectionPractice 실패 → 로컬 fallback', { status: res.status });
      return { isCorrect: isSimilarLocal(userText, correctSentence) };
    }
    return { isCorrect: Boolean(data?.isCorrect) };
  } catch (e) {
    console.warn('[OpenAI API] evaluateCorrectionPractice 예외 → 로컬 fallback', e);
    return { isCorrect: isSimilarLocal(userText, correctSentence) };
  }
}

function isSimilarLocal(said: string, expected: string): boolean {
  const a = said
    .toLowerCase()
    .replace(/[.!?,]/g, '')
    .trim();
  const b = expected
    .toLowerCase()
    .replace(/[.!?,]/g, '')
    .trim();
  if (a === b) return true;
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  const matchCount = aWords.filter((w) => bWords.includes(w)).length;
  return matchCount / Math.max(bWords.length, 1) >= 0.7;
}

export { getCathyFirstPhrase };
