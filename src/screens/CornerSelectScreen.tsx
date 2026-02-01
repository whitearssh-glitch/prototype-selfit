/**
 * Corner Select Screen – choose which corner to go to
 * Three buttons: STEP 1, STEP 2, STEP 3 (→ Corner Intro 3 / Role Play).
 */

export function CornerSelectScreen({
  onSelectStep1,
  onSelectStep2,
  onSelectStep3,
}: {
  onSelectStep1: () => void;
  onSelectStep2: () => void;
  onSelectStep3: () => void;
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
      </div>
    </div>
  );
}
