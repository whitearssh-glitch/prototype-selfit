import { useState, useEffect, useRef } from 'react';
import { VOICE_SPEED } from './config/voiceSpeed';
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
import { RealTalk4IntroScreen } from './screens/RealTalk4IntroScreen';
import { RealTalk4Screen } from './screens/RealTalk4Screen';
import { RealTalk4ImageScreen } from './screens/RealTalk4ImageScreen';
import { RealTalk4SummaryScreen } from './screens/RealTalk4SummaryScreen';
import { RealTalk4EvaluationScreen } from './screens/RealTalk4EvaluationScreen';
import { RealTalk4ErrorReviewScreen } from './screens/RealTalk4ErrorReviewScreen';
import { RealTalk4CorrectionPracticeScreen } from './screens/RealTalk4CorrectionPracticeScreen';
import { RealTalk5IntroScreen } from './screens/RealTalk5IntroScreen';
import { RealTalk5Screen } from './screens/RealTalk5Screen';
import { RealTalk5ImageScreen } from './screens/RealTalk5ImageScreen';
import { RealTalk5SummaryScreen } from './screens/RealTalk5SummaryScreen';
import { RealTalk5EvaluationScreen } from './screens/RealTalk5EvaluationScreen';
import { RealTalk5ErrorReviewScreen } from './screens/RealTalk5ErrorReviewScreen';
import { RealTalk5CorrectionPracticeScreen } from './screens/RealTalk5CorrectionPracticeScreen';
import { RealTalk6IntroScreen } from './screens/RealTalk6IntroScreen';
import { RealTalk6Screen } from './screens/RealTalk6Screen';
import { RealTalk6ImageScreen } from './screens/RealTalk6ImageScreen';
import { RealTalk6SummaryScreen } from './screens/RealTalk6SummaryScreen';
import { RealTalk6EvaluationScreen } from './screens/RealTalk6EvaluationScreen';
import { RealTalk6ErrorReviewScreen } from './screens/RealTalk6ErrorReviewScreen';
import { RealTalk6CorrectionPracticeScreen } from './screens/RealTalk6CorrectionPracticeScreen';
import { RealTalk7IntroScreen } from './screens/RealTalk7IntroScreen';
import { RealTalk7Screen } from './screens/RealTalk7Screen';
import { RealTalk7ImageScreen } from './screens/RealTalk7ImageScreen';
import { RealTalk7SummaryScreen } from './screens/RealTalk7SummaryScreen';
import { RealTalk7EvaluationScreen } from './screens/RealTalk7EvaluationScreen';
import { RealTalk7ErrorReviewScreen } from './screens/RealTalk7ErrorReviewScreen';
import { RealTalk7CorrectionPracticeScreen } from './screens/RealTalk7CorrectionPracticeScreen';
import { OpenAiVoiceTestScreen } from './screens/OpenAiVoiceTestScreen';
import { getCathyFirstPhrase } from './realTalk3Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase4 } from './realTalk4Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase5 } from './realTalk5Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase6 } from './realTalk6Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase7 } from './realTalk7Gemini';
import { speakRealTalk3, speakRealTalk4, speakRealTalk5, stopSpeaking } from './realTalk3TTS';
import { speak as speak6, stopSpeaking as stopSpeaking6 } from './realTalk6TTS';
import { speak as speak7, stopSpeaking as stopSpeaking7 } from './realTalk7TTS';
import { getCorrectionPracticeItems } from './realTalk3Types';
import { getCorrectionPracticeItems as getCorrectionPracticeItems4 } from './realTalk4Types';
import { getCorrectionPracticeItems as getCorrectionPracticeItems5 } from './realTalk5Types';
import { getCorrectionPracticeItems as getCorrectionPracticeItems6 } from './realTalk6Types';
import { getCorrectionPracticeItems as getCorrectionPracticeItems7 } from './realTalk7Types';
import type { RealTalk3Data, SessionEvaluation } from './realTalk3Types';
import type { RealTalk4Data, SessionEvaluation as SessionEvaluation4 } from './realTalk4Types';
import type { RealTalk5Data, SessionEvaluation as SessionEvaluation5 } from './realTalk5Types';
import type { RealTalk6Data, SessionEvaluation as SessionEvaluation6 } from './realTalk6Types';
import type { RealTalk7Data, SessionEvaluation as SessionEvaluation7 } from './realTalk7Types';

const HEADER_TITLE = 'Basic 01 Day 01';
export const TOPIC_TEXT = 'TOPIC: Self-introduction';

/** Next 버튼으로 이어지는 마지막 화면 인덱스 */
const LAST_SEQUENTIAL_SCREEN_INDEX = 77;
/** 홈에서만 진입하는 OpenAI TTS 미리듣기 (해시: tts-voices, openai-tts, #78) */
const TTS_VOICE_TEST_SCREEN_INDEX = 78;

function getInitialScreenIndex(): number {
  if (typeof window === 'undefined') return 0;
  const hash = window.location.hash.slice(1); // '#' 제거
  if (hash === 'speed-up') return 9;
  if (hash === 'tts-voices' || hash === 'openai-tts') return TTS_VOICE_TEST_SCREEN_INDEX;
  const n = parseInt(hash, 10);
  if (!Number.isNaN(n) && n >= 0 && n <= TTS_VOICE_TEST_SCREEN_INDEX) return n;
  return 0;
}

export default function App() {
  const [screenIndex, setScreenIndex] = useState(getInitialScreenIndex);
  const [realTalk3Data, setRealTalk3Data] = useState<RealTalk3Data | null>(null);
  const [realTalk3Evaluation, setRealTalk3Evaluation] = useState<SessionEvaluation | null>(null);
  const [realTalk3FirstPhraseDone, setRealTalk3FirstPhraseDone] = useState(false);
  const [realTalk3FirstPhraseInProgress, setRealTalk3FirstPhraseInProgress] = useState(false);
  const [realTalk4Data, setRealTalk4Data] = useState<RealTalk4Data | null>(null);
  const [realTalk4Evaluation, setRealTalk4Evaluation] = useState<SessionEvaluation4 | null>(null);
  const [realTalk4FirstPhraseDone, setRealTalk4FirstPhraseDone] = useState(false);
  const [realTalk4FirstPhraseInProgress, setRealTalk4FirstPhraseInProgress] = useState(false);
  const [realTalk5Data, setRealTalk5Data] = useState<RealTalk5Data | null>(null);
  const [realTalk5Evaluation, setRealTalk5Evaluation] = useState<SessionEvaluation5 | null>(null);
  const [realTalk5FirstPhraseDone, setRealTalk5FirstPhraseDone] = useState(false);
  const [realTalk5FirstPhraseInProgress, setRealTalk5FirstPhraseInProgress] = useState(false);
  const [realTalk6Data, setRealTalk6Data] = useState<RealTalk6Data | null>(null);
  const [realTalk6Evaluation, setRealTalk6Evaluation] = useState<SessionEvaluation6 | null>(null);
  const [realTalk6FirstPhraseDone, setRealTalk6FirstPhraseDone] = useState(false);
  const [realTalk6FirstPhraseInProgress, setRealTalk6FirstPhraseInProgress] = useState(false);
  const [realTalk7Data, setRealTalk7Data] = useState<RealTalk7Data | null>(null);
  const [realTalk7Evaluation, setRealTalk7Evaluation] = useState<SessionEvaluation7 | null>(null);
  const [realTalk7FirstPhraseDone, setRealTalk7FirstPhraseDone] = useState(false);
  const [realTalk7FirstPhraseInProgress, setRealTalk7FirstPhraseInProgress] = useState(false);

  const goNext = () =>
    setScreenIndex((i) => (i < LAST_SEQUENTIAL_SCREEN_INDEX ? i + 1 : i));
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
    screenIndex === 49 ||
    screenIndex === 50 ||
    screenIndex === 51 ||
    screenIndex === 52 ||
    screenIndex === 53 ||
    screenIndex === 54 ||
    screenIndex === 55 ||
    screenIndex === 56 ||
    screenIndex === 57 ||
    screenIndex === 58 ||
    screenIndex === 59 ||
    screenIndex === 60 ||
    screenIndex === 61 ||
    screenIndex === 62 ||
    screenIndex === 63 ||
    screenIndex === 64 ||
    screenIndex === 65 ||
    screenIndex === 66 ||
    screenIndex === 67 ||
    screenIndex === 68 ||
    screenIndex === 69 ||
    screenIndex === 70 ||
    screenIndex === 71 ||
    screenIndex === 72 ||
    screenIndex === 73 ||
    screenIndex === 74 ||
    screenIndex === 75 ||
    screenIndex === 76 ||
    screenIndex === 77
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
    screenIndex === 49 ||
    screenIndex === 50 ||
    screenIndex === 51 ||
    screenIndex === 52 ||
    screenIndex === 53 ||
    screenIndex === 54 ||
    screenIndex === 55 ||
    screenIndex === 56 ||
    screenIndex === 57 ||
    screenIndex === 58 ||
    screenIndex === 59 ||
    screenIndex === 60 ||
    screenIndex === 61 ||
    screenIndex === 62 ||
    screenIndex === 63 ||
    screenIndex === 64 ||
    screenIndex === 65 ||
    screenIndex === 66 ||
    screenIndex === 67 ||
    screenIndex === 68 ||
    screenIndex === 69 ||
    screenIndex === 70 ||
    screenIndex === 71 ||
    screenIndex === 72 ||
    screenIndex === 73 ||
    screenIndex === 74 ||
    screenIndex === 75 ||
    screenIndex === 76 ||
    screenIndex === 77;
  const isStep5 = screenIndex === 32 || screenIndex === 33 || screenIndex === 34 || screenIndex === 35;

  /* 코너 선택(0)·TTS 테스트(78): body·html 여백 분홍+청보라+노랑 / 스텝1·2: 연한 분홍 / 스텝3·4: 청보라 / 스텝5: 파스텔 보라-노랑 */
  const isCornerSelect = screenIndex === 0;
  const isTtsVoiceTest = screenIndex === TTS_VOICE_TEST_SCREEN_INDEX;
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    body.classList.toggle('app-corner-select-margins', isCornerSelect || isTtsVoiceTest);
    body.classList.toggle('app-step1-margins', isStep1OrStep2);
    body.classList.toggle('app-step3-margins', isStep3);
    body.classList.toggle('app-step5-margins', isStep5);
    html.classList.toggle('app-corner-select-margins', isCornerSelect || isTtsVoiceTest);
    html.classList.toggle('app-step1-margins', isStep1OrStep2);
    html.classList.toggle('app-step3-margins', isStep3);
    html.classList.toggle('app-step5-margins', isStep5);
    return () => {
      body.classList.remove('app-corner-select-margins', 'app-step1-margins', 'app-step3-margins', 'app-step5-margins');
      html.classList.remove('app-corner-select-margins', 'app-step1-margins', 'app-step3-margins', 'app-step5-margins');
    };
  }, [isCornerSelect, isTtsVoiceTest, isStep1OrStep2, isStep3, isStep5]);

  const appCornerSelectClass =
    isCornerSelect || isTtsVoiceTest ? ' app--corner-select-colors' : '';
  const appStep1Class = isStep1OrStep2 ? ' app--step1-colors' : '';
  const appStep5Class = isStep5 ? ' app--step5-colors' : '';
  const realtalkFixedHeightClass = screenIndex === 31 ? ' app--realtalk-fixed-height' : '';

  useEffect(() => {
    if (screenIndex === 43) {
      setRealTalk3FirstPhraseDone(false);
      setRealTalk3FirstPhraseInProgress(false);
    }
    if (screenIndex === 50) {
      setRealTalk4FirstPhraseDone(false);
      setRealTalk4FirstPhraseInProgress(false);
    }
    if (screenIndex === 57) {
      setRealTalk5FirstPhraseDone(false);
      setRealTalk5FirstPhraseInProgress(false);
    }
    if (screenIndex === 64) {
      setRealTalk6FirstPhraseDone(false);
      setRealTalk6FirstPhraseInProgress(false);
    }
  }, [screenIndex]);

  const prevScreenRef = useRef(screenIndex);
  useEffect(() => {
    if (prevScreenRef.current === 44 && screenIndex !== 44) stopSpeaking();
    if (prevScreenRef.current === 51 && screenIndex !== 51) stopSpeaking();
    if (prevScreenRef.current === 58 && screenIndex !== 58) stopSpeaking();
    if (prevScreenRef.current === 65 && screenIndex !== 65) stopSpeaking6();
    if (prevScreenRef.current === 72 && screenIndex !== 72) stopSpeaking7();
    prevScreenRef.current = screenIndex;
  }, [screenIndex]);

  const handleRealTalk3Go = () => {
    const first = getCathyFirstPhrase();
    setRealTalk3FirstPhraseInProgress(true);
    speakRealTalk3(first.en, () => {
      setRealTalk3FirstPhraseDone(true);
      setRealTalk3FirstPhraseInProgress(false);
    });
    setScreenIndex(44);
  };

  const handleRealTalk4Go = () => {
    const first = getCathyFirstPhrase4();
    setRealTalk4FirstPhraseInProgress(true);
    speakRealTalk4(first.en, () => {
      setRealTalk4FirstPhraseDone(true);
      setRealTalk4FirstPhraseInProgress(false);
    });
    setScreenIndex(51);
  };

  const handleRealTalk5Go = () => {
    const first = getCathyFirstPhrase5();
    setRealTalk5FirstPhraseInProgress(true);
    speakRealTalk5(first.en, () => {
      setRealTalk5FirstPhraseDone(true);
      setRealTalk5FirstPhraseInProgress(false);
    });
    setScreenIndex(58);
  };

  const handleRealTalk6Go = () => {
    const first = getCathyFirstPhrase6();
    setRealTalk6FirstPhraseInProgress(true);
    speak6(first.en, () => {
      setRealTalk6FirstPhraseDone(true);
      setRealTalk6FirstPhraseInProgress(false);
    });
    setScreenIndex(65);
  };

  const handleRealTalk7Go = () => {
    const first = getCathyFirstPhrase7();
    setRealTalk7FirstPhraseInProgress(true);
    speak7(first.en, () => {
      setRealTalk7FirstPhraseDone(true);
      setRealTalk7FirstPhraseInProgress(false);
    });
    setScreenIndex(72);
  };

  return (
    <div className={'app' + appCornerSelectClass + appStep1Class + appStep3Class + appStep5Class + realtalkFixedHeightClass}>
        {screenIndex > 0 &&
        screenIndex !== 1 &&
        screenIndex !== 9 &&
        screenIndex !== 25 &&
        screenIndex !== 29 &&
        screenIndex !== 32 &&
        screenIndex !== TTS_VOICE_TEST_SCREEN_INDEX && (
        <header className={'app-header' + (screenIndex >= 2 && screenIndex <= 24 ? ' app-header--step1' : '') + (screenIndex === 26 || screenIndex === 27 || screenIndex === 28 || screenIndex === 30 || screenIndex === 31 || screenIndex === 36 || screenIndex === 37 || screenIndex === 38 || screenIndex === 39 || screenIndex === 40 || screenIndex === 41 || screenIndex === 42 || screenIndex === 43 || screenIndex === 44 || screenIndex === 45 || screenIndex === 46 || screenIndex === 47 || screenIndex === 48 || screenIndex === 49 || screenIndex === 50 || screenIndex === 51 || screenIndex === 52 || screenIndex === 53 || screenIndex === 54 || screenIndex === 55 || screenIndex === 56 || screenIndex === 57 || screenIndex === 58 || screenIndex === 59 || screenIndex === 60 || screenIndex === 61 || screenIndex === 62 || screenIndex === 63 || screenIndex === 64 || screenIndex === 65 || screenIndex === 66 || screenIndex === 67 || screenIndex === 68 || screenIndex === 69 || screenIndex === 70 || screenIndex === 71 || screenIndex === 72 || screenIndex === 73 || screenIndex === 74 || screenIndex === 75 || screenIndex === 76 || screenIndex === 77 ? ' app-header--step3' : '') + (screenIndex === 33 || screenIndex === 34 || screenIndex === 35 ? ' app-header--step5' : '')}>
          <span className="app-header-text">{screenIndex >= 71 && screenIndex <= 77 ? 'Advanced 01 Day 01' : screenIndex >= 64 && screenIndex <= 70 ? 'Inter 01 Day 01' : screenIndex >= 50 && screenIndex <= 56 ? 'Basic 05 Day 01' : HEADER_TITLE}</span>
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
            onSelectRealTalk4={() => setScreenIndex(50)}
            onSelectRealTalk5={() => setScreenIndex(57)}
            onSelectRealTalk6={() => setScreenIndex(64)}
            onSelectRealTalk7={() => setScreenIndex(71)}
            onOpenOpenAiVoiceTest={() => setScreenIndex(TTS_VOICE_TEST_SCREEN_INDEX)}
          />
        )}
        {screenIndex === TTS_VOICE_TEST_SCREEN_INDEX && (
          <OpenAiVoiceTestScreen onBack={() => setScreenIndex(0)} />
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
        {screenIndex === 15 && (
          <LectureScreen9 onNext={goNext} speedDisplayVariant="fast" playbackRate={VOICE_SPEED.lecturePlaybackRate} />
        )}
        {screenIndex === 16 && (
          <LectureScreen11 onNext={goNext} speedDisplayVariant="fast" playbackRate={VOICE_SPEED.lecturePlaybackRate} />
        )}
        {screenIndex === 17 && (
          <LectureScreen13 onNext={goNext} speedDisplayVariant="fast" playbackRate={VOICE_SPEED.lecturePlaybackRate} />
        )}
        {screenIndex === 18 && (
          <LectureScreen15 onNext={goNext} speedDisplayVariant="fast" playbackRate={VOICE_SPEED.lecturePlaybackRate} />
        )}
        {screenIndex === 19 && (
          <LectureScreen16
            onNext={goNext}
            speedDisplayVariant="fast"
            playbackRate={VOICE_SPEED.lecturePlaybackRate}
            afterCheckPopupText="Your turn!"
          />
        )}
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
        {screenIndex === 50 && <RealTalk4IntroScreen onNext={handleRealTalk4Go} />}
        {screenIndex === 51 && (
          <RealTalk4Screen
            firstPhraseDone={realTalk4FirstPhraseDone}
            firstPhraseInProgress={realTalk4FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk4Data(data);
              setRealTalk4FirstPhraseDone(false);
              setScreenIndex(52);
            }}
          />
        )}
        {screenIndex === 52 && <RealTalk4ImageScreen onNext={() => setScreenIndex(53)} />}
        {screenIndex === 53 && realTalk4Data && (
          <RealTalk4SummaryScreen
            items={realTalk4Data.conversationSummary}
            onNext={() => setScreenIndex(54)}
          />
        )}
        {screenIndex === 54 && realTalk4Data && (
          <RealTalk4EvaluationScreen
            evaluation={realTalk4Evaluation}
            onEvaluationLoaded={setRealTalk4Evaluation}
            conversationSummary={realTalk4Data.conversationSummary}
            errorLog={realTalk4Data.errorLog}
            onNext={() => {
              setRealTalk4Evaluation(null);
              setScreenIndex(55);
            }}
          />
        )}
        {screenIndex === 55 && realTalk4Data && (
          <RealTalk4ErrorReviewScreen
            errorLog={realTalk4Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems4(realTalk4Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 56 : 0);
            }}
          />
        )}
        {screenIndex === 56 && realTalk4Data && (
          <RealTalk4CorrectionPracticeScreen
            items={getCorrectionPracticeItems4(realTalk4Data.errorLog)}
            onComplete={() => {
              setRealTalk4Data(null);
              setScreenIndex(0);
            }}
          />
        )}
        {screenIndex === 57 && <RealTalk5IntroScreen onNext={handleRealTalk5Go} />}
        {screenIndex === 58 && (
          <RealTalk5Screen
            firstPhraseDone={realTalk5FirstPhraseDone}
            firstPhraseInProgress={realTalk5FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk5Data(data);
              setRealTalk5FirstPhraseDone(false);
              setScreenIndex(59);
            }}
          />
        )}
        {screenIndex === 59 && <RealTalk5ImageScreen onNext={() => setScreenIndex(60)} />}
        {screenIndex === 60 && realTalk5Data && (
          <RealTalk5SummaryScreen
            items={realTalk5Data.conversationSummary}
            onNext={() => setScreenIndex(61)}
          />
        )}
        {screenIndex === 61 && realTalk5Data && (
          <RealTalk5EvaluationScreen
            evaluation={realTalk5Evaluation}
            onEvaluationLoaded={setRealTalk5Evaluation}
            conversationSummary={realTalk5Data.conversationSummary}
            errorLog={realTalk5Data.errorLog}
            onNext={() => {
              setRealTalk5Evaluation(null);
              setScreenIndex(62);
            }}
          />
        )}
        {screenIndex === 62 && realTalk5Data && (
          <RealTalk5ErrorReviewScreen
            errorLog={realTalk5Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems5(realTalk5Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 63 : 0);
            }}
          />
        )}
        {screenIndex === 63 && realTalk5Data && (
          <RealTalk5CorrectionPracticeScreen
            items={getCorrectionPracticeItems5(realTalk5Data.errorLog)}
            onComplete={() => {
              setRealTalk5Data(null);
              setScreenIndex(0);
            }}
          />
        )}
        {screenIndex === 64 && <RealTalk6IntroScreen onNext={handleRealTalk6Go} />}
        {screenIndex === 65 && (
          <RealTalk6Screen
            firstPhraseDone={realTalk6FirstPhraseDone}
            firstPhraseInProgress={realTalk6FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk6Data(data);
              setRealTalk6FirstPhraseDone(false);
              setScreenIndex(66);
            }}
          />
        )}
        {screenIndex === 66 && <RealTalk6ImageScreen onNext={() => setScreenIndex(67)} />}
        {screenIndex === 67 && realTalk6Data && (
          <RealTalk6SummaryScreen
            items={realTalk6Data.conversationSummary}
            onNext={() => setScreenIndex(68)}
          />
        )}
        {screenIndex === 68 && realTalk6Data && (
          <RealTalk6EvaluationScreen
            evaluation={realTalk6Evaluation}
            onEvaluationLoaded={setRealTalk6Evaluation}
            conversationSummary={realTalk6Data.conversationSummary}
            errorLog={realTalk6Data.errorLog}
            onNext={() => {
              setRealTalk6Evaluation(null);
              setScreenIndex(69);
            }}
          />
        )}
        {screenIndex === 69 && realTalk6Data && (
          <RealTalk6ErrorReviewScreen
            errorLog={realTalk6Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems6(realTalk6Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 70 : 0);
            }}
          />
        )}
        {screenIndex === 70 && realTalk6Data && (
          <RealTalk6CorrectionPracticeScreen
            items={getCorrectionPracticeItems6(realTalk6Data.errorLog)}
            onComplete={() => {
              setRealTalk6Data(null);
              setScreenIndex(0);
            }}
          />
        )}
        {screenIndex === 71 && <RealTalk7IntroScreen onNext={handleRealTalk7Go} />}
        {screenIndex === 72 && (
          <RealTalk7Screen
            firstPhraseDone={realTalk7FirstPhraseDone}
            firstPhraseInProgress={realTalk7FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk7Data(data);
              setRealTalk7FirstPhraseDone(false);
              setScreenIndex(73);
            }}
          />
        )}
        {screenIndex === 73 && <RealTalk7ImageScreen onNext={() => setScreenIndex(74)} />}
        {screenIndex === 74 && realTalk7Data && (
          <RealTalk7SummaryScreen
            items={realTalk7Data.conversationSummary}
            onNext={() => setScreenIndex(75)}
          />
        )}
        {screenIndex === 75 && realTalk7Data && (
          <RealTalk7EvaluationScreen
            evaluation={realTalk7Evaluation}
            onEvaluationLoaded={setRealTalk7Evaluation}
            conversationSummary={realTalk7Data.conversationSummary}
            errorLog={realTalk7Data.errorLog}
            onNext={() => {
              setRealTalk7Evaluation(null);
              setScreenIndex(76);
            }}
          />
        )}
        {screenIndex === 76 && realTalk7Data && (
          <RealTalk7ErrorReviewScreen
            errorLog={realTalk7Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems7(realTalk7Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 77 : 0);
            }}
          />
        )}
        {screenIndex === 77 && realTalk7Data && (
          <RealTalk7CorrectionPracticeScreen
            items={getCorrectionPracticeItems7(realTalk7Data.errorLog)}
            onComplete={() => {
              setRealTalk7Data(null);
              setScreenIndex(0);
            }}
          />
        )}
      </div>
    </div>
  );
}
