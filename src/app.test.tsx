import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { parseHash, href } from './router';
import { placeCharacter } from './components/CharacterCard';
import { CHARS } from './data/characters';
import { dayNumber, week } from './data/progress';
import { ICON_NAMES } from './components/Icon';
import { NavBar, NAV_ITEMS } from './components/NavBar';

describe('router', () => {
  it('parses hashes and falls back to home', () => {
    expect(parseHash('#/words')).toBe('words');
    expect(parseHash('#/nope')).toBe('home');
    expect(parseHash('')).toBe('home');
    expect(href('home')).toBe('#/');
  });
});

describe('nav', () => {
  it('has the 5 items in order and marks the current one', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['בית', 'תרגול', 'פרופיל', 'מילים', 'התקדמות']);
    render(<NavBar route="words" />);
    expect(screen.getByText('מילים').closest('a')!.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('בית').closest('a')!.getAttribute('aria-current')).toBeNull();
  });
});

describe('character card', () => {
  it('places every face at the same spot on the card', () => {
    for (const c of CHARS) {
      const p = placeCharacter(c, 350);
      const faceX = p.left + c.mx * (p.height / c.a);
      const faceY = p.top + c.my * p.height;
      expect(faceX).toBeCloseTo(350 * 0.29, 5);
      expect(faceY).toBeCloseTo(85, 5);
    }
  });
});

describe('progress', () => {
  it('counts days from the start', () => {
    expect(dayNumber(new Date(2026, 0, 7), new Date(2026, 0, 1))).toBe(7);
    expect(dayNumber(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(1);
  });
  it('marks today in a Sunday-first week and never shows a false miss', () => {
    const w = week(new Date(2026, 9, 28)); // Wednesday
    expect(w[3].state).toBe('today');
    expect(w.some((d) => d.state === 'missed')).toBe(false);
  });
});

describe('icons', () => {
  it('has every icon DESIGN.md lists', () => {
    const needed = 'home target user users book chart gear speaker mute mic phone video msg flame zap shirt check x back play stop send cc image upload camera shield lock star timer diary wave palette sparkle repeat bell trash edit refresh sun'.split(' ');
    expect(needed.filter((n) => !ICON_NAMES.includes(n as any))).toEqual([]);
  });
});
