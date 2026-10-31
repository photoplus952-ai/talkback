import type { IconName } from '../components/Icon';

export type Practice = { id: string; title: string; goal: string; minutes: number; xp: number; icon: IconName };

// PRODUCT.md, "Daily practices"
export const PRACTICES: Practice[] = [
  { id: 'call', title: 'הדמות מתקשרת', goal: 'תגובה ספונטנית', minutes: 3, xp: 20, icon: 'phone' },
  { id: 'sixty', title: '60 שניות על...', goal: 'שטף', minutes: 1, xp: 10, icon: 'timer' },
  { id: 'diary', title: 'יומן קולי', goal: 'זמן עבר', minutes: 2, xp: 15, icon: 'diary' },
  { id: 'shadowing', title: 'Shadowing', goal: 'הגייה ומבטא', minutes: 4, xp: 15, icon: 'repeat' },
  { id: 'slang', title: 'סלנג היום', goal: '3 ביטויים', minutes: 3, xp: 10, icon: 'sparkle' },
  { id: 'design', title: 'תארי את העיצוב', goal: 'אנגלית לעבודה · בונוס', minutes: 5, xp: 20, icon: 'palette' },
];
