import { NavBar } from './components/NavBar';
import { ToastHost } from './components/toast';
import { useLocation, type Route } from './router';
import { Home } from './screens/Home';
import { Practice } from './screens/Practice';
import { Profile } from './screens/Profile';
import { Words } from './screens/Words';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Check } from './screens/Check';
import { Chat } from './screens/Chat';
import { You } from './screens/You';

const SCREENS: Record<Route, (p: { param: string }) => preact.JSX.Element> = {
  home: Home,
  practice: Practice,
  profile: Profile,
  words: Words,
  progress: Progress,
  settings: Settings,
  check: Check,
  chat: ({ param }) => <Chat id={param} />,
  you: You,
};

/** Screens without the floating nav (they have their own back button). */
const NO_NAV: Route[] = ['settings', 'check', 'chat', 'you'];

export function App() {
  const { route, param } = useLocation();
  const Screen = SCREENS[route];
  return (
    <>
      <Screen key={`${route}/${param}`} param={param} />
      {!NO_NAV.includes(route) && <NavBar route={route} />}
      <ToastHost />
    </>
  );
}
