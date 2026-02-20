/**
 * Real Talk 3 – 인덱스 48
 * 에러 리뷰: Selena's Secret Tip 레이아웃. More Natural / Say It Better 헤드.
 * 원문(진한 회색, 교정된 부분 취소선) 줄바꿈 (→) 교정문(보라색, 교정된 부분 분홍색).
 */

import { useCallback, useMemo } from 'react';
import { diffWords, type Change } from 'diff';
import { TOPIC_TEXT } from '../App';
import { getCorrectionPracticeItems, selectErrorsForReview } from '../realTalk3Types';
import type { ErrorLogItem } from '../realTalk3Types';

const HEADER_BY_TYPE: Record<ErrorLogItem['errorType'], string> = {
  naturalness: 'More Natural',
  grammar: 'Say It Better',
  'off-topic': 'Stay On Topic',
};

/**
 * 분홍색 작은 별 아이콘
 */
const STAR_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="recap-error-star-icon" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

function ErrorDiffDisplay({
  original,
  corrected,
  explanation,
}: {
  original: string;
  corrected: string;
  explanation?: string;
}) {
  const changes = useMemo(() => diffWords(original, corrected), [original, corrected]);

  const originalParts = useMemo(() => {
    return changes.filter((c: Change) => !c.added).map((c: Change, i: number) => ({
      key: `orig-${i}`,
      value: c.value,
      removed: c.removed ?? false,
    }));
  }, [changes]);

  const correctedParts = useMemo(() => {
    return changes.filter((c: Change) => !c.removed).map((c: Change, i: number) => ({
      key: `corr-${i}`,
      value: c.value,
      added: c.added ?? false,
    }));
  }, [changes]);

  return (
    <div className="recap-error-item">
      <p className="recap-tip-text recap-error-diff">
        <span className="recap-error-original">
          {originalParts.map(({ key, value, removed }: { key: string; value: string; removed: boolean }) =>
            removed ? (
              <span key={key} className="recap-error-strike">
                {value}
              </span>
            ) : (
              <span key={key}>{value}</span>
            )
          )}
        </span>
        <br />
        <span className="recap-error-arrow">→</span>{' '}
        <span className="recap-error-corrected">
          {correctedParts.map(({ key, value, added }: { key: string; value: string; added: boolean }) =>
            added ? (
              <span key={key} className="recap-error-highlight">
                {value}
              </span>
            ) : (
              <span key={key}>{value}</span>
            )
          )}
        </span>
      </p>
      {explanation && (
        <p className="recap-error-explanation">
          <span className="recap-error-star">{STAR_SVG}</span>
          {explanation}
        </p>
      )}
    </div>
  );
}

type RealTalk3ErrorReviewScreenProps = {
  errorLog: ErrorLogItem[];
  onNext: () => void;
};

export function RealTalk3ErrorReviewScreen({ errorLog, onNext }: RealTalk3ErrorReviewScreenProps) {
  const items = selectErrorsForReview(errorLog, 5);
  const practiceItems = useMemo(() => getCorrectionPracticeItems(errorLog), [errorLog]);
  const hasPractice = practiceItems.length > 0;

  const grouped = useMemo(() => {
    const map = new Map<ErrorLogItem['errorType'], ErrorLogItem[]>();
    for (const item of items) {
      const arr = map.get(item.errorType) ?? [];
      arr.push(item);
      map.set(item.errorType, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  const handleClick = useCallback(() => {
    onNext();
  }, [onNext]);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="48">
      <div className="screen-center">
        <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        <div className="screen-main screen-main--vertical-center recap-main">
          <div className="recap-tips">
            <h2 className="recap-summary-heading">Selena&apos;s Secret Tip</h2>
            {items.length === 0 ? (
              <p className="realtalk2-model-text main-text--gradient-sequential" style={{ fontSize: '1.1rem' }}>
                Perfect! 오늘 대화 내용은 완벽했어요!
              </p>
            ) : (
              grouped.map(([errorType, groupItems]) => (
                <section key={errorType} className="recap-tip-item">
                  <span className="recap-summary-label-frame">{HEADER_BY_TYPE[errorType]}</span>
                  {groupItems.map((item, idx) => (
                    <ErrorDiffDisplay
                      key={idx}
                      original={item.original}
                      corrected={item.corrected}
                      explanation={item.explanation}
                    />
                  ))}
                </section>
              ))
            )}
          </div>
        </div>
        <div className="screen-bottom" style={{ paddingTop: '1rem' }}>
          {hasPractice ? (
            <button
              type="button"
              className="realtalk-go-btn"
              onClick={handleClick}
              aria-label="연습하기"
            >
              Let&apos;s Practice
            </button>
          ) : (
            <button
              type="button"
              className="realtalk-go-btn"
              onClick={handleClick}
              aria-label="다음으로"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
