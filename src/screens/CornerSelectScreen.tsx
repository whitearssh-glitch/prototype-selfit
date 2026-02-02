/**
 * Corner Select Screen – choose which corner to go to
 * Get Ready: Patterns, Speed Up / Talk Time: Role Play, Real Talk / Review: Recap
 */

export function CornerSelectScreen({
  onSelectStep1,
  onSelectStep2,
  onSelectStep3,
  onSelectStep4,
  onSelectStep5,
}: {
  onSelectStep1: () => void;
  onSelectStep2: () => void;
  onSelectStep3: () => void;
  onSelectStep4: () => void;
  onSelectStep5: () => void;
}) {
  return (
    <div className="corner-select-screen">
      <div className="corner-select-inner">
        <section className="corner-select-group">
          <h2 className="corner-select-heading">Get Ready</h2>
          <button type="button" className="corner-select-btn" onClick={onSelectStep1} aria-label="Patterns">
            <span className="corner-select-btn-text">Patterns</span>
          </button>
          <button type="button" className="corner-select-btn" onClick={onSelectStep2} aria-label="Speed Up">
            <span className="corner-select-btn-text">Speed Up</span>
          </button>
        </section>
        <section className="corner-select-group">
          <h2 className="corner-select-heading corner-select-heading--talk-time">Talk Time</h2>
          <button type="button" className="corner-select-btn" onClick={onSelectStep3} aria-label="Role Play">
            <span className="corner-select-btn-text">Role Play</span>
          </button>
          <button type="button" className="corner-select-btn" onClick={onSelectStep4} aria-label="Real Talk">
            <span className="corner-select-btn-text">Real Talk</span>
          </button>
        </section>
        <section className="corner-select-group">
          <h2 className="corner-select-heading corner-select-heading--review">Review</h2>
          <button type="button" className="corner-select-btn" onClick={onSelectStep5} aria-label="Recap">
            <span className="corner-select-btn-text">Recap</span>
          </button>
        </section>
      </div>
    </div>
  );
}
