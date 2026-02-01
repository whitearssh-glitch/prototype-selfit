/**
 * Corner Intro Screen – full-screen corner title card
 * Content: step badge (e.g. "STEP 1") + title (e.g. "Patterns"). Advance on tap (no button).
 */

export function CornerIntroScreen({
  step = 'STEP 1',
  title = 'Patterns',
  step1 = false,
  step2 = false,
  step3 = false,
  onNext,
}: {
  step?: string;
  title?: string;
  step1?: boolean;
  step2?: boolean;
  step3?: boolean;
  onNext: () => void;
}) {
  const screenClass = [
    'corner-intro-screen',
    step1 && 'corner-intro-screen--step1',
    step2 && 'corner-intro-screen--step2',
    step3 && 'corner-intro-screen--step3',
  ].filter(Boolean).join(' ');
  return (
    <div className={screenClass} onClick={onNext} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext(); } }} aria-label="Next">
      <div className="corner-intro-inner">
        <span className="corner-intro-step">{step}</span>
        <h1 className="corner-intro-title">{title}</h1>
      </div>
    </div>
  );
}
