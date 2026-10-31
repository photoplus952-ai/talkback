import { Icon, type IconName } from './Icon';
import { href, type Route } from '../router';

export const NAV_ITEMS: { route: Route; label: string; icon: IconName }[] = [
  { route: 'home', label: 'בית', icon: 'home' },
  { route: 'practice', label: 'תרגול', icon: 'target' },
  { route: 'profile', label: 'פרופיל', icon: 'user' },
  { route: 'words', label: 'מילים', icon: 'book' },
  { route: 'progress', label: 'התקדמות', icon: 'chart' },
];

/** Floating nav: 5 items, icon + label. Hidden inside a conversation. */
export function NavBar({ route }: { route: Route }) {
  return (
    <nav class="nav" aria-label="ניווט ראשי">
      {NAV_ITEMS.map((it) => (
        <a key={it.route} href={href(it.route)} aria-current={route === it.route ? 'page' : undefined}>
          <Icon name={it.icon} />
          {it.label}
        </a>
      ))}
    </nav>
  );
}
