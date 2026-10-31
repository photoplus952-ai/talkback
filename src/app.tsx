import { NavBar } from './components/NavBar';
import { ToastHost } from './components/toast';
import { useRoute, type Route } from './router';
import { Home } from './screens/Home';
import { Practice } from './screens/Practice';
import { Profile } from './screens/Profile';
import { Words } from './screens/Words';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Check } from './screens/Check';

const SCREENS: Record<Route, () => preact.JSX.Element> = {
  home: Home,
  practice: Practice,
  profile: Profile,
  words: Words,
  progress: Progress,
  settings: Settings,
  check: Check,
};

/** Screens without the floating nav (they have their own back button). */
const NO_NAV: Route[] = ['settings', 'check'];

export function App() {
  const route = useRoute();
  const Screen = SCREENS[route];
  return (
    <>
      <Screen key={route} />
      {!NO_NAV.includes(route) && <NavBar route={route} />}
      <ToastHost />
    </>
  );
}
