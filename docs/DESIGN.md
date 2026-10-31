# Design system v3 and screens

Visual source of truth: the design canvas, boards "Design system v3", "All screens v3.2" and "You 2.0". If something here conflicts with the boards, the boards win.

## Colors (tokens)
| Token | Value | Role |
|---|---|---|
| ink | #0E0B14 | background |
| surface-1 | #18141F | cards |
| surface-2 | #231D2D | fields, chips, icon buttons |
| line | rgba(255,255,255,.08) | borders |
| text | #F6F3FA | primary text |
| muted | #A39DB3 | secondary text |
| pink | #FF1A6E | brand, primary action, "live" |
| pink-tint | #FF7AA8 | small highlighted text only |
| violet | #7B4DFF | secondary: correct ✓, today, selected, toggles |
| red | #FF4D5E | error (with strikethrough), hang up, recording |
| gradient | 135deg #FF1A6E → #7B4DFF | primary button and progress only |
**No green and no light purple.** Correct = violet + ✓. Error = red + strikethrough. Never rely on color alone.

## Typography
- **Anton:** numbers and English names (DAY 07, NICE TALK., THE CAST).
- **Heebo:** the whole UI. Scale: 28/800 screen title, 20/800 section title, 16/500 body text with line height 1.5, 13 secondary, 12/700 labels.
- **Bricolage Grotesque 600:** all English content, always LTR.

## Sizing
- 4px grid. Spacing: 4, 8, 12, 16, 24, 32. Side margins: 20.
- Radius: 12 for chips, 20 for cards, 28 for character cards, pill for buttons.
- Primary button height 56, secondary 48. Touch targets at least 44×44.

## Icons
- One set (Lucide style): 2px stroke, round corners, 22px default. **No emoji in the UI.**
- The set used on the boards: home, target, user, users, book, chart, gear, speaker, mute, mic, phone (rotated 135° for hang up), video, msg, flame, zap, shirt, check, x, back, play, stop, send, cc, image, upload, camera, shield, lock, star, timer, diary, wave, palette, sparkle, repeat, bell, trash, edit, refresh, sun.

## Components
- **Floating nav bar:** 5 items with icon and label: Home, Practice, Profile, Words, Progress. The active item gets a pink-violet gradient background. Hidden inside a conversation.
- **Character card:** pink gradient, the character from the waist up (positioned by her face: `left = cardW*fx - mx*imgW`), the name large and transparent in the background, a speech bubble. **Switching characters by swipe:** a carousel. The old character slides fully out sideways, the new one slides in from the other side at the same moment, with no fade. The background stays put.
- **Correction chip:** a violet icon, the wrong word in red with strikethrough, the right word in white, a short Hebrew explanation.
- **Sound wave:** thin rounded bars with the brand gradient, and dots at the ends. Responds to the voice.
- **Week strip:** 7 rounded rectangles. ✓ for done, ✕ for missed, a flame for today (violet outline). The day letter sits below.

## UX rules
1. One primary action per screen.
2. Action first, then information.
3. Color never alone.
4. Text contrast at least 4.5:1.
5. Every state is designed: loading, empty, error, no microphone, out of quota.
6. Motion with a purpose, respecting reduced-motion.
7. Microcopy in the feminine, friendly and teasing, always with a next step.

## Screens
Each screen's spec sits next to it on the "All screens v3.2" and "You 2.0" boards. The order is in PRODUCT.md. Notes:
- **Home:**
  - Header: greeting, then a streak chip, then the avatar in the top-left corner, which opens the profile.
  - Below: week strip, character card (swipe), video/chat buttons, then a "Today's practice" card.
- **Today's practice:** a winding path with stations. The current station glows and has a card and a button.
- **Character page:** the character with her bubble, then video/chat buttons, then about, voice and settings (as a list that opens a bottom sheet).
- **Profile:** You 2.0 at the top, then the Cast, then settings via the gear.

## App icon
- Files: `assets/icon/`. Option **B** (dark with pink-violet glow) is the default, and option **A** (brand gradient) is an alternative, until the owner picks.
- Sizes: 1024, 512, 192, 180 (apple-touch-icon), plus `maskable_512` (no badge, content in the safe zone) for Android.
- Character: the owner's character, from the waist up, with a "sound wave" badge in the corner.
</E
