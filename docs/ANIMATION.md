# High-end animation (required, especially in video calls)

Goal: characters that feel alive, like an animated film, not a still image with a moving mouth. Free, with no heavy downloads to the device.

## Layer 1: pre-made video loops per character (looks)
- Generate once, from the high-quality images (`assets/characters/*.webp`), using image-to-video (Gemini Veo through the free account, or another tool the owner already has). The character must stay **in the exact same style**: no change to the face, clothes or proportions.
- Loops per character, each 4 to 6 seconds, seamless (first frame = last frame), the character from the waist up, transparent or flat background:
  1. **idle:** breathing, blinking, a slight head and body movement.
  2. **listening:** nodding, attentive look, an occasional small smile.
  3. **thinking:** eyes to the side, a hand on the chin or similar, matching the character.
  4. **talking:** natural head and hand movement while speaking, **mouth closed or neutral**. The mouth comes from layer 2.
  5. **reactions (short, 1.5 to 2 s):** laugh, wow, rolling eyes (Max), thumbs up (Dan), cheering.
- Format: WebM VP9 with alpha plus an HEVC/MP4 fallback for iPhone, 720p, about 1 to 2 MB per loop. Load lazily, only for the active character.
- Smooth transitions between states: a 200 ms crossfade, with a clip-matching frame so it doesn't jump.

## Layer 2: real lip sync (in the browser)
- 8 to 10 mouth shapes (visemes: A, E, I, O, U, M/B/P, F/V, L, rest) per character. Generated once in the exact style and aligned to the mouth position (`mx`, `my`, `mw` in `CHARS`).
- In real time: analyze the audio being played (Web Audio, frequency bands, with `wawa-lipsync` or similar), then pick a viseme at 60fps, with a short blend between shapes.
- The mouth layer follows the head movement in the loop: track points per frame (precomputed into JSON when the loop is generated).
- Without visemes (fallback): the current mouth-opening animation driven by audio level.

## Layer 3: conversation state, the call "acting"
| State | Character | UI |
|---|---|---|
| connecting | idle + soft glow | "connecting..." with a pulse |
| she is talking | listening (nodding when she pauses) | brand-colored sound wave responding to her voice |
| waiting for a reply | thinking (up to about 1 s) | 3 small dots |
| character talking | talking + lip sync | karaoke captions |
| correction | short reaction (e.g. raised eyebrow) | the correction chip pops in with a spring |
| success / laughter | reaction | small celebration on the background |

## Layer 4: in-app motion (UI)
- Spring-based motion (Motion One / Framer Motion), at 60fps:
  - The carousel slide between characters (no fade).
  - Progress rings and bars filling.
  - Elements entering one after another (stagger, 40 ms).
  - The press on a button.
- Day complete: confetti in the brand colors, the ring filling, the character reacting.
- **Always respect `prefers-reduced-motion`.**

## You 2.0
- After her character is created: the same loops and visemes are generated from it automatically (in the background, about 2 minutes, with a "giving you life..." animation). If image-to-video isn't available for free, use LivePortrait on Modal (open source) to create the loops from the image. Free credits, nothing stored except the result on her device.

## Quality checks
- 60fps on a mid-range phone (Chrome DevTools performance check).
- No style jumps between loops, and no "melting" faces in the video. Reject bad loops and generate again.
- Lip sync: audio-to-mouth delay under 80 ms.
