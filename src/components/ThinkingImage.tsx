import { useTtsLoading } from '../hooks/useTtsLoading';

/**
 * 이미지 위에 "생각 중" 오버레이를 표시하는 래퍼
 * - evaluating: OpenAI 응답 대기 (STT 완료 ~ AI 응답)
 * - ttsLoading: TTS fetch 대기 (AI 응답 ~ 오디오 재생 시작)
 * 둘 중 하나라도 true면 이미지를 흐리게 하고 점 애니메이션 표시
 */
export function ThinkingImage({
  src,
  className,
  evaluating = false,
}: {
  src: string;
  className?: string;
  evaluating?: boolean;
}) {
  const ttsLoading = useTtsLoading();
  const thinking = evaluating || ttsLoading;

  return (
    <div className="thinking-image-wrapper">
      <img
        src={src}
        alt=""
        className={(className ?? '') + (thinking ? ' thinking-image--active' : '')}
      />
      {thinking && (
        <div className="thinking-dots-overlay" aria-hidden>
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
      )}
    </div>
  );
}
