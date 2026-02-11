/**
 * Real Talk 2 – 인덱스 42
 * 화면 컬러·헤더·토픽 영역은 Real Talk 2와 동일.
 * 중앙: Role Play 말풍선 주고받는 디자인 (Cathy ↔ Me 대화).
 * 지구본: 한-영 토글 / 소리: Cathy 말에만 음원 재생.
 * 하단: 보라색 그라데이션 원형 버튼 + 흰색 체크마크 → 클릭 시 인덱스 43으로.
 */

import { useCallback, useState } from 'react';
import { TOPIC_TEXT } from '../App';

type RealTalk2Screen42Props = {
  onNext?: () => void;
};

const CHECKMARK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const CATHY_AVATAR = '/girl.png';
const STUDENT_AVATAR = '/student.png';

type BubbleItem = {
  speaker: 'Cathy' | 'Me';
  textEn: string;
  textKo: string;
  /** Cathy 말만 있음. Me는 액션 없음 */
  audioEn?: string;
  /** true면 표시 텍스트를 한 줄에 유지 */
  singleLine?: boolean;
};

const SCRIPT_42: BubbleItem[] = [
  { speaker: 'Cathy', textEn: "Hi! I'm Cathy. What's your name?", textKo: '안녕! 난 캐시야. 네 이름은 뭐야?', audioEn: '/realtalk1.mp3' },
  { speaker: 'Me', textEn: 'My name is Jake.', textKo: '내 이름은 제이크야.' },
  { speaker: 'Cathy', textEn: 'Oh, nice to meet you.', textKo: '오, 만나서 반가워.', audioEn: '/real2.mp3' },
  { speaker: 'Me', textEn: 'Nice to meet you.', textKo: '만나서 반가워.' },
  { speaker: 'Cathy', textEn: 'Are you a student at this school?', textKo: '넌 이 학교의 학생이야?', audioEn: '/real3.mp3' },
  { speaker: 'Me', textEn: 'I am a student.', textKo: '난 학생이야.' },
  { speaker: 'Cathy', textEn: 'Thanks for answering.\nHow are you feeling today?', textKo: '대답해줘서 고마워. 오늘 기분은 어때?', audioEn: '/real5.mp3' },
  { speaker: 'Me', textEn: "I'm really hungry right now.", textKo: '난 지금 엄청 배가 고파.', singleLine: true },
  { speaker: 'Cathy', textEn: "Haha. Me, too!\nLet's go eat something!", textKo: '하하. 나도야! 뭔가 먹으러 가자!', audioEn: '/real7.mp3' },
];

const GLOBE_ICON_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="10" ry="3" />
    <ellipse cx="12" cy="12" rx="3" ry="10" />
  </svg>
);

const SOUND_ICON_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

export function RealTalk2Screen42({ onNext }: RealTalk2Screen42Props) {
  const [showKo, setShowKo] = useState<boolean[]>(SCRIPT_42.map(() => false));

  const toggleKo = useCallback((idx: number) => {
    setShowKo((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }, []);

  const playAudio = useCallback((src: string) => {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  }, []);

  return (
    <div className="screen-content screen-content--step3-colors-no-frame" data-screen="42">
      <div className="realtalk2-layout realtalk-layout--reserve-go-space">
        <div className="realtalk-top">
          <div className="topic-box topic-box--step3">{TOPIC_TEXT}</div>
        </div>
        <div className="realtalk-main realtalk2-main--roleplay-chat">
          <div className="roleplay-chat">
            {SCRIPT_42.map((item, idx) => (
              <div
                key={idx}
                className={
                  item.speaker === 'Cathy'
                    ? 'roleplay-bubble-row roleplay-bubble-row--character'
                    : 'roleplay-bubble-row roleplay-bubble-row--student'
                }
              >
                <img
                  src={item.speaker === 'Cathy' ? CATHY_AVATAR : STUDENT_AVATAR}
                  alt=""
                  className={'roleplay-avatar' + (item.speaker === 'Me' ? ' roleplay-avatar--student' : '')}
                  aria-hidden
                />
                <div className={'roleplay-bubble-wrap' + (item.singleLine ? ' roleplay-bubble-wrap--single-line' : '')}>
                  <span className="roleplay-name">{item.speaker}</span>
                  <div
                    className={
                      (item.speaker === 'Cathy'
                        ? 'roleplay-bubble roleplay-bubble--character'
                        : 'roleplay-bubble roleplay-bubble--student') +
                      (item.singleLine ? ' roleplay-bubble--single-line' : '')
                    }
                  >
                    {showKo[idx] ? item.textKo : item.textEn}
                  </div>
                  <div className="roleplay-bubble-actions">
                    <button
                      type="button"
                      className="roleplay-k-btn"
                      onClick={() => toggleKo(idx)}
                      aria-label={showKo[idx] ? '영어로 보기' : '한글로 보기'}
                    >
                      {GLOBE_ICON_SVG}
                    </button>
                    <button
                      type="button"
                      className="roleplay-k-btn roleplay-sound-btn"
                      onClick={() => item.audioEn && playAudio(item.audioEn)}
                      aria-label={item.audioEn ? '소리' : '소리 없음'}
                      disabled={!item.audioEn}
                    >
                      {SOUND_ICON_SVG}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="roleplay-chat-bottom">
              <button
                type="button"
                className="roleplay-check-btn"
                onClick={onNext}
                aria-label="다음으로"
              >
                {CHECKMARK_SVG}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
