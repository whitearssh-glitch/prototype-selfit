/**
 * Real Talk 7 – 에러 리뷰 (Ordering Hamburgers)
 */

import { useCallback, useMemo } from 'react';
import { diffWords, type Change } from 'diff';
import { getCorrectionPracticeItems, selectErrorsForReview } from '../realTalk7Types';
import type { ErrorLogItem } from '../realTalk7Types';

const REALTALK7_TOPIC = 'TOPIC: Ordering Hamburgers';
const HEADER_BY_TYPE: Record<'grammar' | 'naturalness' | 'off-topic' | 'context', string> = {
  naturalness: 'More Natural',
  grammar: 'Say It Better',
  'off-topic': 'Stay on Topic',
  context: 'Match the Question',
};

const STAR_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="recap-error-star-icon" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

function ErrorDiffDisplay({
  original,
  corrected,
  explanation,
  errorType,
}: {
  original: string;
  corrected: string;
  explanation?: string;
  errorType: 'grammar' | 'naturalness' | 'off-topic' | 'context';
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
  const hasRemoved = originalParts.some((p) => p.removed);
  const showFullStrike = errorType === 'grammar' && !hasRemoved;

  return (
    <div className="recap-error-item">
      <p className="recap-tip-text recap-error-diff">
        <span className="recap-error-original">
          {showFullStrike ? (
            <span className="recap-error-strike">{original}</span>
          ) : (
            originalParts.map(({ key, value, removed }: { key: string; value: string; removed: boolean }) =>
              removed ? (
                <span key={key} className="recap-error-strike">{value}</span>
              ) : (
                <span key={key}>{value}</span>
              )
            )
          )}
        </span>
        <br />
        <span className="recap-error-arrow">→</span>{' '}
        <span className="recap-error-corrected">
          {correctedParts.map(({ key, value, added }: { key: string; value: string; added: boolean }) =>
            added ? (
              <span key={key} className="recap-error-highlight">{value}</span>
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

type RealTalk7ErrorReviewScreenProps = {
  errorLog: ErrorLogItem[];
  onNext: () => void;
};

export function RealTalk7ErrorReviewScreen({ errorLog, onNext }: RealTalk7ErrorReviewScreenProps) {
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

  const handleClick = useCallback(() => onNext(), [onNext]);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="rt7-error-review">
      <div className="screen-center">
        <div className="topic-box topic-box--step3">{REALTALK7_TOPIC}</div>
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
                      errorType={item.errorType}
                    />
                  ))}
                </section>
              ))
            )}
          </div>
        </div>
        <div className="screen-bottom" style={{ paddingTop: '1rem' }}>
          {hasPractice ? (
            <button type="button" className="realtalk-go-btn" onClick={handleClick} aria-label="연습하기">
              Let&apos;s Practice
            </button>
          ) : (
            <button type="button" className="realtalk-go-btn" onClick={handleClick} aria-label="다음으로">
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
