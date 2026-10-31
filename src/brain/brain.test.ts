import { describe, expect, it } from 'vitest';
import { completeSentences, splitReply, visible } from './parse';
import { sseText } from './stream';
import { needsGentle, systemPrompt } from './prompt';
import { mergeMemory, pickMemory } from '../data/memory';
import { CHARS } from '../data/characters';

describe('reply parsing', () => {
  const raw = `Oh, so you went and showed him the logo. Bold move. What did he say?
###
{"corrections":[{"wrong":"I go","right":"I went","why":"אתמול = זמן עבר","type":"tense"}],"minor":[],"newWords":[{"en":"bold move","he":"מהלך נועז","kind":"slang"}],"memory":["showed a client her logo"],"helpHe":""}`;

  it('splits reply and meta', () => {
    const { reply, meta, jsonOk } = splitReply(raw);
    expect(jsonOk).toBe(true);
    expect(reply).toBe('Oh, so you went and showed him the logo. Bold move. What did he say?');
    expect(meta.corrections[0].right).toBe('I went');
    expect(meta.newWords[0].en).toBe('bold move');
    expect(meta.memory).toEqual(['showed a client her logo']);
  });

  it('survives code fences and broken JSON', () => {
    expect(splitReply('Hi!\n###\n```json\n{"corrections":[]}\n```').jsonOk).toBe(true);
    const bad = splitReply('Hi there!\n### {oops');
    expect(bad.reply).toBe('Hi there!');
    expect(bad.jsonOk).toBe(false);
    expect(bad.meta.corrections).toEqual([]);
  });

  it('never shows the marker while streaming', () => {
    expect(visible('Nice. What next? #')).toBe('Nice. What next?');
    expect(visible('Nice. What next? ##')).toBe('Nice. What next?');
    expect(visible('Nice.\n### {"a"')).toBe('Nice.');
  });

  it('finds complete sentences', () => {
    expect(completeSentences('Hey there! How was Rome? I bet')).toEqual({ done: ['Hey there!', 'How was Rome?'], rest: 'I bet' });
  });
});

describe('stream', () => {
  it('reads Gemini SSE deltas and skips thoughts', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        const e = new TextEncoder();
        c.enqueue(e.encode('data: {"candidates":[{"content":{"parts":[{"text":"Hel"}]}}]}\r\n\r\ndata: {"candidates":[{"content":{"parts":[{"text":"x","thought":true},'));
        c.enqueue(e.encode('{"text":"lo"}]}}]}\r\n\r\n'));
        c.close();
      },
    });
    let out = '';
    for await (const t of sseText(body)) out += t;
    expect(out).toBe('Hello');
  });
});

describe('prompt', () => {
  it('follows the BRAIN.md template', () => {
    const p = systemPrompt(CHARS[0], { mode: 'text chat', memory: ['is flying to Rome'] });
    expect(p).toContain('You are Max, the Cynic');
    expect(p).toContain('- is flying to Rome');
    expect(p).toContain('max 30 words');
    expect(p).toContain('write ### and then JSON only');
    expect(p).toContain('clean, friendly, respectful and appropriate');
  });
  it('goes gentle on short or stressed answers', () => {
    expect(needsGentle(['ok', 'no'])).toBe(true);
    expect(needsGentle(['I am so tired and stressed today, bad day'])).toBe(true);
    expect(needsGentle(['I went to Rome with my sister last week'])).toBe(false);
    expect(needsGentle(['אני עייפה ולחוצה'])).toBe(true);
  });
});

describe('memory', () => {
  it('dedupes and keeps the newest 50', () => {
    let m = mergeMemory([], ['is flying to Rome', 'Is flying to Rome!'], 'cynic', 1);
    expect(m).toHaveLength(1);
    for (let i = 0; i < 60; i++) m = mergeMemory(m, [`fact ${i}`], 'cynic', i + 2);
    expect(m).toHaveLength(50);
    expect(m.at(-1)!.text).toBe('fact 59');
  });
  it('picks topic matches first, then newest', () => {
    const items = [
      { text: 'likes pizza', at: 1, char: 'x' },
      { text: 'works on a logo for a client', at: 2, char: 'x' },
      { text: 'has a sister', at: 3, char: 'x' },
    ];
    expect(pickMemory(items, 'client meeting', 2)).toEqual(['works on a logo for a client', 'has a sister']);
  });
});
