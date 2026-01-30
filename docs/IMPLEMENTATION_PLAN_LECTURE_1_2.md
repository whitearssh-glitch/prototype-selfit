# Implementation Plan – Lecture Screen 1 & Screen 2 Only

## Scope
- **Screen 1**: Type A (Lecture Intro) – teacher image, text box, Next only.
- **Screen 2**: Type B (Speech Recognition) – center text, TTS → mic → recognition → checkmark + sound → Next active.
- No other screens. No lesson copy generated; only the exact copy provided.

## Stack
- React 18 + TypeScript + Vite.
- Single-page app: current screen index 0 or 1.

## Global Layout (PROGRAM OVERVIEW)
- **Top**: Book/topic line (e.g. Basic 01 Day 01 / TOPIC: Self-introduction).
- **Center**: Main content (image or text).
- **Bottom**: Rounded text box (Screen 1) or microphone button (Screen 2).
- **Right**: Next button (inactive on Screen 2 until after recognition).
- **Design**: Clean, simple; pink gradient background.

## Screen 1 (Type A)
- Center: `selena.png` (teacher character).
- Bottom: Rounded text box with verbatim copy:  
  `Hello, everyone!`  
  `Welcome to SELFit!`
- Right: Next button (always active). Click → go to Screen 2.
- No microphone. No audio file names. Teacher voice audio added later.

## Screen 2 (Type B)
- Center: Verbatim text: `Hello, SELENA!`
- **TTS**: On mount, auto-play once using browser SpeechSynthesis. No audio file.
- **Mic**: Shown only after TTS ends. Student presses mic → start Web Speech API recognition; recognition ends when student stops speaking.
- **After recognition**: Show checkmark (inline SVG), play short ding-dong (Web Audio API), enable Next.
- Right: Next button initially inactive; after recognition, active. Click → next screen (no Screen 3; can stay or loop for demo).

## Assets
- **selena.png**: Served from `public/selena.png` (path `/selena.png`). Ensure file is in `public/`.
- **Checkmark**: Inline SVG (no file).
- **Ding-dong**: Synthesized with Web Audio (no file).
- No teacher audio file names generated or assumed.

## Copy (verbatim only)
- Screen 1 bottom box: `Hello, everyone!\nWelcome to SELFit!`
- Screen 2 center: `Hello, SELENA!`
