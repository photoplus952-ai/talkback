import { useEffect, useState } from 'preact/hooks';

// Hash routes, so GitHub Pages never 404s on a reload.
export type Route = 'home' | 'practice' | 'profile' | 'words' | 'progress' | 'settings' | 'check' | 'chat' | 'you';
const ROUTES: Route[] = ['home', 'practice', 'profile', 'words', 'progress', 'settings', 'check', 'chat', 'you'];

export function parseHash(hash: string): Route {
  return parseLocation(hash).route;
}

export function parseLocation(hash: string): { route: Route; param: string } {
  const [r, param = ''] = hash.replace(/^#\/?/, '').split(/[?]/)[0].split('/');
  return (ROUTES as string[]).includes(r) ? { route: r as Route, param } : { route: 'home', param: '' };
}

export function href(r: Route, param?: string): string {
  return r === 'home' ? '#/' : `#/${r}${param ? `/${param}` : ''}`;
}

export function useLocation(): { route: Route; param: string } {
  const [loc, setLoc] = useState(() => parseLocation(location.hash));
  useEffect(() => {
    const on = () => {
      setLoc(parseLocation(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return loc;
}

export function useRoute(): Route {
  return useLocation().route;
}
