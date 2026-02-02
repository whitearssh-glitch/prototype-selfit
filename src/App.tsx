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
import { RealTalkScreen } from './screens/RealTalkScreen';
import { RealTalkLessonScreen } from './screens/RealTalkLessonScreen';
import { RecapLessonScreen } from './screens/RecapLessonScreen';

const HEADER_TITLE = 'Basic 01 Day 01';
export const TOPIC_TEXT = 'TOPIC: Self-introduction';

const MAX_SCREEN_INDEX = 35;

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

  const goNext = () => setScreenIndex((i) => (i < MAX_SCREEN_INDEX ? i + 1 : i));
  const appStep3Class = screenIndex === 25 || screenIndex === 26 || screenIndex === 27 || screenIndex === 28 || screenIndex === 29 || screenIndex === 30 || screenIndex === 31 ? ' app--step3-colors-no-frame' : '';
  const isStep1OrStep2 = screenIndex >= 1 && screenIndex <= 24;
  const isStep3 = screenIndex === 25 || screenIndex === 26 || screenIndex === 27 || screenIndex === 28 || screenIndex === 29 || screenIndex === 30 || screenIndex === 31;
  const isStep5 = screenIndex === 32 || screenIndex === 33 || screenIndex === 34 || screenIndex === 35;

  /* 코너 선택(0): body 여백 분홍+청보라+노랑 / 스텝1·2: 연한 분홍 / 스텝3·4: 청보라 / 스텝5: 파스텔 보라-노랑 */
  const isCornerSelect = screenIndex === 0;
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('app-corner-select-margins', isCornerSelect);
    body.classList.toggle('app-step1-margins', isStep1OrStep2);
    body.classList.toggle('app-step3-margins', isStep3);
    body.classList.toggle('app-step5-margins', isStep5);
    return () => {
      body.classList.remove('app-corner-select-margins', 'app-step1-margins', 'app-step3-margins', 'app-step5-margins');
    };
  }, [isCornerSelect, isStep1OrStep2, isStep3, isStep5]);

  const appCornerSelectClass = isCornerSelect ? ' app--corner-select-colors' : '';
  const appStep1Class = isStep1OrStep2 ? ' app--step1-colors' : '';
  const appStep5Class = isStep5 ? ' app--step5-colors' : '';
  const realtalkFixedHeightClass = screenIndex === 31 ? ' app--realtalk-fixed-height' : '';
  return (
    <div className={'app' + appCornerSelectClass + appStep1Class + appStep3Class + appStep5Class + realtalkFixedHeightClass}>
        {screenIndex > 0 && screenIndex !== 1 && screenIndex !== 9 && screenIndex !== 25 && screenIndex !== 29 && screenIndex !== 32 && (
        <header className={'app-header' + (screenIndex >= 2 && screenIndex <= 24 ? ' app-header--step1' : '') + (screenIndex === 26 || screenIndex === 27 || screenIndex === 28 || screenIndex === 30 || screenIndex === 31 ? ' app-header--step3' : '') + (screenIndex === 33 || screenIndex === 34 || screenIndex === 35 ? ' app-header--step5' : '')}>
          <span className="app-header-text">{HEADER_TITLE}</span>
        </header>
      )}

      <div className="app-content">
        {screenIndex === 0 && (
          <CornerSelectScreen
            onSelectStep1={() => setScreenIndex(1)}
            onSelectStep2={() => setScreenIndex(9)}
            onSelectStep3={() => setScreenIndex(25)}
            onSelectStep4={() => setScreenIndex(29)}
            onSelectStep5={() => setScreenIndex(32)}
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
        {screenIndex === 20 && <LectureScreen10 onNext={goNext} hideSpeedDisplay forceWrong />}
        {screenIndex === 21 && <LectureScreen12 onNext={goNext} hideSpeedDisplay forceWrong />}
        {screenIndex === 22 && <LectureScreen18 onNext={goNext} hideSpeedDisplay forceCorrect />}
        {screenIndex === 23 && <LectureScreen14 onNext={goNext} hideSpeedDisplay forceCorrect />}
        {screenIndex === 24 && <LectureScreen17 onNext={goNext} hideSpeedDisplay showGoodStampAndFb4={true} forceCorrect />}
        {screenIndex === 25 && <CornerIntroScreen step="STEP 3" title="Role Play" step3 onNext={goNext} />}
        {screenIndex === 26 && <RolePlayScreen scriptIndex={0} onNext={goNext} />}
        {screenIndex === 27 && <RolePlayScreen scriptIndex={1} onNext={goNext} />}
        {screenIndex === 28 && <RolePlayScreen scriptIndex={2} onNext={goNext} />}
        {screenIndex === 29 && <CornerIntroScreen step="STEP 4" title="Real Talk" step3 onNext={goNext} />}
        {screenIndex === 30 && <RealTalkScreen onNext={() => setScreenIndex(31)} />}
        {screenIndex === 31 && <RealTalkLessonScreen onNext={goNext} />}
        {screenIndex === 32 && <CornerIntroScreen step="STEP 5" title="Recap" step5 onNext={goNext} />}
        {screenIndex === 33 && <RecapLessonScreen onNext={goNext} />}
        {screenIndex === 34 && <RecapLessonScreen mainVariant="summary" onNext={goNext} />}
        {screenIndex === 35 && <RecapLessonScreen mainVariant="tips" onNext={() => setScreenIndex(0)} />}
      </div>
    </div>
  );
}
