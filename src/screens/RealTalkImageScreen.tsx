/**
 * Real Talk – 인덱스 41
 * 인덱스 36과 동일한 디자인·이미지 (girl.png, 토픽).
 * 이미지 등장과 함께 check.mp3 재생, 음원 종료 후 SURE! 버튼 표시.
 */

import { useEffect, useState } from 'react';
import { TOPIC_TEXT } from '../App';

const REALTALK_IMAGE_GIRL = '/girl.png';
const CHECK_AUDIO = '/check.mp3';

type RealTalkImageScreenProps = {
  onNext?: () => void;
};

export function RealTalkImageScreen({ onNext }: RealTalkImageScreenProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const audio = new Audio(CHECK_AUDIO);
    const showBtn = () => setShowButton(true);
    let cleared = false;
    const checkComplete = () => {
      if (cleared) return;
      /* duration이 유효하고, 재생이 끝에 도달했을 때만 노출 (ended 이벤트가 중간에 뜨는 경우 방지) */
      if (audio.duration && !isNaN(audio.duration) && audio.currentTime >= audio.duration - 0.1) {
        showBtn();
        return true;
      }
      return false;
    };
    const onTimeUpdate = () => {
      if (checkComplete()) {
        audio.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
    const onEnded = () => {
      if (checkComplete()) return;
      /* ended가 중간에 뜬 경우: 200ms 후 재확인 (실제 끝에 도달했을 수 있음) */
      setTimeout(() => {
        if (!cleared) checkComplete();
      }, 200);
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
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="41">
      <div className="realtalk-layout">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        <div className="realtalk-main">
          <img src={REALTALK_IMAGE_GIRL} alt="" className="realtalk-main-image" />
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
