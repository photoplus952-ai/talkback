# Handoff: current state

## What exists
### M1 foundation (new app)
- Vite + TypeScript + Preact PWA at the repo root. `npm run dev`, `npm test` (Vitest), `npm run test:screens` (Playwright, set `PW_CHROMIUM` to a local Chromium if needed), `npm run build`.
  - `src/styles/tokens.css` + `components.css`: design system v3 (tokens, buttons, chips, correction chip, bubbles, week strip, ring, bar, wave, floating nav, toast).
  - `src/components/Icon.tsx`: the single icon set (paths from the v3.2 board, plus upload/camera/shield/refresh/sun/cloud).
  - `src/components/CharacterCard.tsx`: home card with the swipe carousel (slide, no fade; background stays put). Face placement per DESIGN.md.
  - Screens: home, practice, profile (You 2.0 placeholder + Cast), words (empty state), progress, settings, check (server, key, install, mic). Hash routes (`#/words`).
  - App icon: the owner-approved icon from `assets/icon/` (see DESIGN.md), copied to `public/icons/` (192, 512, maskable 512, apple-touch 180).
  - `src/config.ts`: Worker URL (or `VITE_API_URL` / repo variable `API_URL`).
- `worker/`: Cloudflare Worker `talkback-api`. Routes `/health`, `/chat` (SSE, model fallback), `/tts` (WAV), `/live-token` (ephemeral, single use), `/image`. Only allowed origins; no request logging; key in the `GEMINI_API_KEY` secret. Models are `[vars]` in `wrangler.toml`. Tests: `cd worker && npm test`.
- CI: `.github/workflows/deploy-app.yml` (Pages, source must be "GitHub Actions"), `deploy-worker.yml` (needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` repo secrets). Owner steps: `docs/SETUP.md` (Hebrew).
- Not yet verified against the real Gemini API: the `/live-token` request shape and the model names (they come from the docs). Check them at M2/M3.

### M2 chat (first version)
- `src/screens/Chat.tsx` (`#/chat/<id>`): streaming reply, `###` meta parsed (`src/brain/parse.ts`), correction chips under her message, new-word chips, speaker button, auto-read (Gemini TTS sentence by sentence, cached in IndexedDB), mic with an energy VAD (500 ms silence, no model download) and `/transcribe`.
- Prompt from BRAIN.md in `src/brain/prompt.ts` (gentle mode, last 10 openers avoided). Memory (`src/data/memory.ts`, max 50, dedup, 5 most relevant injected) and words (`src/data/words.ts`) live in IndexedDB.
- Speed is logged on the device (`src/lib/metrics.ts`, key `metrics`): first token, transcribe, TTS, first audio. The voice path is record → transcribe → chat → TTS, so first audio under 1.5 s is not yet guaranteed: measure on the phone.
- Not done yet from M2: `tests/brain.eval.ts` against the real model, slang list, conversation summary screen.

### You 2.0, photo part (first version)
- `src/screens/You.tsx` (`#/you`): privacy card, camera/gallery, photo downscaled to 512 in memory only and dropped after use, 4 parallel `/image` calls, pick one, saved in IndexedDB only. Shown on the profile; delete in settings.
- Image engine: FLUX.2 on Workers AI (free daily allocation on the owner's Cloudflare account, `[ai]` binding, `IMAGE_PROVIDER = "workers-ai"`). Gemini image generation is not free, so it is only a switchable fallback. References: 3 Cast images placed on the green screen at 384x512 (image 0-2) + her photo (image 3).
- Background: the model draws on a chroma-green screen; `src/lib/cutout.ts` removes it on the device (flood fill from the borders, soft edge, despill), crops and frames like the Cast (aspect ~1.37) and estimates mx/my. Off-style results (no green screen) are requested again, at most twice. Lighting is described in the prompt (dark, low-key, hot-pink rim light).
- Not done yet: real face/mouth detection (mx/my is estimated), voice (Modal), animation loops.

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
