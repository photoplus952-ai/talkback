# Handoff: current state

## What exists
- `index.html`: a working single-file prototype, deployed at https://photoplus952-ai.github.io/talkback/
  - Screens: home (swipeable character card, week strip, daily progress), characters, character page, chat, video call (mouth animation driven by voice), summary, words, progress, settings, a "check that everything works" screen.
  - AI: Gemini with a key the user pastes (stored in localStorage). Falls back between models.
  - Voices: device voice (per-character pitch), optional Kokoro/Piper locally, and Puter (closed: it asks for a phone number).
  - The design there is still **pre-v3**: lavender. Move it to v3 per DESIGN.md.
- `docs/prototype-template.html`: the prototype source, with `{{cynic}}` and similar placeholders for images. The `CHARS` array there holds personas, quotes, traits, and mouth coordinates (mx, my, mw, a). **Reuse it.**
- `assets/characters/`: high-quality characters (webp, about 1450px), plus `master/` as PNG.
- `figma/`: static versions of the spec and screens for import via html.to.design.

## Lessons learned
- Keyless free AI services (Pollinations, Puter) are unreliable or ask for a phone number. Don't use them.
- Large models on the device (Kokoro, about 90MB) download too slowly. Not in the normal flow.
- A page opened as a file (file://) blocks the microphone and sign-in. Always serve over https.
- AQ.-format keys work on the native Gemini endpoint, not on the OpenAI-compatible one.

## Design
- Design canvas (Claude artifact, owner only): https://claude.ai/artifact/5RiVL2ws4aTEdVsqgwx3z1
- Main boards: "Design system v3", "All screens v3.2 · 18 screens", "You 2.0 · the main character".

## What the owner provides
- A Gemini key from a separate Google account. She pastes it herself into the Worker setup, never in chat.
- A Modal account (Starter, $0 spend limit), only at M4.
