// The one icon set (Lucide style): 2px stroke, round caps, 22px default. No emoji in the UI.
// Paths copied from the "All screens v3.2" board, plus the few listed in DESIGN.md that the board does not draw.
import type { JSX } from 'preact';

const PATHS = {
  back: "<path d=\"M9 6l6 6-6 6\"/>",
  bell: "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0\"/>",
  book: "<path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z\"/><path d=\"M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5\"/>",
  camera: "<path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/>",
  cc: "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"M10 10.2a2 2 0 1 0 0 3.6M17 10.2a2 2 0 1 0 0 3.6\"/>",
  chart: "<path d=\"M4 20V10M10 20V4M16 20v-7M22 20H2\"/>",
  check: "<path d=\"M5 12.5l4.5 4.5L19 7.5\"/>",
  cloud: "<path d=\"M17.5 19H8a6 6 0 1 1 5.7-7.9A4.5 4.5 0 1 1 17.5 19z\"/>",
  diary: "<path d=\"M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"/>",
  edit: "<path d=\"M4 20h4L19 9l-4-4L4 16z\"/><path d=\"M14 6l4 4\"/>",
  flame: "<path d=\"M12 2c1.2 4.4 6 6.6 6 12a6 6 0 0 1-12 0c0-3.2 2.1-4.6 2.3-7.6 1.2 1.1 2.3 2.2 3.4 2.3C11.9 6.6 12.2 4.3 12 2z\"/>",
  gear: "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z\"/>",
  home: "<path d=\"M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/>",
  image: "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"M21 15l-5-5L5 21\"/>",
  lock: "<rect x=\"4\" y=\"11\" width=\"16\" height=\"10\" rx=\"2.5\"/><path d=\"M8 11V7a4 4 0 0 1 8 0v4\"/>",
  mic: "<rect x=\"9\" y=\"2\" width=\"6\" height=\"12\" rx=\"3\"/><path d=\"M5 10a7 7 0 0 0 14 0M12 19v3\"/>",
  msg: "<path d=\"M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z\"/>",
  mute: "<path d=\"M11 5 6 9H2v6h4l5 4z\"/><path d=\"M22 9l-6 6M16 9l6 6\"/>",
  palette: "<circle cx=\"13.5\" cy=\"6.5\" r=\"1.3\"/><circle cx=\"17.5\" cy=\"10.5\" r=\"1.3\"/><circle cx=\"8.5\" cy=\"7.5\" r=\"1.3\"/><circle cx=\"6.5\" cy=\"12.5\" r=\"1.3\"/><path d=\"M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a6 6 0 0 0 6-6c0-4.4-4.5-8.2-10-8.2z\"/>",
  phone: "<path d=\"M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z\"/>",
  play: "<path d=\"M7 4.5v15l13-7.5z\"/>",
  refresh: "<path d=\"M21 12a9 9 0 0 1-15.4 6.4L3 16M3 12a9 9 0 0 1 15.4-6.4L21 8\"/><path d=\"M21 3v5h-5M3 21v-5h5\"/>",
  repeat: "<path d=\"M17 2l4 4-4 4\"/><path d=\"M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4\"/><path d=\"M21 13v2a3 3 0 0 1-3 3H3\"/>",
  send: "<path d=\"M2 12 21 3l-6 18-3.5-7.5z\"/><path d=\"M11.5 13.5 21 3\"/>",
  shield: "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/>",
  shirt: "<path d=\"M20.4 6.6 16 4l-1.5 1.5a3.5 3.5 0 0 1-5 0L8 4 3.6 6.6a1 1 0 0 0-.4 1.3l1.5 3a1 1 0 0 0 1.2.5L7 11v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9l1.1.4a1 1 0 0 0 1.2-.5l1.5-3a1 1 0 0 0-.4-1.3z\"/>",
  sparkle: "<path d=\"M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z\"/><path d=\"M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z\"/>",
  speaker: "<path d=\"M11 5 6 9H2v6h4l5 4z\"/><path d=\"M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14\"/>",
  star: "<path d=\"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z\"/>",
  stop: "<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"3\"/>",
  sun: "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/>",
  target: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/>",
  timer: "<circle cx=\"12\" cy=\"13\" r=\"8\"/><path d=\"M12 9v4l2.5 2M9 2h6\"/>",
  trash: "<path d=\"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6\"/>",
  upload: "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><path d=\"M17 8l-5-5-5 5M12 3v12\"/>",
  user: "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7\"/>",
  users: "<circle cx=\"9\" cy=\"8\" r=\"3.5\"/><path d=\"M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5\"/><circle cx=\"17\" cy=\"9\" r=\"2.6\"/><path d=\"M16 14.6c2.8.1 4.9 1.8 5.5 4.9\"/>",
  video: "<rect x=\"2\" y=\"6\" width=\"14\" height=\"12\" rx=\"3\"/><path d=\"M16 10.5l6-3.5v10l-6-3.5\"/>",
  wave: "<path d=\"M3 12h1M7 8v8M11 4v16M15 7v10M19 10v4M22 12h-1\"/>",
  x: "<path d=\"M6 6l12 12M18 6 6 18\"/>",
  zap: "<path d=\"M13 2 3 14h9l-1 8 10-12h-9z\"/>",
} as const;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

type Props = {
  name: IconName;
  size?: number;
  filled?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
  label?: string;
};

export function Icon({ name, size = 22, filled, class: cls, style, label }: Props) {
  return (
    <svg
      class={`i${filled ? ' filled' : ''}${cls ? ' ' + cls : ''}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
