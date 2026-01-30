import { useState, useEffect, useRef } from 'react';
import { TOPIC_TEXT } from '../App';

const AUDIO_FILES = ['/screen1-1.mp3', '/screen1-2.mp3'];

/**
 * Screen 1 – Type A (Lecture Intro)
 * LAYOUT FIXED: topic box, center image (ch.png), bottom text box, Next (after audio). Tap → audio → image shake.
 * Type A center image: ch.png (fixed). When adding more Type A screens: only the bottom text changes.
 */

export function LectureScreen1({ onNext }: { onNext: () => void }) {
  const [audioStarted, setAudioStarted] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentIndexRef = useRef(0);

  // Play screen1-1 then screen1-2 after user tap (browsers block autoplay)
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

  useEffect(() => {
    if (!audioEnded) return;
    const t = setTimeout(onNext, 1200);
    return () => clearTimeout(t);
  }, [audioEnded, onNext]);

  const handleTapToStart = () => {
    if (!audioStarted) setAudioStarted(true);
  };

  return (
    <div className="screen-content" onClick={handleTapToStart} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTapToStart(); }} aria-label="Tap to listen">
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
            <span className="text-box-line">Hello, everyone!</span>
            <span className="text-box-line">Welcome to SELFit!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
