export type Correction = { wrong: string; right: string; why: string; type?: 'tense' | 'meaning' };
export type NewWord = { en: string; he: string; kind: 'word' | 'slang' };

/** The JSON after ### (BRAIN.md, "Output format") */
export type Meta = {
  corrections: Correction[];
  minor: Correction[];
  newWords: NewWord[];
  memory: string[];
  helpHe: string;
};

export const EMPTY_META: Meta = { corrections: [], minor: [], newWords: [], memory: [], helpHe: '' };

export type Msg = {
  id: string;
  role: 'user' | 'model';
  text: string;
  meta?: Meta;
  at: number;
};
