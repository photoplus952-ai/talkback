# Handoff: current state

## What exists
### M1 foundation (new app)
- Vite + TypeScript + Preact PWA at the repo root. `npm run dev`, `npm test` (Vitest), `npm run test:screens` (Playwright, set `PW_CHROMIUM` to a local Chromium if needed), `npm run build`.
  - `src/styles/tokens.css` + `components.css`: design system v3 (tokens, buttons, chips, correction chip, bubbles, week strip, ring, bar, wave, floating nav, toast).
  - `src/components/Icon.tsx`: the single icon set (paths from the v3.2 board, plus upload/camera/shield/refresh/sun/cloud).
  - `src/components/CharacterCard.tsx`: home card with the swipe carousel (slide, no fade; background stays put). Face placement per DESIGN.md.
  - Screens: home, practice, profile (You 2.0 placeholder + Cast), words (empty state), progress, settings, check (server, key, install, mic). Hash routes (`#/words`).
  - App icon: `scripts/make-icons.mjs` draws it (speech bubble in the brand gradient with the brand sound wave) and renders `public/icons/*`. Preview: `docs/design/app-icon.png`.
  - `src/config.ts`: Worker URL (or `VITE_API_URL` / repo variable `API_URL`).
- `worker/`: Cloudflare Worker `talkback-api`. Routes `/health`, `/chat` (SSE, model fallback), `/tts` (WAV), `/live-token` (ephemeral, single use), `/image`. Only allowed origins; no request logging; key in the `GEMINI_API_KEY` secret. Models are `[vars]` in `wrangler.toml`. Tests: `cd worker && npm test`.
- CI: `.github/workflows/deploy-app.yml` (Pages, source must be "GitHub Actions"), `deploy-worker.yml` (needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` repo secrets). Owner steps: `docs/SETUP.md` (Hebrew).
- Not yet verified against the real Gemini API: the `/live-token` request shape and the model names (they come from the docs). Check them at M2/M3.

### The old prototype
- `public/old/index.html`: the working single-file prototype, served at https://photoplus952-ai.github.io/talkback/old/
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
