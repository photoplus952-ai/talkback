# TALKBACK: instructions for Claude Code

An app that turns basic English into fluent spoken American English in 30 days. Used by one person (the owner), in Hebrew, addressed in the feminine. Goals: travel, and work as a graphic designer.

## Read these before every task
- `docs/PRODUCT.md`: the product, the method, the screens, the daily practices
- `docs/DESIGN.md`: design system v3, UX rules, specs for every screen
- `docs/BRAIN.md`: the characters' brain: prompts, corrections, humor, slang, memory, output format
- `docs/VOICE.md`: voices and speech: Gemini Live, Gemini TTS, speech recognition
- `docs/ANIMATION.md`: **high priority.** High-end animation for the characters, especially in video calls
- `docs/YOU20.md`: **high priority.** The main character is the user: photo to character, her own voice
- `docs/ROADMAP.md`: milestones, with acceptance criteria for each
- `docs/HANDOFF.md`: what already exists in the code, what works and what doesn't

Visual reference: `docs/design/*.html` (open in a browser). These are exports of the design canvas boards and the source of truth.

## Hard rules
1. **Privacy:**
   - The original photo is never saved, not even on our server.
   - The voice sample is saved encrypted on the device only.
   - Conversations and memory are stored on the device only.
   - API keys never sit in code that reaches the browser. They live in Cloudflare Worker secrets.
2. **Free:**
   - Gemini API: a free account, created separately by the owner.
   - Cloudflare Workers: free plan.
   - Modal: within the $30 monthly free credits, with a $0 spend limit beyond them.
   - No paid subscriptions.
3. **No big downloads** to the device and no "fallback voice" in the normal flow. Voices come from the cloud.
4. **Speed:** first audio within 1.5 s of the end of her speech. Measure and log it.
5. **UI in Hebrew (RTL), addressed in the feminine.** All English content renders LTR, in Bricolage Grotesque.
6. **High-end animation:** characters feel alive (video loops, real lip sync, acting by conversation state). Per ANIMATION.md.
7. **High-quality characters only.** Use `assets/characters/*.webp` (about 1450px, quality 90) or the PNG masters in `assets/characters/master/`. Never compress or shrink them.
8. **Clean content:** respectful, modest, appropriate characters and topics.
9. **Owner communication:** short, in Hebrew, no technical jargon. Ask only about real product decisions.

## Technical stack (recommended)
- Vite + TypeScript + Preact (or React), installable as a PWA, deployed on GitHub Pages.
- Server: Cloudflare Worker (free) as a proxy for Gemini (text, TTS, ephemeral Live tokens) and Modal.
- On-device storage: IndexedDB (idb-keyval). The voice sample is encrypted with WebCrypto AES-GCM.
- Tests: Vitest, and Playwright for screen tests.
