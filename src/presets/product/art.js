/* Vector art shared by the product design and its build: the backpack illustration
   (400 × 500 canvas) and the rating stars (88 × 16). */
import { num, mix } from '../../design-kit/index.js';

export const ART = { w: 400, h: 500 };

export function backpack(color) {
  const dark = mix(color, '#000000', 0.22), light = mix(color, '#FFFFFF', 0.14);
  return [
    `<ellipse cx="200" cy="472" rx="124" ry="14" fill="#000000" fill-opacity="0.08"/>`,
    `<path d="M168 76Q200 26 232 76" stroke="${dark}" stroke-width="12" stroke-linecap="round" fill="none"/>`,
    `<rect x="68" y="196" width="26" height="206" rx="11" fill="${dark}"/>`,
    `<rect x="306" y="196" width="26" height="206" rx="11" fill="${dark}"/>`,
    `<rect x="90" y="70" width="220" height="392" rx="72" fill="${color}"/>`,
    `<rect x="90" y="70" width="220" height="124" rx="62" fill="${dark}"/>`,
    `<rect x="188" y="150" width="24" height="70" rx="6" fill="${dark}"/>`,
    `<rect x="182" y="208" width="36" height="20" rx="5" fill="#292524"/>`,
    `<rect x="120" y="270" width="160" height="152" rx="40" fill="${light}"/>`,
    `<rect x="142" y="292" width="116" height="5" rx="2.5" fill="${dark}"/>`,
    `<rect x="180" y="344" width="40" height="24" rx="5" fill="#292524"/>`,
  ].join('');
}

/* Five stars, the last one filled to `frac`; `gid` names the gradient for the partial star. */
export function starsMarkup(value, gid) {
  const pts = (cx) => Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 3.4 : 8, a = (Math.PI / 5) * k - Math.PI / 2;
    return `${num(cx + r * Math.cos(a))},${num(8.6 + r * Math.sin(a))}`;
  }).join(' ');
  let s = '';
  for (let i = 0; i < 5; i++) {
    const cx = 8 + i * 18, f = Math.max(0, Math.min(1, value - i));
    if (f >= 1) s += `<polygon points="${pts(cx)}" fill="#F59E0B"/>`;
    else if (f <= 0) s += `<polygon points="${pts(cx)}" fill="#E7E5E4"/>`;
    else {
      const x0 = cx - 8, x1 = cx + 8, at = num(x0 + 16 * f);
      s += `<defs><linearGradient id="${gid}" x1="${num(x0)}" y1="0" x2="${num(x1)}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="${num(f)}" stop-color="#F59E0B"/><stop offset="${num(f)}" stop-color="#E7E5E4"/></linearGradient></defs><polygon points="${pts(cx)}" fill="url(#${gid})"/>`;
      void at;
    }
  }
  return s;
}
