# Voices and speech

## Goal
Very authentic American voices, different for each character, fast, free, with no downloads to the device and no "fallback voice" in normal use.

## 1. Video call: Gemini Live (native audio)
- The model hears her and answers in a natural voice in real time. She can interrupt it (barge-in).
- The browser connects over WebSocket with an **ephemeral token** created by the Worker. The key is never in the browser.
- Turn on input and output transcription, for captions and for detecting errors.
- After each turn, a text request with the same transcript returns the `###` JSON (corrections, words, memory). See BRAIN.md.
- Voice per character (choose by ear in a test page; the values below are starting points):
  - Max: `Algenib` / `Zubenelgenubi`
  - Zoe: `Laomedeia` / `Sadachbia`
  - Leo: `Iapetus` / `Rasalgethi`
  - Mia: `Achernar` / `Vindemiatrix`
  - Dan: `Fenrir` / `Alnilam`
- **Accent:** an explicit instruction in the prompt: "General American accent, casual, natural pace".

## 2. Chat and audio in practices: Gemini Flash-Lite TTS
- The model is `gemini-3.8-flash-lite-tts`, falling back to `gemini-3.8-flash-tts`.
- Same voices as above, plus a style instruction per character, e.g. Max: "dry, deadpan, unimpressed but warm".
- One sentence at a time, in parallel, played in order.
- Cache audio per sentence in IndexedDB, so repeated example lines cost nothing.

## 3. Hearing her (speech recognition)
- In video calls: Live transcription.
- In chat and practices: a short recording sent to Gemini (audio in, transcript out). Fallback: Web Speech API.
- End-of-speech detection: VAD in the browser (`@ricky0123/vad-web`, small), with 500 ms of silence.

## 4. Pronunciation (Shadowing)
- Recording, then a request to Gemini with the original audio plus her recording. Returns a per-word score and a short Hebrew tip, as JSON.

## 5. You 2.0 in her own voice: see YOU20.md

## Free tier and quotas
- A separate free Gemini account (the owner creates it). Real limits are visible in AI Studio.
- Show the owner a small daily usage meter on the profile screen.
- When the Live quota runs out: switch to "TTS + transcription" mode, still Gemini voices, so there is still no device voice. Show a short message.
