import { useState, useEffect, useRef } from 'react';
import { TOPIC_TEXT } from '../App';

const AUDIO_FILES = ['/screen7-1.mp3', '/screen7-2.mp3'];
const STAMP_AUDIO = '/fb5.mp3';

/**
 * Screen 7 – Type A (Lecture Intro)
 * LAYOUT FIXED: topic box, center image (ch.png), bottom text box, Next (after audio). Tap → audio (2 files) → image shake.
 * Bottom text: Let's move on. / Here we go!
 */

export function LectureScreen7({ onNext }: { onNext: () => void }) {
  const [audioStarted, setAudioStarted] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nextClicked, setNextClicked] = useState(false);
  const [showStampPopup, setShowStampPopup] = useState(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!audioEnded) return;
    const t = setTimeout(() => setNextClicked(true), 1200);
    return () => clearTimeout(t);
  }, [audioEnded]);

  useEffect(() => {
    if (!nextClicked) return;
    const t = setTimeout(() => setShowStampPopup(true), 250);
    return () => clearTimeout(t);
  }, [nextClicked]);

  useEffect(() => {
    if (!showStampPopup) return;
    const audio = new Audio(STAMP_AUDIO);
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [showStampPopup]);

  useEffect(() => {
    if (!audioStarted) return;
    const playNext = () => {
      if (currentIndexRef.current >= AUDIO_FILES.length) {
        setIsPlaying(false);
        setAudioEnded(true);
        return;
      }
      const audio = new Audio(AUDIO_FILES[currentIndexRef.current]);
      audio.onended = () => {
        currentIndexRef.current += 1;
        playNext();
      };
      audio.onerror = () => {
        currentIndexRef.current += 1;
        playNext();
      };
      setIsPlaying(true);
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    playNext();
  }, [audioStarted]);

  const handleTapToStart = () => {
    if (!audioStarted) setAudioStarted(true);
  };

  return (
    <div className="screen-content" onClick={handleTapToStart} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTapToStart(); }} aria-label="Tap to listen">
      {showStampPopup && (
        <div className="screen7-stamp-popup" role="button" tabIndex={0} aria-label="다음으로" onClick={(e) => { e.stopPropagation(); onNext(); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext(); } }}>
          <div className="screen7-stamp-circle">
            <svg className="screen7-stamp-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="stamp-small-star" d="M0 -2.1 L0.5 -0.5 L2.2 -0.5 L0.8 0.5 L1.3 2.1 L0 1.1 L-1.3 2.1 L-0.8 0.5 L-2.2 -0.5 L-0.5 -0.5 Z" fill="#fff" />
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="3" />
              {/* 작은 별 10개: 위·아래 반원 동일 30° 간격, r=44로 테두리와 간격 확보, 크기 2배 */}
              <use href="#stamp-small-star" transform="translate(98, 38) scale(2)" />
              <use href="#stamp-small-star" transform="translate(82, 22) scale(2)" />
              <use href="#stamp-small-star" transform="translate(60, 16) scale(2)" />
              <use href="#stamp-small-star" transform="translate(38, 22) scale(2)" />
              <use href="#stamp-small-star" transform="translate(22, 38) scale(2)" />
              <use href="#stamp-small-star" transform="translate(22, 82) scale(2)" />
              <use href="#stamp-small-star" transform="translate(38, 98) scale(2)" />
              <use href="#stamp-small-star" transform="translate(60, 104) scale(2)" />
              <use href="#stamp-small-star" transform="translate(82, 98) scale(2)" />
              <use href="#stamp-small-star" transform="translate(98, 82) scale(2)" />
              <text x="60" y="62" textAnchor="middle" dominantBaseline="central" className="screen7-stamp-text" fill="#fff">GOOD!</text>
            </svg>
          </div>
        </div>
      )}
      <div className="screen-center">
        <div className="topic-box">{TOPIC_TEXT}</div>
        <div className="screen-main screen-main--vertical-center">
          <img
            src="/ch.png"
            alt="Teacher"
            className={`teacher-image ${isPlaying ? 'teacher-image--shake' : ''}`}
          />
        </div>
        <div className="screen-bottom">
          <div className="text-box text-box-two-lines">
            <span className="text-box-line">Let&apos;s move on.</span>
            <span className="text-box-line">Here we go!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
