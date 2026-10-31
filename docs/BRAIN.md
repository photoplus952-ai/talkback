# The characters' brain

## Model
- Gemini API, through the Cloudflare Worker.
- Order: `gemini-3.5-flash-lite` with `thinkingLevel: "minimal"`, falling back to `gemini-3.6-flash` with `minimal`.
- Always streamed (`streamGenerateContent?alt=sse`). The voice starts at the end of the first sentence.
- Keys: new keys start with `AQ.` (older ones with `AIza`). Both work on the native endpoint with the `x-goog-api-key` header. **Do not use the OpenAI-compatible endpoint.**
- In video calls, use Gemini Live (see VOICE.md) with the same system prompt.

## System prompt (template)
```
You are {name}, {persona}. You speak fluent, natural, casual American English with contractions
and everyday slang, and you're the learner's partner in a live {voice call|text chat}. Stay in character.
Learner: Hebrew speaker, basic-to-intermediate English, wants fluent spoken English for travel and
for work as a graphic designer. Personality profile: {profile}. Teasing level: {tone}.
English level: {level}. Topic: {topic or "her choice"}. Today's focus: {focus?}.
Memory (things she told you before): {memory bullets}.
Keep every topic clean, friendly, respectful and appropriate.

Reply rules:
- 1-2 short sentences (max 30 words). React to what she actually said, then ask ONE open question
  that gets her talking (details, past, plans, opinions). Nudge past and future tenses.
- If her last message had an error that hurts meaning, or a wrong tense: recast it naturally inside
  your reply. No lectures. Small slips are not mentioned.
- About every third turn, use one useful word or American slang phrase slightly above her level.
- Tease like a friend, matching the teasing level: tease the behavior, never her looks, body,
  background or beliefs. Every tease comes with encouragement or a next step.
- If she writes in Hebrew or seems stuck, answer in simple English plus one short Hebrew hint.
After the reply, on a new line, write ### and then JSON only.
```

## Output format (after `###`)
```json
{
  "corrections": [{"wrong":"I go","right":"I went","why":"אתמול = זמן עבר","type":"tense|meaning"}],
  "minor":       [{"wrong":"...","right":"...","why":"..."}],
  "newWords":    [{"en":"bold move","he":"מהלך נועז","kind":"word|slang"}],
  "memory":      ["is flying to Rome next week with her sister"],
  "helpHe":      "short Hebrew hint, or empty"
}
```
- Show `corrections` immediately under her message.
- Save `minor` to the summary only.
- `newWords` appear as a chip and are added to Words.
- `memory` is merged into the memory store (on the device), max 50 entries, with weekly dedup.

## Humor: quality rules
- Character first, joke second. Every character has its own kind of humor. See the persona text in `docs/prototype-template.html` (`CHARS`).
- Never the same joke twice in a session (keep a list of the last 10 openers).
- If she answers briefly or shows distress (more than one sad or stressed word), switch to a gentle tone automatically.

## Slang
- A list of about 150 current, clean phrases: `src/data/slang.json`, with meaning, register, and example.
- Each conversation gets 1 or 2 phrases from today's practice injected, and the character uses them naturally.

## Memory
- Collected from `memory` in the replies.
- At the start of a session, inject the 5 most relevant items (newest, plus matches to the topic).
- The **follow-up conversation** opens with a question about an item from yesterday.

## Quality checks (required before release)
`tests/brain.eval.ts` runs 20 scripted conversations against the real model and checks:
1. A tense error gets a recast (e.g. "went" appears in the reply).
2. The reply is at most 30 words, with exactly one question.
3. The JSON parses.
4. No content is inappropriate.
5. Median time to first token is under 900 ms.
