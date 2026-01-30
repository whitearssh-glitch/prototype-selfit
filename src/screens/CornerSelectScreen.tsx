/**
 * Corner Select Screen – choose which corner to go to
 * Two buttons: STEP 1 (→ Corner Intro 1), STEP 2 (→ Corner Intro 2 / Speed Up).
 */

export function CornerSelectScreen({
  onSelectStep1,
  onSelectStep2,
}: {
  onSelectStep1: () => void;
  onSelectStep2: () => void;
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
      </div>
    </div>
  );
}
