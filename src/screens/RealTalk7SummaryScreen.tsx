/**
 * Real Talk 7 – 대화 요약 (Ordering Hamburgers)
 * man.png (Kevin), student.png (학생) - Real Talk 6과 동일
 */

import { useCallback, useState } from 'react';
import type { SummaryItem } from '../realTalk7Types';

const REALTALK7_TOPIC = 'TOPIC: Ordering Hamburgers';
const KEVIN_AVATAR = '/man2.png';
const STUDENT_AVATAR = '/student.png';

const CHECKMARK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const GLOBE_ICON_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="10" ry="3" />
    <ellipse cx="12" cy="12" rx="3" ry="10" />
  </svg>
);

type RealTalk7SummaryScreenProps = {
  items: SummaryItem[];
  onNext: () => void;
};

export function RealTalk7SummaryScreen({ items, onNext }: RealTalk7SummaryScreenProps) {
  const [showKo, setShowKo] = useState<boolean[]>(items.map(() => false));

  const toggleKo = useCallback((idx: number) => {
    setShowKo((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="rt7-summary">
      <div className="realtalk2-layout realtalk-layout--reserve-go-space">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{REALTALK7_TOPIC}</div>
        </div>
        <div className="realtalk-main realtalk2-main--roleplay-chat">
          <div className="roleplay-chat">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={
                  item.speaker === 'Kevin'
                    ? 'roleplay-bubble-row roleplay-bubble-row--character'
                    : 'roleplay-bubble-row roleplay-bubble-row--student'
                }
              >
                <img
                  src={item.speaker === 'Kevin' ? KEVIN_AVATAR : STUDENT_AVATAR}
                  alt=""
                  className={'roleplay-avatar' + (item.speaker === 'Me' ? ' roleplay-avatar--student' : '')}
                  aria-hidden
                />
                <div className="roleplay-bubble-wrap">
                  <span className="roleplay-name">{item.speaker}</span>
                  <div
                    className={
                      item.speaker === 'Kevin'
                        ? 'roleplay-bubble roleplay-bubble--character'
                        : 'roleplay-bubble roleplay-bubble--student'
                    }
                  >
                    {showKo[idx] && item.textKo ? item.textKo : item.textEn}
                  </div>
                  <div className="roleplay-bubble-actions">
                    {item.textKo && (
                      <button
                        type="button"
                        className="roleplay-k-btn"
                        onClick={() => toggleKo(idx)}
                        aria-label={showKo[idx] ? '영어로 보기' : '한글로 보기'}
                      >
                        {GLOBE_ICON_SVG}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="roleplay-chat-bottom">
              <button
                type="button"
                className="roleplay-check-btn"
                onClick={onNext}
                aria-label="다음으로"
              >
                {CHECKMARK_SVG}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
