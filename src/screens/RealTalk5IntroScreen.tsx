/**
 * Real Talk 5 – 인트로 화면
 * girl.png + realtalk0.mp3 재생 (Real Talk 3과 동일), 음원 종료 후 GO 표시
 */

import { useEffect, useState } from 'react';

const REALTALK5_TOPIC = 'TOPIC: Meet New Friends';
const REALTALK5_IMAGE = '/girl.png';
const REALTALK5_INTRO_AUDIO = '/realtalk0.mp3';

type RealTalk5IntroScreenProps = {
  onNext?: () => void;
};

export function RealTalk5IntroScreen({ onNext }: RealTalk5IntroScreenProps) {
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    setShowGo(false);
    const audio = new Audio(REALTALK5_INTRO_AUDIO);
    const onEnded = () => setShowGo(true);
    audio.addEventListener('ended', onEnded);
    audio.play().catch(() => setShowGo(true));
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className="realtalk-layout">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{REALTALK5_TOPIC}</div>
        </div>
        <div className="realtalk-main">
          <img src={REALTALK5_IMAGE} alt="" className="realtalk-main-image" />
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
