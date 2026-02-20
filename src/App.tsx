import { useState, useEffect, useRef } from 'react';
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
import { RealTalk2Screen } from './screens/RealTalk2Screen';
import { RealTalk2Turn3Screen } from './screens/RealTalk2Turn3Screen';
import { RealTalk2Turn5Screen } from './screens/RealTalk2Turn5Screen';
import { RealTalk2Turn6Screen } from './screens/RealTalk2Turn6Screen';
import { RealTalkImageScreen } from './screens/RealTalkImageScreen';
import { RealTalk2Screen42 } from './screens/RealTalk2Screen41';
import { RealTalkLessonScreen } from './screens/RealTalkLessonScreen';
import { RecapLessonScreen } from './screens/RecapLessonScreen';
import { RealTalk3Screen } from './screens/RealTalk3Screen';
import { RealTalk3SummaryScreen } from './screens/RealTalk3SummaryScreen';
import { RealTalk3EvaluationScreen } from './screens/RealTalk3EvaluationScreen';
import { RealTalk3ErrorReviewScreen } from './screens/RealTalk3ErrorReviewScreen';
import { RealTalk3CorrectionPracticeScreen } from './screens/RealTalk3CorrectionPracticeScreen';
import { evaluateSession, getCathyFirstPhrase } from './realTalk3Gemini';
import { speak, stopSpeaking } from './realTalk3TTS';
import { getCorrectionPracticeItems } from './realTalk3Types';
import type { RealTalk3Data, SessionEvaluation } from './realTalk3Types';

const HEADER_TITLE = 'Basic 01 Day 01';
export const TOPIC_TEXT = 'TOPIC: Self-introduction';

const MAX_SCREEN_INDEX = 49;

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
  const [realTalk3Data, setRealTalk3Data] = useState<RealTalk3Data | null>(null);
  const [realTalk3Evaluation, setRealTalk3Evaluation] = useState<SessionEvaluation | null>(null);
  const [realTalk3FirstPhraseDone, setRealTalk3FirstPhraseDone] = useState(false);
  const [realTalk3FirstPhraseInProgress, setRealTalk3FirstPhraseInProgress] = useState(false);

  const goNext = () => setScreenIndex((i) => (i < MAX_SCREEN_INDEX ? i + 1 : i));
  const appStep3Class =
    screenIndex === 25 ||
    screenIndex === 26 ||
    screenIndex === 27 ||
    screenIndex === 28 ||
    screenIndex === 29 ||
    screenIndex === 30 ||
    screenIndex === 31 ||
    screenIndex === 36 ||
    screenIndex === 37 ||
    screenIndex === 38 ||
    screenIndex === 39 ||
    screenIndex === 40 ||
    screenIndex === 41 ||
    screenIndex === 42 ||
    screenIndex === 43 ||
    screenIndex === 44 ||
    screenIndex === 45 ||
    screenIndex === 46 ||
    screenIndex === 47 ||
    screenIndex === 48 ||
    screenIndex === 49
      ? ' app--step3-colors-no-frame'
      : '';
  const isStep1OrStep2 = screenIndex >= 1 && screenIndex <= 24;
  const isStep3 =
    screenIndex === 25 ||
    screenIndex === 26 ||
    screenIndex === 27 ||
    screenIndex === 28 ||
    screenIndex === 29 ||
    screenIndex === 30 ||
    screenIndex === 31 ||
    screenIndex === 36 ||
    screenIndex === 37 ||
    screenIndex === 38 ||
    screenIndex === 39 ||
    screenIndex === 40 ||
    screenIndex === 41 ||
    screenIndex === 42 ||
    screenIndex === 43 ||
    screenIndex === 44 ||
    screenIndex === 45 ||
    screenIndex === 46 ||
    screenIndex === 47 ||
    screenIndex === 48 ||
    screenIndex === 49;
  const isStep5 = screenIndex === 32 || screenIndex === 33 || screenIndex === 34 || screenIndex === 35;

  /* 코너 선택(0): body·html 여백 분홍+청보라+노랑 / 스텝1·2: 연한 분홍 / 스텝3·4: 청보라 / 스텝5: 파스텔 보라-노랑 */
  const isCornerSelect = screenIndex === 0;
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    body.classList.toggle('app-corner-select-margins', isCornerSelect);
    body.classList.toggle('app-step1-margins', isStep1OrStep2);
    body.classList.toggle('app-step3-margins', isStep3);
    body.classList.toggle('app-step5-margins', isStep5);
    html.classList.toggle('app-corner-select-margins', isCornerSelect);
    html.classList.toggle('app-step1-margins', isStep1OrStep2);
    html.classList.toggle('app-step3-margins', isStep3);
    html.classList.toggle('app-step5-margins', isStep5);
    return () => {
      body.classList.remove('app-corner-select-margins', 'app-step1-margins', 'app-step3-margins', 'app-step5-margins');
      html.classList.remove('app-corner-select-margins', 'app-step1-margins', 'app-step3-margins', 'app-step5-margins');
    };
  }, [isCornerSelect, isStep1OrStep2, isStep3, isStep5]);

  const appCornerSelectClass = isCornerSelect ? ' app--corner-select-colors' : '';
  const appStep1Class = isStep1OrStep2 ? ' app--step1-colors' : '';
  const appStep5Class = isStep5 ? ' app--step5-colors' : '';
  const realtalkFixedHeightClass = screenIndex === 31 ? ' app--realtalk-fixed-height' : '';

  useEffect(() => {
    if (screenIndex === 43) {
      setRealTalk3FirstPhraseDone(false);
      setRealTalk3FirstPhraseInProgress(false);
    }
  }, [screenIndex]);

  const prevScreenRef = useRef(screenIndex);
  useEffect(() => {
    if (prevScreenRef.current === 44 && screenIndex !== 44) {
      stopSpeaking();
    }
    prevScreenRef.current = screenIndex;
  }, [screenIndex]);

  const handleRealTalk3Go = () => {
    const first = getCathyFirstPhrase();
    setRealTalk3FirstPhraseInProgress(true);
    speak(first.en, () => {
      setRealTalk3FirstPhraseDone(true);
      setRealTalk3FirstPhraseInProgress(false);
    });
    setScreenIndex(44);
  };

  return (
    <div className={'app' + appCornerSelectClass + appStep1Class + appStep3Class + appStep5Class + realtalkFixedHeightClass}>
        {screenIndex > 0 && screenIndex !== 1 && screenIndex !== 9 && screenIndex !== 25 && screenIndex !== 29 && screenIndex !== 32 && (
        <header className={'app-header' + (screenIndex >= 2 && screenIndex <= 24 ? ' app-header--step1' : '') + (screenIndex === 26 || screenIndex === 27 || screenIndex === 28 || screenIndex === 30 || screenIndex === 31 || screenIndex === 36 || screenIndex === 37 || screenIndex === 38 || screenIndex === 39 || screenIndex === 40 || screenIndex === 41 || screenIndex === 42 || screenIndex === 43 || screenIndex === 44 || screenIndex === 45 || screenIndex === 46 || screenIndex === 47 || screenIndex === 48 || screenIndex === 49 ? ' app-header--step3' : '') + (screenIndex === 33 || screenIndex === 34 || screenIndex === 35 ? ' app-header--step5' : '')}>
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
            onSelectRealTalk2={() => setScreenIndex(36)}
            onSelectRealTalk3={() => setScreenIndex(43)}
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
        {screenIndex === 35 && <RecapLessonScreen mainVariant="tips" onNext={goNext} />}
        {screenIndex === 36 && <RealTalkScreen onNext={() => setScreenIndex(37)} imageOnly />}
        {screenIndex === 37 && <RealTalk2Screen onNext={() => setScreenIndex(38)} />}
        {screenIndex === 38 && <RealTalk2Turn3Screen onNext={() => setScreenIndex(39)} />}
        {screenIndex === 39 && <RealTalk2Turn5Screen onNext={goNext} />}
        {screenIndex === 40 && <RealTalk2Turn6Screen onNext={() => setScreenIndex(41)} />}
        {screenIndex === 41 && <RealTalkImageScreen onNext={() => setScreenIndex(42)} />}
        {screenIndex === 42 && <RealTalk2Screen42 onNext={() => setScreenIndex(43)} />}
        {screenIndex === 43 && <RealTalkScreen onNext={handleRealTalk3Go} imageOnly />}
        {screenIndex === 44 && (
          <RealTalk3Screen
            firstPhraseDone={realTalk3FirstPhraseDone}
            firstPhraseInProgress={realTalk3FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk3Data(data);
              setRealTalk3FirstPhraseDone(false);
              setScreenIndex(45);
            }}
          />
        )}
        {screenIndex === 45 && <RealTalkImageScreen onNext={() => setScreenIndex(46)} />}
        {screenIndex === 46 && realTalk3Data && (
          <RealTalk3SummaryScreen
            items={realTalk3Data.conversationSummary}
            onNext={() => setScreenIndex(47)}
          />
        )}
        {screenIndex === 47 && realTalk3Data && (
          <RealTalk3EvaluationScreen
            evaluation={realTalk3Evaluation}
            onEvaluationLoaded={setRealTalk3Evaluation}
            conversationSummary={realTalk3Data.conversationSummary}
            errorLog={realTalk3Data.errorLog}
            onNext={() => {
              setRealTalk3Evaluation(null);
              setScreenIndex(48);
            }}
          />
        )}
        {screenIndex === 48 && realTalk3Data && (
          <RealTalk3ErrorReviewScreen
            errorLog={realTalk3Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems(realTalk3Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 49 : 0);
            }}
          />
        )}
        {screenIndex === 49 && realTalk3Data && (
          <RealTalk3CorrectionPracticeScreen
            items={getCorrectionPracticeItems(realTalk3Data.errorLog)}
            onComplete={() => {
              setRealTalk3Data(null);
              setScreenIndex(0);
            }}
          />
        )}
      </div>
    </div>
  );
}
