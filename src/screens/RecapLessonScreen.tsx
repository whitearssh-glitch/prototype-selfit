/**
 * Recap (Step 5) 수업 화면 – 오늘 학습 내용 정리
 * 인덱스 33: Today's Expressions 헤딩 + 표현 프레임, 클릭 시 음원 재생.
 * 인덱스 34: Speaking Summary – 리얼토크 주제 적합도·표현 사용력 평가 (별 레이팅 + 한글 피드백).
 * 인덱스 35: Selena's Secret Tip – 리얼토크 턴2·턴4 피드백 블록 요약. 체크 클릭 → 0.5초 후 GOOD 도장 + fb1.mp3 → 화면 클릭 시 코너 선택으로.
 */

import { useCallback, useState } from 'react';
import { TOPIC_TEXT } from '../App';

const RECAP_GOOD_STAMP_AUDIO = '/fb1.mp3';

const AUDIO_NICE_TO_MEET_YOU = '/nice-to-meet-you.mp3';
const AUDIO_I_AM = '/i-am.mp3';

const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function playAudio(src: string): void {
  const audio = new Audio(src);
  audio.onerror = () => {};
  audio.play().catch(() => {});
}

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

type RecapLessonScreenProps = {
  mainVariant?: 'expressions' | 'summary' | 'tips';
  onNext: () => void;
};

export function RecapLessonScreen({ mainVariant = 'expressions', onNext }: RecapLessonScreenProps) {
  const [showGoodStamp, setShowGoodStamp] = useState(false);
  const playNiceToMeetYou = useCallback(() => playAudio(AUDIO_NICE_TO_MEET_YOU), []);
  const playIAm = useCallback(() => playAudio(AUDIO_I_AM), []);

  const handleCheckClick = useCallback(() => {
    if (mainVariant !== 'tips') {
      onNext();
      return;
    }
    window.setTimeout(() => {
      setShowGoodStamp(true);
      const audio = new Audio(RECAP_GOOD_STAMP_AUDIO);
      audio.onerror = () => {};
      audio.play().catch(() => {});
    }, 500);
  }, [mainVariant, onNext]);

  return (
    <div className="screen-content">
      <div className="screen-center">
        <div className="topic-box topic-box--step5">{TOPIC_TEXT}</div>
        <div className="screen-main screen-main--vertical-center recap-main">
          {mainVariant === 'expressions' && (
            <>
              <h2 className="recap-expressions-heading">Today&apos;s Expressions</h2>
              <div className="recap-expression-frames">
                <button
                  type="button"
                  className="recap-expression-frame"
                  onClick={playNiceToMeetYou}
                  aria-label="Play: Nice to meet you!"
                >
                  Nice to meet you!
                </button>
                <button
                  type="button"
                  className="recap-expression-frame"
                  onClick={playIAm}
                  aria-label="Play: I am"
                >
                  I am
                </button>
              </div>
            </>
          )}
          {mainVariant === 'summary' && (
            <div className="recap-summary">
              <h2 className="recap-summary-heading">Speaking Summary</h2>
              <section className="recap-summary-item">
                <span className="recap-summary-label-frame">Topic Match</span>
                <StarRow filled={3} />
                <p className="recap-summary-feedback">주제에 알맞은 대화를 진행했어요!</p>
              </section>
              <section className="recap-summary-item">
                <span className="recap-summary-label-frame">Expression Usage</span>
                <StarRow filled={2} />
                <p className="recap-summary-feedback">학습 표현을 조금 더 사용해 보면 좋아요!</p>
              </section>
            </div>
          )}
          {mainVariant === 'tips' && (
            <div className="recap-tips">
              <h2 className="recap-summary-heading">Selena&apos;s Secret Tip</h2>
              <section className="recap-tip-item">
                <span className="recap-summary-label-frame">More Natural</span>
                <p className="recap-tip-text"><span className="recap-tip-bold">Good to see you.</span> → 이미 아는 사람</p>
                <p className="recap-tip-text"><span className="recap-tip-bold">Nice to meet you.</span> → 처음 만난 사람</p>
              </section>
              <section className="recap-tip-item">
                <span className="recap-summary-label-frame">Say It Better</span>
                <p className="recap-tip-text">
                  <span className="recap-tip-bold">I am <span className="recap-tip-highlight">a</span> student.</span>
                </p>
                <p className="recap-tip-text">→ <span className="recap-tip-bold">student</span> 앞에는 <span className="recap-tip-bold">a</span>를 붙여서 말해요.</p>
              </section>
            </div>
          )}
        </div>
        <div className="screen-bottom">
          <button
            type="button"
            className="recap-complete-circle"
            onClick={handleCheckClick}
            aria-label="Complete"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>

      {mainVariant === 'tips' && showGoodStamp && (
        <div
          className="screen7-stamp-popup screen7-stamp-popup--overlay recap-good-stamp-overlay"
          role="button"
          tabIndex={0}
          aria-label="다음으로"
          onClick={(e) => { e.stopPropagation(); setShowGoodStamp(false); onNext(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowGoodStamp(false); onNext(); } }}
        >
          <div className="screen7-stamp-circle recap-good-stamp-circle">
            <svg className="screen7-stamp-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="recap-stamp-star" d="M0 -2.1 L0.5 -0.5 L2.2 -0.5 L0.8 0.5 L1.3 2.1 L0 1.1 L-1.3 2.1 L-0.8 0.5 L-2.2 -0.5 L-0.5 -0.5 Z" fill="#fff" />
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="3" />
              <use href="#recap-stamp-star" transform="translate(98, 38) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(82, 22) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(60, 16) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(38, 22) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(22, 38) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(22, 82) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(38, 98) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(60, 104) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(82, 98) scale(2)" />
              <use href="#recap-stamp-star" transform="translate(98, 82) scale(2)" />
              <text x="60" y="62" textAnchor="middle" dominantBaseline="central" className="screen7-stamp-text" fill="#fff">GOOD!</text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
