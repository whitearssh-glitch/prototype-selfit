/**
 * Real Talk 4 – 인트로 화면
 * woman.png + realtalk0_woman.mp3 재생, 음원 종료 후 GO 표시
 */

import { useEffect, useState } from 'react';

const REALTALK4_TOPIC = 'TOPIC: Grocery Shopping';
const REALTALK4_IMAGE = '/woman.png';
const REALTALK4_INTRO_AUDIO = '/realtalk0_woman.mp3';

type RealTalk4IntroScreenProps = {
  onNext?: () => void;
};

export function RealTalk4IntroScreen({ onNext }: RealTalk4IntroScreenProps) {
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    setShowGo(false);
    const audio = new Audio(REALTALK4_INTRO_AUDIO);
    const onEnded = () => setShowGo(true);
    audio.addEventListener('ended', onEnded);
    audio.play().catch(() => setShowGo(true));
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="realtalk-layout">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{REALTALK4_TOPIC}</div>
        </div>
        <div className="realtalk-main">
          <img src={REALTALK4_IMAGE} alt="" className="realtalk-main-image" />
        </div>
        <div className="realtalk-bottom">
          <button
            type="button"
            className={'realtalk-go-btn' + (!showGo ? ' realtalk-go-btn--hidden' : '')}
            onClick={onNext}
            aria-hidden={!showGo}
          >
            GO!
          </button>
        </div>
      </div>
    </div>
  );
}
