# Corner Intro Screen – UI/Layout Specification

Full-screen corner title card shown **before** Lecture screens. No changes to Lecture Screen 1 (Type A) or Screen 2 (Type B) definitions.

## Screen Order

1. **Corner Intro Screen** (index 0)
2. **Lecture Screen 1** (Type A) (index 1)
3. **Lecture Screen 2** (Type B) (index 2)

## Purpose

- Clearly separate the “corner” from the lecture screens.
- Single full-screen title card.

## Design

| Item | Specification |
|------|---------------|
| **Layout** | Full-screen within app frame (no header on this screen). |
| **Background** | Deep pink base; strong, high-contrast gradient. |
| **Gradient** | `linear-gradient(160deg, #880e4f 0%, #ad1457 35%, #d81b60 70%, #ec407a 100%)` |
| **Content** | Center text only: **Patterns** (verbatim). |
| **Text alignment** | Centered horizontally and vertically. |
| **Text style** | Large title: `font-size: 2.75rem`, `font-weight: 700`, color `#fff`. |
| **Other** | No other text, no UI elements, no microphone. |

## Behavior

| Rule | Specification |
|------|---------------|
| **Auto-advance** | After **2 seconds**, automatically go to the next screen (Lecture Screen 1). |
| **User interaction** | None required. |
| **Timing** | Fixed 2000 ms; deterministic. |

## Output Requirements

- Minimal and deterministic.
- Exact corner title: **Patterns** (no lesson copy generated).
- Lecture Screen 1 and Screen 2 unchanged.
