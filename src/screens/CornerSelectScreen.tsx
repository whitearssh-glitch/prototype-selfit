/**
 * Corner Select Screen – choose which corner to go to
 * Four buttons: STEP 1, STEP 2, STEP 3, STEP 4 (→ Real Talk).
 */

export function CornerSelectScreen({
  onSelectStep1,
  onSelectStep2,
  onSelectStep3,
  onSelectStep4,
}: {
  onSelectStep1: () => void;
  onSelectStep2: () => void;
  onSelectStep3: () => void;
  onSelectStep4: () => void;
}) {
  return (
    <div className="corner-select-screen">
      <div className="corner-select-inner">
        <button
          type="button"
          className="corner-select-btn"
          onClick={onSelectStep1}
          aria-label="STEP 1 Patterns"
        >
          STEP 1
        </button>
        <button
          type="button"
          className="corner-select-btn"
          onClick={onSelectStep2}
          aria-label="STEP 2 Speed Up"
        >
          STEP 2
        </button>
        <button
          type="button"
          className="corner-select-btn corner-select-btn--step3"
          onClick={onSelectStep3}
          aria-label="STEP 3 Role Play"
        >
          STEP 3
        </button>
        <button
          type="button"
          className="corner-select-btn corner-select-btn--step3"
          onClick={onSelectStep4}
          aria-label="STEP 4 Real Talk"
        >
          STEP 4
        </button>
      </div>
    </div>
  );
}
