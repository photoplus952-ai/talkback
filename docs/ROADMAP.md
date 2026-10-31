# Work plan

Each milestone is finished only when its acceptance criteria are tested on the owner's phone (Android Chrome) and on a computer.

## M1: Foundation
- [ ] Vite + TS project, PWA, deployed to GitHub Pages (`/talkback/`).
- [ ] Cloudflare Worker: `/chat` (Gemini stream), `/tts`, `/live-token`, `/image`. The key lives in a Worker secret.
- [ ] Design system v3 as CSS tokens and components, plus the floating nav, the icon set, and RTL.
**Done when:** the app installs on the phone, and screens switch through the nav.

## M2: Brain + chat
- [ ] Chat per BRAIN.md: streaming, corrections, words, slang, memory.
- [ ] Gemini TTS per character, speaker button on every message.
- [ ] Recording, with VAD and automatic send.
- [ ] `brain.eval.ts` passes.
**Done when:** a reply starts within 1.5 s, and corrections and humor are as defined.

## M3: Video call (Gemini Live)
- [ ] Ephemeral token, two-way audio, barge-in, karaoke captions, corrections after each turn.
- [ ] High-end animation per ANIMATION.md: video loops (idle, listening, thinking, talking, reactions), visemes with real lip sync, acting by conversation state.
**Done when:** a 5-minute conversation without pauses, she can interrupt, and the character looks alive (60fps, no style jumps, lip delay under 80 ms).

## M4: You 2.0 (high priority)
- [ ] Profile screen (You 2.0 at the top, the Cast below).
- [ ] Photo to 4 characters in the Cast style, background removal, face detection.
- [ ] Voice sample (encrypted, device-only), Modal with Chatterbox, warm-up, Y5 call.
- [ ] Animation loops and visemes for You 2.0, created automatically after the character.
**Done when:** the character looks like part of the Cast, the voice is recognizably hers in English, and nothing is stored outside the device.

## M5: Daily practices
- [ ] Today's practice path.
- [ ] Practices: the character calls, follow-up conversation, 60 seconds, voice diary, Shadowing, describe your design, slang.
- [ ] Day complete, plus XP and streak.

## M6: Coming back every day
- [ ] Reminders (web push), real progress data, weekly summary, wardrobe (phase 1).
