/**
 * Real Talk Screen (Index 30)
 * 리얼 토크 전 가이드: Real Talk Guide 블록(프로필 + 상황 설명) + GO! 버튼 → 인덱스 31
 */

import { TOPIC_TEXT } from '../App';

const REALTALK_GUIDE_AVATAR = '/vicky.png';
const REALTALK_GUIDE_TEXT = '안녕! 내 이름은 Cathy야. / 너랑 친구가 되고 싶어! / 너에 대해서 알려 줄래?';
const REALTALK_GUIDE_LINES = REALTALK_GUIDE_TEXT.split(' / ');

type RealTalkScreenProps = {
  onNext?: () => void;
};

export function RealTalkScreen({ onNext }: RealTalkScreenProps) {
  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="realtalk-layout">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        <div className="realtalk-main">
          <div className="realtalk-guide">
            <div className="realtalk-guide-header">
              <h2 className="realtalk-guide-title">Real Talk Guide</h2>
            </div>
            <div className="realtalk-guide-divider" aria-hidden />
            <div className="realtalk-guide-content">
              <img src={REALTALK_GUIDE_AVATAR} alt="" className="realtalk-guide-avatar" />
              <div className="realtalk-guide-text">
              {REALTALK_GUIDE_LINES.map((line, i) => (
                <p key={i} className="realtalk-guide-text-line">{line}</p>
              ))}
            </div>
            </div>
          </div>
        </div>
        <div className="realtalk-bottom">
          <button type="button" className="realtalk-go-btn" onClick={onNext}>
            GO!
          </button>
        </div>
      </div>
    </div>
  );
}
