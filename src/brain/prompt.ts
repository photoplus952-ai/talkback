import type { Character } from '../data/characters';

export type PromptOpts = {
  mode: 'voice call' | 'text chat';
  profile?: string;
  tone?: 'gentle' | 'friendly' | 'no mercy';
  level?: string;
  topic?: string;
  focus?: string;
  memory?: string[];
  gentle?: boolean;
  avoidOpeners?: string[];
};

/** System prompt, from the BRAIN.md template. */
export function systemPrompt(c: Character, o: PromptOpts): string {
  const mem = o.memory?.length ? o.memory.map((m) => `- ${m}`).join('\n') : '- (nothing yet)';
  const tone = o.gentle ? 'gentle' : o.tone || 'friendly';
  const lines = [
    `You are ${c.name}, ${c.persona} You speak fluent, natural, casual American English with contractions`,
    `and everyday slang, and you're the learner's partner in a live ${o.mode}. Stay in character.`,
    `Learner: Hebrew speaker, basic-to-intermediate English, wants fluent spoken English for travel and`,
    `for work as a graphic designer. Personality profile: ${o.profile || 'not set yet'}. Teasing level: ${tone}.`,
    `English level: ${o.level || 'basic-intermediate'}. Topic: ${o.topic || 'her choice'}.${o.focus ? ` Today's focus: ${o.focus}.` : ''}`,
    `Memory (things she told you before):`,
    mem,
    `Keep every topic clean, friendly, respectful and appropriate.`,
    ``,
    `Reply rules:`,
    `- 1-2 short sentences (max 30 words). React to what she actually said, then ask ONE open question`,
    `  that gets her talking (details, past, plans, opinions). Nudge past and future tenses.`,
    `- If her last message had an error that hurts meaning, or a wrong tense: recast it naturally inside`,
    `  your reply. No lectures. Small slips are not mentioned.`,
    `- About every third turn, use one useful word or American slang phrase slightly above her level.`,
    `- Tease like a friend, matching the teasing level: tease the behavior, never her looks, body,`,
    `  background or beliefs. Every tease comes with encouragement or a next step.`,
    `- If she writes in Hebrew or seems stuck, answer in simple English plus one short Hebrew hint.`,
  ];
  if (o.gentle) lines.push(`- She seems stressed or is answering briefly: be extra warm and gentle right now, no teasing.`);
  if (o.avoidOpeners?.length) lines.push(`- Do not start with any of these openers again: ${o.avoidOpeners.map((x) => `"${x}"`).join(', ')}.`);
  lines.push(
    `After the reply, on a new line, write ### and then JSON only:`,
    `{"corrections":[{"wrong":"","right":"","why":"short Hebrew reason","type":"tense|meaning"}],` +
      `"minor":[{"wrong":"","right":"","why":""}],"newWords":[{"en":"","he":"","kind":"word|slang"}],` +
      `"memory":["short fact she shared, in English"],"helpHe":""}`,
    `corrections = only meaning or tense errors in HER last message. minor = small slips. newWords = words or slang YOU used that are new for her. Use empty arrays when there is nothing.`,
  );
  return lines.join('\n');
}

/** First line from the character when a chat opens (no model call, instant). */
export function opener(c: Character, memory: string[]): string {
  if (memory.length) return `Hey, you're back. Last time you said you ${memory[0].replace(/^(she )?/i, '')}. How did that go?`;
  return c.quote;
}

const SAD = ['sad', 'tired', 'stress', 'bad day', 'hard', 'worried', 'nervous', 'scared', 'עצוב', 'עייפה', 'לחוצה', 'קשה', 'מפחדת'];

/** Switch to a gentle tone if her last answers were very short or stressed (BRAIN.md, Humor). */
export function needsGentle(userTexts: string[]): boolean {
  const last = userTexts.slice(-3);
  if (!last.length) return false;
  const text = ` ${last.join(' ').toLowerCase()} `;
  const sadHits = SAD.filter((w) => text.includes(w)).length;
  const short = last.length >= 2 && last.every((t) => t.trim().split(/\s+/).length <= 2);
  return sadHits > 1 || short;
}
