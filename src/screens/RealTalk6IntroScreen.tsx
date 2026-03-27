/**
 * Real Talk 6 – 인트로 화면
 * man.png + realtalk0_man.mp3 재생, 음원 종료 후 GO 표시
 */

import { useEffect, useState } from 'react';

const REALTALK6_TOPIC = 'TOPIC: Favorite Movies';
const REALTALK6_IMAGE = '/man.png';
const REALTALK6_INTRO_AUDIO = '/realtalk0_man.mp3';

type RealTalk6IntroScreenProps = {
  onNext?: () => void;
};

export function RealTalk6IntroScreen({ onNext }: RealTalk6IntroScreenProps) {
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    setShowGo(false);
    const audio = new Audio(REALTALK6_INTRO_AUDIO);
    const onEnded = () => setShowGo(true);
    audio.addEventListener('ended', onEnded);
    audio.play().catch(() => setShowGo(true));
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="realtalk-layout">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{REALTALK6_TOPIC}</div>
        </div>
        <div className="realtalk-main">
          <img src={REALTALK6_IMAGE} alt="" className="realtalk-main-image" />
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
