import type { Character } from '../data/characters';

/** Round avatar cropped around the face (prototype's faceStyle). */
export function Face({ c, size = 44, zoom = 3.2 }: { c: Character; size?: number; zoom?: number }) {
  const fx = c.mx;
  const fy = c.my - 0.022;
  const px = ((fx * zoom - 0.5) / (zoom - 1)) * 100;
  const H = zoom * c.a;
  const py = ((fy * H - 0.5) / (H - 1)) * 100;
  return (
    <span
      class="face"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${c.img})`,
        backgroundSize: `${zoom * 100}% auto`,
        backgroundPosition: `${px.toFixed(1)}% ${py.toFixed(1)}%`,
      }}
    />
  );
}
