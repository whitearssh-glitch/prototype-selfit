/**
 * Corner Intro Screen – full-screen corner title card
 * Content: step badge (e.g. "STEP 1") + title (e.g. "Patterns"). Advance on tap (no button).
 */

export function CornerIntroScreen({
  step = 'STEP 1',
  title = 'Patterns',
  onNext,
}: {
  step?: string;
  title?: string;
  onNext: () => void;
}) {
  return (
    <div className="corner-intro-screen" onClick={onNext} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNext(); } }} aria-label="Next">
      <div className="corner-intro-inner">
        <span className="corner-intro-step">{step}</span>
        <h1 className="corner-intro-title">{title}</h1>
      </div>
    </div>
  );
}
