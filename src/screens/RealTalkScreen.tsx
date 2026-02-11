/**
 * Real Talk Screen (Index 30 / Index 36 / Index 37)
 * Index 30: 리얼 토크 전 가이드(프로필 + 상황 설명) + GO! 버튼
 * Index 36: imageOnly 시 girl.png + realtalk0.mp3 재생, 음원 종료 후 GO 표시
 * Index 37: imageOnlyNoGo 시 girl1.png + realtalk1.mp3 재생, 음원 종료 후 마이크 버튼 + 음성인식
 */

import { useCallback, useEffect, useState } from 'react';
import { TOPIC_TEXT } from '../App';
import { useSTT } from '../useSTT';

const REALTALK_GUIDE_AVATAR = '/vicky.png';
const REALTALK_GUIDE_TEXT = '안녕! 내 이름은 Cathy야. / 너랑 친구가 되고 싶어! / 너에 대해서 알려 줄래?';
const REALTALK_GUIDE_LINES = REALTALK_GUIDE_TEXT.split(' / ');
const REALTALK_IMAGE_GIRL = '/girl.png';
const REALTALK_IMAGE_GIRL1 = '/girl1.png';
const REALTALK0_AUDIO = '/realtalk0.mp3';
const REALTALK1_AUDIO = '/realtalk1.mp3';

function playDingDong() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(523, 0, 0.15);
    playTone(659, 0.2, 0.2);
  } catch {
    // ignore
  }
}

type RealTalkScreenProps = {
  onNext?: () => void;
  /** true면 인덱스 36: girl.png + realtalk0.mp3 재생, 음원 종료 후 GO 표시 */
  imageOnly?: boolean;
  /** true면 인덱스 37: girl1.png + realtalk1.mp3 재생, 음원 종료 후 마이크 + 음성인식 */
  imageOnlyNoGo?: boolean;
};

export function RealTalkScreen({ onNext, imageOnly, imageOnlyNoGo }: RealTalkScreenProps) {
  const showImageOnly = imageOnly || imageOnlyNoGo;
  const imageSrc = imageOnlyNoGo ? REALTALK_IMAGE_GIRL1 : REALTALK_IMAGE_GIRL;
  const [showGo, setShowGo] = useState(!showImageOnly);
  const [showMic37, setShowMic37] = useState(false);

  const onResult37 = useCallback((_transcript: string) => {
    playDingDong();
  }, []);
  const { start: startSTT, isListening } = useSTT(imageOnlyNoGo ? onResult37 : () => {}, { useApiStt: false });

  useEffect(() => {
    if (imageOnly) {
      setShowGo(false);
      const audio = new Audio(REALTALK0_AUDIO);
      const onEnded = () => setShowGo(true);
      audio.addEventListener('ended', onEnded);
      audio.play().catch(() => setShowGo(true));
      return () => {
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [imageOnly]);

  useEffect(() => {
    if (imageOnlyNoGo) {
      const audio = new Audio(REALTALK1_AUDIO);
      const onEnded = () => setShowMic37(true);
      audio.addEventListener('ended', onEnded);
      audio.play().catch(() => setShowMic37(true));
      return () => {
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [imageOnlyNoGo]);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame">
      <div className={'realtalk-layout' + (imageOnlyNoGo ? ' realtalk-layout--reserve-go-space realtalk-layout--with-text-slots' : '')}>
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        {imageOnlyNoGo && (
          <div className="realtalk-text-slot realtalk-text-slot--above" aria-hidden>
            {/* 텍스트 2줄 자리 */}
          </div>
        )}
        <div className="realtalk-main">
          {showImageOnly ? (
            <img src={imageSrc} alt="" className="realtalk-main-image" />
          ) : (
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
          )}
        </div>
        {imageOnlyNoGo && (
          <div className="realtalk-text-slot realtalk-text-slot--below" aria-hidden>
            {/* 텍스트 2줄 자리 */}
          </div>
        )}
        <div className="realtalk-bottom">
          {!imageOnlyNoGo && (
            <button
              type="button"
              className={'realtalk-go-btn' + (imageOnly && !showGo ? ' realtalk-go-btn--hidden' : '')}
              onClick={onNext}
              aria-hidden={imageOnly && !showGo}
            >
              GO!
            </button>
          )}
          {imageOnlyNoGo && (
            <button
              type="button"
              className={'mic-btn mic-btn--step3' + (!showMic37 ? ' realtalk-mic37--hidden' : '')}
              onClick={startSTT}
              disabled={isListening}
              aria-label="Microphone"
              aria-hidden={!showMic37}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
