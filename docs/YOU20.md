# You 2.0: the main character is the user (high priority)

## Experience
1. **Profile:** You 2.0 in a large card at the top (streak, XP, "my voice"), a primary button "talk to myself", and the Cast below in a horizontal scroll. In the nav, "Profile" replaces "Characters". Settings live behind the gear icon in the top corner.
2. **Y1, photo:** upload or take a picture, with a privacy card shown before uploading.
3. **Y2, choose:** 4 versions in **the exact style of the Cast**. They appear one after another, she can ask for more, and picks one.
4. **Y3, voice:** read one sentence aloud, 15 seconds. Then "hear how I sound in English".
5. **Y5, talk to yourself:** a video call with You 2.0, in her voice, with an American accent.

## Photo to character
- Model: Gemini Image (Nano Banana family), through the Worker.
- Input:
  - Her photo.
  - 5 reference images of the Cast (`assets/characters/*.webp`).
  - A prompt: "Same stylized 3D animated style as the reference characters, full body, standing, same rendering, lighting, proportions and line quality; keep her facial features, hairstyle and modest clothing; plain flat background; no text".
- Output: 4 images. Background removal in the browser (`@imgly/background-removal`), giving a transparent PNG at about 1400px height. Then align the frame to the Cast format (aspect about 1.35), and compute `mx`, `my` and `mw` for mouth animation (face detection with MediaPipe Face Landmarker, in the browser).
- **Privacy:** the original photo goes only into this request and is cleared from memory immediately. It is never stored, logged or cached. Only the chosen character is saved, on the device only.
- Quality: reject outputs that are blurry or off-style. Request again automatically, at most twice.

## Her voice, with an American accent, never stored on any platform
- **Sample:** 15 seconds, encrypted with WebCrypto AES-GCM, in IndexedDB. The encryption key is device-only.
- **Generation:** the open-source Chatterbox Multilingual model (MIT) for zero-shot cloning, on **Modal** (serverless GPU, L4).
  - Each request sends the text plus the sample, processed **in memory only**. No writes to disk or Volumes, and no logging of content.
  - The container shuts down automatically after 2 minutes idle.
  - Warm-up: when she enters the You 2.0 screen, the app sends a "wake" request, so by the time she speaks it's ready. Show an elegant "connecting..." animation (up to about 30 s).
- **Accent:** the timbre comes from the sample, and pronunciation comes from the model's English. Test on 3 samples. If the accent is too Hebrew, try exaggeration/cfg settings in the model, or a reference sample in English.
- **Cost:** Modal Starter gives $30 of free credits each month. Set a $0 spend limit beyond that. Estimated usage is $10 to $15 a month. Show a meter on the profile.
- **Never** use ElevenLabs or cloud voice cloning that stores a voice profile.
- In settings: "delete my character" and "delete my voice", each erasing everything in one tap.
