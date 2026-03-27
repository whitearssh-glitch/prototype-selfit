/**
 * Real Talk 5 – OpenAI API 연동 (Meet New Friends)
 * /api/realtalk5-evaluate, /api/realtalk5-session-evaluate 호출.
 * API 실패 시 mock으로 fallback.
 */

import {
  evaluateUserUtterance as mockEvaluateUserUtterance,
  evaluateSession as mockEvaluateSession,
  getCathyFirstPhrase,
} from './realTalk5Mock';
import type { ErrorLogItem, SummaryItem } from './realTalk5Types';

console.log('[OpenAI API] Real Talk 5 AI 모듈 로드됨');
fetch('/api/realtalk5-available')
  .then((r) => r.json())
  .then((d) => console.log('[OpenAI API] Real Talk 5 연결 상태:', d?.available ? '연결됨 ✓' : '연결 안 됨 (mock 사용)'))
  .catch((e) => console.warn('[OpenAI API] Real Talk 5 연결 확인 실패:', e));

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

let apiAvailable: boolean | null = null;

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
    const res = await fetch('/api/realtalk5-available');
    const data = await res.json();
    apiAvailable = Boolean(data?.available);
    return apiAvailable;
  } catch (e) {
    apiAvailable = false;
    return false;
  }
}

export async function evaluateUserUtterance(
  userText: string,
  conversationSummary: SummaryItem[],
  userTurnIndex: number
): Promise<AIEvaluationResult> {
  const useApi = await checkApiAvailable();
  if (!useApi) {
    return mockEvaluateUserUtterance(userText, '', userTurnIndex);
  }
  try {
    const res = await fetchWithRetry('/api/realtalk5-evaluate', {
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
      if (data?.useMock) return mockEvaluateUserUtterance(userText, '', userTurnIndex);
      throw new Error(data?.error || 'API error');
    }
    return normalizeEvaluationResult(data);
  } catch (e) {
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

export async function evaluateSession(
  conversationSummary: SummaryItem[],
  errorLog: ErrorLogItem[]
): Promise<SessionEvaluation> {
  const useApi = await checkApiAvailable();
  if (!useApi) return mockEvaluateSession(conversationSummary, errorLog);
  try {
    const res = await fetchWithRetry('/api/realtalk5-session-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationSummary, errorLog }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data?.useMock) return mockEvaluateSession(conversationSummary, errorLog);
      throw new Error(data?.error || 'API error');
    }
    return {
      topicRelevanceScore: Math.max(1, Math.min(5, Number(data.topicRelevanceScore) || 5)),
      expressionScore: Math.max(1, Math.min(5, Number(data.expressionScore) || 5)),
      overallFeedback: String(data.overallFeedback ?? ''),
    };
  } catch (e) {
    return mockEvaluateSession(conversationSummary, errorLog);
  }
}

export async function evaluateCorrectionPractice(
  userText: string,
  correctSentence: string
): Promise<{ isCorrect: boolean }> {
  const useApi = await checkApiAvailable();
  if (!useApi) return { isCorrect: isSimilarLocal(userText, correctSentence) };
  try {
    const res = await fetchWithRetry('/api/realtalk5-correction-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct: correctSentence, userText }),
    });
    const data = await res.json();
    if (!res.ok) return { isCorrect: isSimilarLocal(userText, correctSentence) };
    return { isCorrect: Boolean(data?.isCorrect) };
  } catch (e) {
    return { isCorrect: isSimilarLocal(userText, correctSentence) };
  }
}

function isSimilarLocal(said: string, expected: string): boolean {
  const a = said.toLowerCase().replace(/[.!?,]/g, '').trim();
  const b = expected.toLowerCase().replace(/[.!?,]/g, '').trim();
  if (a === b) return true;
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  const matchCount = aWords.filter((w) => bWords.includes(w)).length;
  return matchCount / Math.max(bWords.length, 1) >= 0.7;
}

export { getCathyFirstPhrase };
