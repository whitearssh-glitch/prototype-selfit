/**
 * Corner Select Screen – choose which corner to go to
 * ver.1: Get Ready / Talk Time / Review | ver.2: Real Talk 2
 */

export function CornerSelectScreen({
  onSelectStep1,
  onSelectStep2,
  onSelectStep3,
  onSelectStep4,
  onSelectStep5,
  onSelectRealTalk2,
}: {
  onSelectStep1: () => void;
  onSelectStep2: () => void;
  onSelectStep3: () => void;
  onSelectStep4: () => void;
  onSelectStep5: () => void;
  onSelectRealTalk2: () => void;
}) {
  return (
    <div className="corner-select-screen">
      <div className="corner-select-inner">
        <div className="corner-select-version">
          <h2 className="corner-select-version-heading">ver.1</h2>
          <div className="corner-select-version-cols">
            <section className="corner-select-group">
              <h3 className="corner-select-heading">Get Ready</h3>
              <div className="corner-select-row">
                <button type="button" className="corner-select-btn" onClick={onSelectStep1} aria-label="Patterns">
                  <span className="corner-select-btn-text">Patterns</span>
                </button>
                <button type="button" className="corner-select-btn" onClick={onSelectStep2} aria-label="Speed Up">
                  <span className="corner-select-btn-text">Speed Up</span>
                </button>
              </div>
            </section>
            <section className="corner-select-group">
              <h3 className="corner-select-heading corner-select-heading--talk-time">Talk Time</h3>
              <div className="corner-select-row">
                <button type="button" className="corner-select-btn" onClick={onSelectStep3} aria-label="Role Play">
                  <span className="corner-select-btn-text">Role Play</span>
                </button>
                <button type="button" className="corner-select-btn" onClick={onSelectStep4} aria-label="Real Talk">
                  <span className="corner-select-btn-text">Real Talk</span>
                </button>
              </div>
            </section>
            <section className="corner-select-group">
              <h3 className="corner-select-heading corner-select-heading--review">Review</h3>
              <button type="button" className="corner-select-btn" onClick={onSelectStep5} aria-label="Recap">
                <span className="corner-select-btn-text">Recap</span>
              </button>
            </section>
          </div>
        </div>
        <hr className="corner-select-divider" aria-hidden />
        <div className="corner-select-version">
          <h2 className="corner-select-version-heading corner-select-version-heading--ver2">ver.2</h2>
          <section className="corner-select-group">
            <button type="button" className="corner-select-btn corner-select-btn--step3" onClick={onSelectRealTalk2} aria-label="Real Talk 2">
              <span className="corner-select-btn-text">Real Talk 2</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
