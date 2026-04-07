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
import { RealTalk11Screen } from './screens/RealTalk11Screen';
import { RealTalk7ImageScreen } from './screens/RealTalk7ImageScreen';
import { RealTalk7SummaryScreen } from './screens/RealTalk7SummaryScreen';
import { RealTalk7EvaluationScreen } from './screens/RealTalk7EvaluationScreen';
import { RealTalk7ErrorReviewScreen } from './screens/RealTalk7ErrorReviewScreen';
import { RealTalk7CorrectionPracticeScreen } from './screens/RealTalk7CorrectionPracticeScreen';
import { RealTalk8Screen } from './screens/RealTalk8Screen';
import { RealTalk9Screen } from './screens/RealTalk9Screen';
import { RealTalk10Screen } from './screens/RealTalk10Screen';
import { TtsSettingsPanel } from './screens/TtsSettingsPanel';
import type { TtsVoiceConfigKey } from './ttsVoiceSettings';
import { getCathyFirstPhrase } from './realTalk3Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase4 } from './realTalk4Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase5 } from './realTalk5Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase6 } from './realTalk6Gemini';
import { getCathyFirstPhrase as getCathyFirstPhrase7 } from './realTalk7Gemini';
import { speakRealTalk3, speakRealTalk4, speakRealTalk5, stopSpeaking } from './realTalk3TTS';
import { speak as speak6, stopSpeaking as stopSpeaking6 } from './realTalk6TTS';
import { speak as speak7, stopSpeaking as stopSpeaking7 } from './realTalk7TTS';
import { unlockAudioContext } from './ttsPlayer';
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
const LAST_SEQUENTIAL_SCREEN_INDEX = 106;
function getInitialScreenIndex(): number {
  if (typeof window === 'undefined') return 0;
  const hash = window.location.hash.slice(1); // '#' 제거
  if (hash === 'speed-up') return 9;
  const n = parseInt(hash, 10);
  if (!Number.isNaN(n) && n >= 0 && n <= LAST_SEQUENTIAL_SCREEN_INDEX) return n;
  return 0;
}

function getTtsVoiceKey(idx: number): TtsVoiceConfigKey | null {
  if (idx >= 50 && idx <= 56) return 'basicRealTalk4';
  if (idx >= 57 && idx <= 63) return 'basicRealTalk5';
  if (idx >= 64 && idx <= 70) return 'intermediate';
  if (idx >= 71 && idx <= 77) return 'advanced';
  if (idx >= 79 && idx <= 85) return 'basicRealTalk4';
  if (idx >= 86 && idx <= 92) return 'basicRealTalk5';
  if (idx >= 93 && idx <= 99) return 'intermediate';
  if (idx >= 100 && idx <= 106) return 'advanced';
  return null;
}

export default function App() {
  const [screenIndex, setScreenIndex] = useState(getInitialScreenIndex);
  const [ttsSettingsOpen, setTtsSettingsOpen] = useState(false);
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
  const [realTalk8Data, setRealTalk8Data] = useState<RealTalk4Data | null>(null);
  const [realTalk8Evaluation, setRealTalk8Evaluation] = useState<SessionEvaluation4 | null>(null);
  const [realTalk8FirstPhraseDone, setRealTalk8FirstPhraseDone] = useState(false);
  const [realTalk8FirstPhraseInProgress, setRealTalk8FirstPhraseInProgress] = useState(false);
  const [realTalk9Data, setRealTalk9Data] = useState<RealTalk5Data | null>(null);
  const [realTalk9Evaluation, setRealTalk9Evaluation] = useState<SessionEvaluation5 | null>(null);
  const [realTalk9FirstPhraseDone, setRealTalk9FirstPhraseDone] = useState(false);
  const [realTalk9FirstPhraseInProgress, setRealTalk9FirstPhraseInProgress] = useState(false);
  const [realTalk10Data, setRealTalk10Data] = useState<RealTalk6Data | null>(null);
  const [realTalk10Evaluation, setRealTalk10Evaluation] = useState<SessionEvaluation6 | null>(null);
  const [realTalk10FirstPhraseDone, setRealTalk10FirstPhraseDone] = useState(false);
  const [realTalk10FirstPhraseInProgress, setRealTalk10FirstPhraseInProgress] = useState(false);
  const [realTalk11Data, setRealTalk11Data] = useState<RealTalk7Data | null>(null);
  const [realTalk11Evaluation, setRealTalk11Evaluation] = useState<SessionEvaluation7 | null>(null);
  const [realTalk11FirstPhraseDone, setRealTalk11FirstPhraseDone] = useState(false);
  const [realTalk11FirstPhraseInProgress, setRealTalk11FirstPhraseInProgress] = useState(false);

  const goNext = () =>
    setScreenIndex((i) => (i < LAST_SEQUENTIAL_SCREEN_INDEX ? i + 1 : i));
  const isStep3 =
    screenIndex === 25 ||
    screenIndex === 26 ||
    screenIndex === 27 ||
    screenIndex === 28 ||
    screenIndex === 29 ||
    screenIndex === 30 ||
    screenIndex === 31 ||
    (screenIndex >= 36 && screenIndex <= 49) ||
    (screenIndex >= 50 && screenIndex <= 77) ||
    (screenIndex >= 79 && screenIndex <= 106);
  const appStep3Class = isStep3 ? ' app--step3-colors-no-frame' : '';
  const isStep1OrStep2 = screenIndex >= 1 && screenIndex <= 24;
  const isStep5 = screenIndex === 32 || screenIndex === 33 || screenIndex === 34 || screenIndex === 35;

  /* 코너 선택(0)·TTS 테스트(78): body·html 여백 분홍+청보라+노랑 / 스텝1·2: 연한 분홍 / 스텝3·4: 청보라 / 스텝5: 파스텔 보라-노랑 */
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
    if (screenIndex === 71) {
      setRealTalk7FirstPhraseDone(false);
      setRealTalk7FirstPhraseInProgress(false);
    }
    if (screenIndex === 79) {
      setRealTalk8FirstPhraseDone(false);
      setRealTalk8FirstPhraseInProgress(false);
    }
    if (screenIndex === 86) {
      setRealTalk9FirstPhraseDone(false);
      setRealTalk9FirstPhraseInProgress(false);
    }
    if (screenIndex === 93) {
      setRealTalk10FirstPhraseDone(false);
      setRealTalk10FirstPhraseInProgress(false);
    }
    if (screenIndex === 100) {
      setRealTalk11FirstPhraseDone(false);
      setRealTalk11FirstPhraseInProgress(false);
    }
  }, [screenIndex]);

  const prevScreenRef = useRef(screenIndex);
  useEffect(() => {
    if (prevScreenRef.current === 44 && screenIndex !== 44) stopSpeaking();
    if (prevScreenRef.current === 51 && screenIndex !== 51) stopSpeaking();
    if (prevScreenRef.current === 58 && screenIndex !== 58) stopSpeaking();
    if (prevScreenRef.current === 65 && screenIndex !== 65) stopSpeaking6();
    if (prevScreenRef.current === 72 && screenIndex !== 72) stopSpeaking7();
    if (prevScreenRef.current === 80 && screenIndex !== 80) stopSpeaking();
    if (prevScreenRef.current === 87 && screenIndex !== 87) stopSpeaking();
    if (prevScreenRef.current === 94 && screenIndex !== 94) stopSpeaking6();
    if (prevScreenRef.current === 101 && screenIndex !== 101) stopSpeaking7();
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
    unlockAudioContext();
    const first = getCathyFirstPhrase4();
    setRealTalk4FirstPhraseInProgress(true);
    speakRealTalk4(first.en, () => {
      setRealTalk4FirstPhraseDone(true);
      setRealTalk4FirstPhraseInProgress(false);
    });
    setScreenIndex(51);
  };

  const handleRealTalk5Go = () => {
    unlockAudioContext();
    const first = getCathyFirstPhrase5();
    setRealTalk5FirstPhraseInProgress(true);
    speakRealTalk5(first.en, () => {
      setRealTalk5FirstPhraseDone(true);
      setRealTalk5FirstPhraseInProgress(false);
    });
    setScreenIndex(58);
  };

  const handleRealTalk6Go = () => {
    unlockAudioContext();
    const first = getCathyFirstPhrase6();
    setRealTalk6FirstPhraseInProgress(true);
    speak6(first.en, () => {
      setRealTalk6FirstPhraseDone(true);
      setRealTalk6FirstPhraseInProgress(false);
    });
    setScreenIndex(65);
  };

  const handleRealTalk7Go = () => {
    unlockAudioContext();
    const first = getCathyFirstPhrase7();
    setRealTalk7FirstPhraseInProgress(true);
    speak7(first.en, () => {
      setRealTalk7FirstPhraseDone(true);
      setRealTalk7FirstPhraseInProgress(false);
    });
    setScreenIndex(72);
  };

  const handleRealTalk8Go = () => {
    unlockAudioContext();
    const first = getCathyFirstPhrase4();
    setRealTalk8FirstPhraseInProgress(true);
    speakRealTalk4(first.en, () => {
      setRealTalk8FirstPhraseDone(true);
      setRealTalk8FirstPhraseInProgress(false);
    });
    setScreenIndex(80);
  };

  const handleRealTalk9Go = () => {
    unlockAudioContext();
    const first = getCathyFirstPhrase5();
    setRealTalk9FirstPhraseInProgress(true);
    speakRealTalk5(first.en, () => {
      setRealTalk9FirstPhraseDone(true);
      setRealTalk9FirstPhraseInProgress(false);
    });
    setScreenIndex(87);
  };

  const handleRealTalk10Go = () => {
    unlockAudioContext();
    const first = getCathyFirstPhrase6();
    setRealTalk10FirstPhraseInProgress(true);
    speak6(first.en, () => {
      setRealTalk10FirstPhraseDone(true);
      setRealTalk10FirstPhraseInProgress(false);
    });
    setScreenIndex(94);
  };

  const handleRealTalk11Go = () => {
    unlockAudioContext();
    const first = getCathyFirstPhrase7();
    setRealTalk11FirstPhraseInProgress(true);
    speak7(first.en, () => {
      setRealTalk11FirstPhraseDone(true);
      setRealTalk11FirstPhraseInProgress(false);
    });
    setScreenIndex(101);
  };

  return (
    <div className={'app' + appCornerSelectClass + appStep1Class + appStep3Class + appStep5Class + realtalkFixedHeightClass}>
        {screenIndex > 0 &&
        screenIndex !== 1 &&
        screenIndex !== 9 &&
        screenIndex !== 25 &&
        screenIndex !== 29 &&
        screenIndex !== 32 &&
        (
        <header className={'app-header' + (screenIndex >= 2 && screenIndex <= 24 ? ' app-header--step1' : '') + (isStep3 ? ' app-header--step3' : '') + (screenIndex === 33 || screenIndex === 34 || screenIndex === 35 ? ' app-header--step5' : '')}>
          <button type="button" className="app-header-back" onClick={() => setScreenIndex(0)}>
            Back
          </button>
          <span className="app-header-text">{screenIndex >= 100 && screenIndex <= 106 ? 'Advanced 01 Day 01' : screenIndex >= 71 && screenIndex <= 77 ? 'Advanced 01 Day 01' : screenIndex >= 93 && screenIndex <= 99 ? 'Inter 01 Day 01' : screenIndex >= 64 && screenIndex <= 70 ? 'Inter 01 Day 01' : screenIndex >= 86 && screenIndex <= 92 ? 'Basic 01 Day 01' : screenIndex >= 79 && screenIndex <= 85 ? 'Basic 05 Day 01' : screenIndex >= 57 && screenIndex <= 63 ? 'Basic 01 Day 01' : screenIndex >= 50 && screenIndex <= 56 ? 'Basic 05 Day 01' : HEADER_TITLE}</span>
          {getTtsVoiceKey(screenIndex) && (
            <button type="button" className="app-header-tts-setting" onClick={() => setTtsSettingsOpen(true)}>
              TTS
            </button>
          )}
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
            onSelectRealTalk8={() => setScreenIndex(79)}
            onSelectRealTalk9={() => setScreenIndex(86)}
            onSelectRealTalk10={() => setScreenIndex(93)}
            onSelectRealTalk11={() => setScreenIndex(100)}
          />
        )}
        {ttsSettingsOpen && getTtsVoiceKey(screenIndex) && (
          <TtsSettingsPanel
            voiceKey={getTtsVoiceKey(screenIndex)!}
            onClose={() => setTtsSettingsOpen(false)}
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
        {screenIndex === 79 && <RealTalk4IntroScreen onNext={handleRealTalk8Go} />}
        {screenIndex === 80 && (
          <RealTalk8Screen
            firstPhraseDone={realTalk8FirstPhraseDone}
            firstPhraseInProgress={realTalk8FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk8Data(data);
              setRealTalk8FirstPhraseDone(false);
              setScreenIndex(81);
            }}
          />
        )}
        {screenIndex === 81 && <RealTalk4ImageScreen onNext={() => setScreenIndex(82)} />}
        {screenIndex === 82 && realTalk8Data && (
          <RealTalk4SummaryScreen
            items={realTalk8Data.conversationSummary}
            onNext={() => setScreenIndex(83)}
          />
        )}
        {screenIndex === 83 && realTalk8Data && (
          <RealTalk4EvaluationScreen
            evaluation={realTalk8Evaluation}
            onEvaluationLoaded={setRealTalk8Evaluation}
            conversationSummary={realTalk8Data.conversationSummary}
            errorLog={realTalk8Data.errorLog}
            onNext={() => {
              setRealTalk8Evaluation(null);
              setScreenIndex(84);
            }}
          />
        )}
        {screenIndex === 84 && realTalk8Data && (
          <RealTalk4ErrorReviewScreen
            errorLog={realTalk8Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems4(realTalk8Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 85 : 0);
            }}
          />
        )}
        {screenIndex === 85 && realTalk8Data && (
          <RealTalk4CorrectionPracticeScreen
            items={getCorrectionPracticeItems4(realTalk8Data.errorLog)}
            onComplete={() => {
              setRealTalk8Data(null);
              setScreenIndex(0);
            }}
          />
        )}
        {screenIndex === 86 && <RealTalk5IntroScreen onNext={handleRealTalk9Go} />}
        {screenIndex === 87 && (
          <RealTalk9Screen
            firstPhraseDone={realTalk9FirstPhraseDone}
            firstPhraseInProgress={realTalk9FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk9Data(data);
              setRealTalk9FirstPhraseDone(false);
              setScreenIndex(88);
            }}
          />
        )}
        {screenIndex === 88 && <RealTalk5ImageScreen onNext={() => setScreenIndex(89)} />}
        {screenIndex === 89 && realTalk9Data && (
          <RealTalk5SummaryScreen
            items={realTalk9Data.conversationSummary}
            onNext={() => setScreenIndex(90)}
          />
        )}
        {screenIndex === 90 && realTalk9Data && (
          <RealTalk5EvaluationScreen
            evaluation={realTalk9Evaluation}
            onEvaluationLoaded={setRealTalk9Evaluation}
            conversationSummary={realTalk9Data.conversationSummary}
            errorLog={realTalk9Data.errorLog}
            onNext={() => {
              setRealTalk9Evaluation(null);
              setScreenIndex(91);
            }}
          />
        )}
        {screenIndex === 91 && realTalk9Data && (
          <RealTalk5ErrorReviewScreen
            errorLog={realTalk9Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems5(realTalk9Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 92 : 0);
            }}
          />
        )}
        {screenIndex === 92 && realTalk9Data && (
          <RealTalk5CorrectionPracticeScreen
            items={getCorrectionPracticeItems5(realTalk9Data.errorLog)}
            onComplete={() => {
              setRealTalk9Data(null);
              setScreenIndex(0);
            }}
          />
        )}
        {screenIndex === 93 && <RealTalk6IntroScreen onNext={handleRealTalk10Go} />}
        {screenIndex === 94 && (
          <RealTalk10Screen
            firstPhraseDone={realTalk10FirstPhraseDone}
            firstPhraseInProgress={realTalk10FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk10Data(data);
              setRealTalk10FirstPhraseDone(false);
              setScreenIndex(95);
            }}
          />
        )}
        {screenIndex === 95 && <RealTalk6ImageScreen onNext={() => setScreenIndex(96)} />}
        {screenIndex === 96 && realTalk10Data && (
          <RealTalk6SummaryScreen
            items={realTalk10Data.conversationSummary}
            onNext={() => setScreenIndex(97)}
          />
        )}
        {screenIndex === 97 && realTalk10Data && (
          <RealTalk6EvaluationScreen
            evaluation={realTalk10Evaluation}
            onEvaluationLoaded={setRealTalk10Evaluation}
            conversationSummary={realTalk10Data.conversationSummary}
            errorLog={realTalk10Data.errorLog}
            onNext={() => {
              setRealTalk10Evaluation(null);
              setScreenIndex(98);
            }}
          />
        )}
        {screenIndex === 98 && realTalk10Data && (
          <RealTalk6ErrorReviewScreen
            errorLog={realTalk10Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems6(realTalk10Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 99 : 0);
            }}
          />
        )}
        {screenIndex === 99 && realTalk10Data && (
          <RealTalk6CorrectionPracticeScreen
            items={getCorrectionPracticeItems6(realTalk10Data.errorLog)}
            onComplete={() => {
              setRealTalk10Data(null);
              setScreenIndex(0);
            }}
          />
        )}
        {screenIndex === 100 && <RealTalk7IntroScreen onNext={handleRealTalk11Go} />}
        {screenIndex === 101 && (
          <RealTalk11Screen
            firstPhraseDone={realTalk11FirstPhraseDone}
            firstPhraseInProgress={realTalk11FirstPhraseInProgress}
            onComplete={(data) => {
              setRealTalk11Data(data);
              setRealTalk11FirstPhraseDone(false);
              setScreenIndex(102);
            }}
          />
        )}
        {screenIndex === 102 && <RealTalk7ImageScreen onNext={() => setScreenIndex(103)} />}
        {screenIndex === 103 && realTalk11Data && (
          <RealTalk7SummaryScreen
            items={realTalk11Data.conversationSummary}
            onNext={() => setScreenIndex(104)}
          />
        )}
        {screenIndex === 104 && realTalk11Data && (
          <RealTalk7EvaluationScreen
            evaluation={realTalk11Evaluation}
            onEvaluationLoaded={setRealTalk11Evaluation}
            conversationSummary={realTalk11Data.conversationSummary}
            errorLog={realTalk11Data.errorLog}
            onNext={() => {
              setRealTalk11Evaluation(null);
              setScreenIndex(105);
            }}
          />
        )}
        {screenIndex === 105 && realTalk11Data && (
          <RealTalk7ErrorReviewScreen
            errorLog={realTalk11Data.errorLog}
            onNext={() => {
              const practiceItems = getCorrectionPracticeItems7(realTalk11Data!.errorLog);
              setScreenIndex(practiceItems.length > 0 ? 106 : 0);
            }}
          />
        )}
        {screenIndex === 106 && realTalk11Data && (
          <RealTalk7CorrectionPracticeScreen
            items={getCorrectionPracticeItems7(realTalk11Data.errorLog)}
            onComplete={() => {
              setRealTalk11Data(null);
              setScreenIndex(0);
            }}
          />
        )}
      </div>
    </div>
  );
}
