/**
 * Real Talk 3 – 인덱스 47
 * 세션 평가: 주제 적합도, 표현 적절성 (별점), 총평 (한국어).
 * Gemini API로 평가, 로딩 중에는 로딩 표시.
 */

import { useEffect } from 'react';
import { TOPIC_TEXT } from '../App';
import { evaluateSession } from '../realTalk3Gemini';
import type { ErrorLogItem, SessionEvaluation, SummaryItem } from '../realTalk3Types';

const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function StarRow({ filled }: { filled: number }) {
  return (
    <div className="recap-star-row" role="img" aria-label={`${filled}점`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= filled ? 'recap-star recap-star--filled' : 'recap-star recap-star--empty'}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={STAR_PATH} />
          </svg>
        </span>
      ))}
    </div>
  );
}

type RealTalk3EvaluationScreenProps = {
  evaluation: SessionEvaluation | null;
  onEvaluationLoaded: (e: SessionEvaluation) => void;
  conversationSummary: SummaryItem[];
  errorLog: ErrorLogItem[];
  onNext: () => void;
};

export function RealTalk3EvaluationScreen({
  evaluation,
  onEvaluationLoaded,
  conversationSummary,
  errorLog,
  onNext,
}: RealTalk3EvaluationScreenProps) {
  useEffect(() => {
    if (evaluation === null) {
      evaluateSession(conversationSummary, errorLog).then(onEvaluationLoaded);
    }
  }, [evaluation, conversationSummary, errorLog, onEvaluationLoaded]);

  if (evaluation === null) {
    return (
      <div className="screen-content screen-content--step3-colors-no-frame" data-screen="47">
        <div className="screen-center">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
          <div className="screen-main screen-main--vertical-center recap-main">
            <p className="recap-summary-feedback">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="47">
      <div className="screen-center">
        <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        <div className="screen-main screen-main--vertical-center recap-main">
          <div className="recap-summary">
            <h2 className="recap-summary-heading">Speaking Summary</h2>
            <section className="recap-summary-item">
              <span className="recap-summary-label-frame">Topic Match</span>
              <StarRow filled={evaluation.topicRelevanceScore} />
            </section>
            <section className="recap-summary-item">
              <span className="recap-summary-label-frame">Expression Usage</span>
              <StarRow filled={evaluation.expressionScore} />
            </section>
            <section className="recap-summary-item">
              <span className="recap-summary-label-frame">Overall Feedback</span>
              <div className="recap-summary-feedback-wrap">
                {evaluation.overallFeedback
                  .split(/(?<=[.!?。])\s*/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((line, i) => (
                    <p key={i} className="recap-summary-feedback">
                      {line}
                    </p>
                  ))}
              </div>
            </section>
          </div>
        </div>
        <div className="screen-bottom" style={{ paddingTop: '1rem' }}>
          <button
            type="button"
            className="realtalk-go-btn"
            onClick={onNext}
            aria-label="다음으로"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
