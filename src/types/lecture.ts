/**
 * Lecture Section – Type Definitions
 * Type A (Lecture Intro) and Type B (Speech Recognition) only.
 * Follows PROGRAM OVERVIEW. No additional screens or variations.
 */

// =============================================================================
// Type A (Lecture Intro) – LAYOUT FIXED
// =============================================================================
// Layout is fixed: topic box, center image (ch.png, fixed), bottom rounded text box,
// Next (after audio ends), tap-to-listen → audio sequence → image shake.
// When adding new Type A screens: only the bottom text (see `text`) changes per screen.
// =============================================================================

export interface LectureScreenTypeA {
  readonly screenType: 'A';
  /** Teacher character image. Path: ch.png */
  readonly imagePath: string;
  /** Text in bottom rounded box (reading only) – only this varies per Type A screen */
  readonly text: string;
  /** Teacher voice audio file name – to be provided later. Do NOT assume. */
  readonly audioFileName?: string;
}

// =============================================================================
// Type B (Speech Recognition) – LAYOUT FIXED
// =============================================================================
// Layout is fixed: topic box, center text (no TTS), bottom mic button,
// Next (after checkmark + ding-dong). Mic → recognition → checkmark + ding-dong → Next.
// When adding new Type B screens: only the center text (see `mainText`) changes per screen.
// =============================================================================

export interface LectureScreenTypeB {
  readonly screenType: 'B';
  /** Main text in center – only this varies per Type B screen */
  readonly mainText: string;
  /** Checkmark image shown after speech recognition */
  readonly checkmarkImagePath?: string;
  /** Short ding-dong sound effect played after recognition */
  readonly soundEffectPath?: string;
}

// =============================================================================
// Union
// =============================================================================

export type LectureScreen = LectureScreenTypeA | LectureScreenTypeB;
