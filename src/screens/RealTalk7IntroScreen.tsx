/**
 * Real Talk 7 – 인트로 화면
 * man.png + realtalk0_man.mp3 재생, 음원 종료 후 GO 표시
 * (Real Talk 6과 동일 이미지/음원)
 */

import { useEffect, useState } from 'react';

const REALTALK7_TOPIC = 'TOPIC: Ordering Hamburgers';
const REALTALK7_IMAGE = '/man2.png';
const REALTALK7_INTRO_AUDIO = '/realtalk0_man2.mp3';

type RealTalk7IntroScreenProps = {
  onNext?: () => void;
};

export function RealTalk7IntroScreen({ onNext }: RealTalk7IntroScreenProps) {
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    setShowGo(false);
    const audio = new Audio(REALTALK7_INTRO_AUDIO);
    const onEnded = () => setShowGo(true);
    audio.addEventListener('ended', onEnded);
    audio.play().catch(() => setShowGo(true));
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="realtalk-layout">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{REALTALK7_TOPIC}</div>
        </div>
        <div className="realtalk-main">
          <img src={REALTALK7_IMAGE} alt="" className="realtalk-main-image" />
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
