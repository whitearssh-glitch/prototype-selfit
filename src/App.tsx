import { useState } from 'react';
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

const HEADER_TITLE = 'Basic 01 Day 01';
export const TOPIC_TEXT = 'TOPIC: Self-introduction';

function getInitialScreenIndex(): number {
  if (typeof window === 'undefined') return 0;
  return window.location.hash === '#speed-up' ? 9 : 0;
}

export default function App() {
  const [screenIndex, setScreenIndex] = useState(getInitialScreenIndex);

  const goNext = () => setScreenIndex((i) => (i < 25 ? i + 1 : i));

  return (
    <div className="app">
      {screenIndex > 0 && screenIndex !== 1 && screenIndex !== 9 && screenIndex !== 25 && <header className="app-header">{HEADER_TITLE}</header>}

      <div className="app-content">
        {screenIndex === 0 && (
          <CornerSelectScreen
            onSelectStep1={() => setScreenIndex(1)}
            onSelectStep2={() => setScreenIndex(9)}
          />
        )}
        {screenIndex === 1 && <CornerIntroScreen step="STEP 1" title="Patterns" onNext={goNext} />}
        {screenIndex === 2 && <LectureScreen1 onNext={goNext} />}
        {screenIndex === 3 && <LectureScreen2 onNext={goNext} />}
        {screenIndex === 4 && <LectureScreen3 onNext={goNext} />}
        {screenIndex === 5 && <LectureScreen4 onNext={goNext} />}
        {screenIndex === 6 && <LectureScreen5 onNext={goNext} />}
        {screenIndex === 7 && <LectureScreen6 onNext={goNext} />}
        {screenIndex === 8 && <LectureScreen7 onNext={goNext} />}
        {screenIndex === 9 && <CornerIntroScreen step="STEP 2" title="Speed Up" onNext={goNext} />}
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
        {screenIndex === 24 && <LectureScreen17 onNext={goNext} hideSpeedDisplay />}
        {screenIndex === 25 && <div className="screen-content" />}
      </div>
    </div>
  );
}
