import { useEffect, useState } from 'preact/hooks';

// Hash routes, so GitHub Pages never 404s on a reload.
export type Route = 'home' | 'practice' | 'profile' | 'words' | 'progress' | 'settings' | 'check';
const ROUTES: Route[] = ['home', 'practice', 'profile', 'words', 'progress', 'settings', 'check'];

export function parseHash(hash: string): Route {
  const r = hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return (ROUTES as string[]).includes(r) ? (r as Route) : 'home';
}

export function href(r: Route): string {
  return r === 'home' ? '#/' : `#/${r}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
