/**
 * Real Talk 3 – 공통 타입 및 유틸
 */

export type SummaryItem = {
  speaker: 'Cathy' | 'Me';
  textEn: string;
  textKo?: string;
};

export type ErrorLogItem = {
  original: string;
  corrected: string;
  errorType: 'grammar' | 'naturalness' | 'off-topic';
  explanation?: string;
  turnIndex?: number;
};

export type RealTalk3Data = {
  conversationSummary: SummaryItem[];
  errorLog: ErrorLogItem[];
};

export type SessionEvaluation = {
  topicRelevanceScore: number;
  expressionScore: number;
  overallFeedback: string;
};

/** grammar/naturalness 교정만 필터 (off-topic 제외) */
export function getCorrectionPracticeItems(errorLog: ErrorLogItem[]): ErrorLogItem[] {
  return errorLog.filter((e) => e.errorType === 'grammar' || e.errorType === 'naturalness');
}

/** 에러 리뷰용 최대 5개, 유형별 다양하게 선별. grammar/naturalness만 (off-topic 제외) */
export function selectErrorsForReview(errorLog: ErrorLogItem[], maxCount = 5): ErrorLogItem[] {
  const filtered = errorLog.filter((e) => e.errorType === 'grammar' || e.errorType === 'naturalness');
  if (filtered.length <= maxCount) return [...filtered];
  const byType: Record<'grammar' | 'naturalness', ErrorLogItem[]> = {
    grammar: filtered.filter((e) => e.errorType === 'grammar'),
    naturalness: filtered.filter((e) => e.errorType === 'naturalness'),
  };
  const result: ErrorLogItem[] = [];
  let round = 0;
  while (result.length < maxCount) {
    let added = 0;
    for (const t of ['grammar', 'naturalness'] as const) {
      const arr = byType[t];
      if (round < arr.length && result.length < maxCount) {
        result.push(arr[round]);
        added++;
      }
    }
    if (added === 0) break;
    round++;
  }
  return result;
}
