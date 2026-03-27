/**
 * Real Talk 4 – 대화 후 이미지 화면
 * woman.png + check_woman.mp3 재생, 음원 종료 후 SURE! 버튼 표시
 */

import { useEffect, useState } from 'react';

const REALTALK4_TOPIC = 'TOPIC: Grocery Shopping';
const REALTALK4_IMAGE = '/woman.png';
const CHECK_WOMAN_AUDIO = '/check_woman.mp3';

type RealTalk4ImageScreenProps = {
  onNext?: () => void;
};

export function RealTalk4ImageScreen({ onNext }: RealTalk4ImageScreenProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const audio = new Audio(CHECK_WOMAN_AUDIO);
    const showBtn = () => setShowButton(true);
    let cleared = false;
    const checkComplete = () => {
      if (cleared) return;
      if (audio.duration && !isNaN(audio.duration) && audio.currentTime >= audio.duration - 0.1) {
        showBtn();
        return true;
      }
      return false;
    };
    const onTimeUpdate = () => {
      if (checkComplete()) audio.removeEventListener('timeupdate', onTimeUpdate);
    };
    const onEnded = () => {
      if (checkComplete()) return;
      setTimeout(() => { if (!cleared) checkComplete(); }, 200);
    };
    const onError = () => {
      if (!cleared) setTimeout(showBtn, 1500);
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.play().catch(onError);
    return () => {
      cleared = true;
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="rt4-image">
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
            className={'realtalk-go-btn' + (showButton ? '' : ' realtalk-go-btn--hidden')}
            onClick={onNext}
            aria-hidden={!showButton}
          >
            SURE!
          </button>
        </div>
      </div>
    </div>
  );
}
