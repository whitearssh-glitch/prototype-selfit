import { useState, useEffect } from 'react';
import { CornerSelectScreen } from './screens/CornerSelectScreen';
import { CornerIntroScreen } from './screens/CornerIntroScreen';
import { LectureScreen1 } from './screens/LectureScreen1';
import { LectureScreen2 } from './screens/LectureScreen2';
import { LectureScreen3 } from './screens/LectureScreen3';
import { LectureScreen4 } from './screens/LectureScreen4';
import { LectureScreen5 } from './screens/LectureScreen5';
import { LectureScreen6 } from './screens/LectureScreen6';
import { LectureScreen7 } from './screens/LectureScreen7';
import { LectureScreen9 } from './screens/LectureScreen9';
import { LectureScreen10 } from './screens/LectureScreen10';
import { LectureScreen11 } from './screens/LectureScreen11';
import { LectureScreen12 } from './screens/LectureScreen12';
import { LectureScreen13 } from './screens/LectureScreen13';
import { LectureScreen14 } from './screens/LectureScreen14';
import { LectureScreen15 } from './screens/LectureScreen15';
import { LectureScreen16 } from './screens/LectureScreen16';
import { LectureScreen17 } from './screens/LectureScreen17';
import { LectureScreen18 } from './screens/LectureScreen18';
import { RolePlayScreen } from './screens/RolePlayScreen';

const HEADER_TITLE = 'Basic 01 Day 01';
export const TOPIC_TEXT = 'TOPIC: Self-introduction';

const MAX_SCREEN_INDEX = 28;

function getInitialScreenIndex(): number {
  if (typeof window === 'undefined') return 0;
  const hash = window.location.hash.slice(1); // '#' 제거
  if (hash === 'speed-up') return 9;
  const n = parseInt(hash, 10);
  if (!Number.isNaN(n) && n >= 0 && n <= MAX_SCREEN_INDEX) return n;
  return 0;
}

export default function App() {
  const [screenIndex, setScreenIndex] = useState(getInitialScreenIndex);

  const goNext = () => setScreenIndex((i) => (i < 28 ? i + 1 : i));
  const appStep3Class = screenIndex === 25 || screenIndex === 26 || screenIndex === 27 || screenIndex === 28 ? ' app--step3-colors-no-frame' : '';
  const isStep1OrStep2 = screenIndex >= 1 && screenIndex <= 24;
  const isStep3 = screenIndex === 25 || screenIndex === 26 || screenIndex === 27 || screenIndex === 28;

  /* 스텝1·2(인덱스 1~24: 코너 인트로 + 강의 화면) body(양옆 여백) + 앱 프레임을 연한 분홍 그라데이션으로 */
  /* 스텝3(25·26·27·28)일 때 body(양옆 여백) 배경을 청보라 그라데이션으로 */
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('app-step1-margins', isStep1OrStep2);
    body.classList.toggle('app-step3-margins', isStep3);
    return () => {
      body.classList.remove('app-step1-margins', 'app-step3-margins');
    };
  }, [isStep1OrStep2, isStep3]);

  const appStep1Class = isStep1OrStep2 ? ' app--step1-colors' : '';
  return (
    <div className={'app' + appStep1Class + appStep3Class}>
        {screenIndex > 0 && screenIndex !== 1 && screenIndex !== 9 && screenIndex !== 25 && (
        <header className={'app-header' + (screenIndex === 26 || screenIndex === 27 || screenIndex === 28 ? ' app-header--step3' : '')}>
          <span className="app-header-text">{HEADER_TITLE}</span>
        </header>
      )}

      <div className="app-content">
        {screenIndex === 0 && (
          <CornerSelectScreen
            onSelectStep1={() => setScreenIndex(1)}
            onSelectStep2={() => setScreenIndex(9)}
            onSelectStep3={() => setScreenIndex(25)}
          />
        )}
        {screenIndex === 1 && <CornerIntroScreen step="STEP 1" title="Patterns" step1 onNext={goNext} />}
        {screenIndex === 2 && <LectureScreen1 onNext={goNext} />}
        {screenIndex === 3 && <LectureScreen2 onNext={goNext} />}
        {screenIndex === 4 && <LectureScreen3 onNext={goNext} />}
        {screenIndex === 5 && <LectureScreen4 onNext={goNext} />}
        {screenIndex === 6 && <LectureScreen5 onNext={goNext} />}
        {screenIndex === 7 && <LectureScreen6 onNext={goNext} />}
        {screenIndex === 8 && <LectureScreen7 onNext={goNext} />}
        {screenIndex === 9 && <CornerIntroScreen step="STEP 2" title="Speed Up" step2 onNext={goNext} />}
        {screenIndex === 10 && <LectureScreen9 onNext={goNext} />}
        {screenIndex === 11 && <LectureScreen11 onNext={goNext} />}
        {screenIndex === 12 && <LectureScreen13 onNext={goNext} />}
        {screenIndex === 13 && <LectureScreen15 onNext={goNext} />}
        {screenIndex === 14 && <LectureScreen16 onNext={goNext} />}
        {screenIndex === 15 && <LectureScreen9 onNext={goNext} speedDisplayVariant="fast" playbackRate={1} />}
        {screenIndex === 16 && <LectureScreen11 onNext={goNext} speedDisplayVariant="fast" playbackRate={1} />}
        {screenIndex === 17 && <LectureScreen13 onNext={goNext} speedDisplayVariant="fast" playbackRate={1} />}
        {screenIndex === 18 && <LectureScreen15 onNext={goNext} speedDisplayVariant="fast" playbackRate={1} />}
        {screenIndex === 19 && <LectureScreen16 onNext={goNext} speedDisplayVariant="fast" playbackRate={1} afterCheckPopupText="Your turn!" />}
        {screenIndex === 20 && <LectureScreen10 onNext={goNext} hideSpeedDisplay />}
        {screenIndex === 21 && <LectureScreen12 onNext={goNext} hideSpeedDisplay />}
        {screenIndex === 22 && <LectureScreen18 onNext={goNext} hideSpeedDisplay />}
        {screenIndex === 23 && <LectureScreen14 onNext={goNext} hideSpeedDisplay />}
        {screenIndex === 24 && <LectureScreen17 onNext={goNext} hideSpeedDisplay showGoodStampAndFb4={true} />}
        {screenIndex === 25 && <CornerIntroScreen step="STEP 3" title="Role Play" step3 onNext={goNext} />}
        {screenIndex === 26 && <RolePlayScreen scriptIndex={0} onNext={goNext} />}
        {screenIndex === 27 && <RolePlayScreen scriptIndex={1} onNext={goNext} />}
        {screenIndex === 28 && <RolePlayScreen scriptIndex={2} onNext={goNext} />}
      </div>
    </div>
  );
}
