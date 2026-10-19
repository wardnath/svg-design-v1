/** @jsx h */
/** @jsxFrag Fragment */
/* Product detail page as a Figma frame exported to SVG: outlined text, the product
   illustration placed as a scaled group, star rating with a hard-stop gradient. */
import { h, Fragment, doc, Text, Box, Icon, Group, tw, num } from '../../design-kit/index.js';
import { layout, PAGE_H, PROMO_H, HEAD_H, INFO_W } from './layout.js';
import { backpack, starsMarkup, ART } from './art.js';
import { BRAND, PROMO, NAV, CRUMBS, PRODUCT, SWATCHES, SIZES, PERKS, FOLDS, C } from './data.js';

function Top({ L }) {
  const c = L.c, y = PROMO_H;
  const s = L.search;
  return (
    <Group id="Header">
      <Box x={0} y={0} w={L.W} h={PROMO_H} fill={C.promo} />
      <Text x={0} y={8} width={L.W} align="center" size={12.5} lh={20} weight={500} color="#FAFAF9">{PROMO}</Text>
      <rect x="0" y={PROMO_H + HEAD_H - 1} width={L.W} height="1" fill={C.line} />
      <Text x={c.x} y={y + 22} size={18} lh={28} weight={700} color={C.ink} ls={2.5}>{BRAND}</Text>
      {NAV.map(([t, sale], i) => <Text x={L.links[i].x} y={y + 26} size={14.5} lh={20} weight={500} color={sale ? C.sale : C.ink}>{t}</Text>)}
      <Box x={s.x} y={s.y} w={s.w} h={40} r={10} fill={C.soft} />
      <Icon name="search" x={s.x + 14} y={s.y + 11} size={18} color={C.ink2} />
      <Text x={s.x + 42} y={s.y + 10} size={14} lh={20} weight={400} color={C.muted}>Search gear</Text>
      <Icon name="user" x={L.icons[2].x} y={L.icons[2].y} size={22} color={C.ink} />
      <Icon name="heart" x={L.icons[1].x} y={L.icons[1].y} size={22} color={C.ink} />
      <Icon name="cart" x={L.icons[0].x} y={L.icons[0].y} size={22} color={C.ink} />
      <circle cx={L.icons[0].x + 21} cy={L.icons[0].y + 1} r="8" fill={C.sale} />
      <Text x={L.icons[0].x + 13} y={L.icons[0].y - 6} width={16} align="center" size={10} lh={14} weight={700} color="#FFFFFF">2</Text>
    </Group>
  );
}

function Crumbs({ L }) {
  let x = L.c.x;
  const out = [];
  CRUMBS.forEach((t, i) => {
    const last = i === CRUMBS.length - 1;
    out.push(<Text x={x} y={L.crumbY} size={13} lh={20} weight={last ? 500 : 400} color={last ? C.ink : C.ink2}>{t}</Text>);
    x += tw(t, 13, last ? 500 : 400);
    if (!last) { out.push(<Text x={x + 8} y={L.crumbY} size={13} lh={20} weight={400} color={C.muted}>/</Text>); x += 8 + tw('/', 13) + 8; }
  });
  return <Group id="Breadcrumb">{out}</Group>;
}

function Gallery({ L, D }) {
  const im = L.img, s = Math.min(im.w / ART.w, im.h / ART.h) * 0.78;
  const ox = im.x + (im.w - ART.w * s) / 2, oy = im.y + (im.h - ART.h * s) / 2;
  return (
    <Group id="Gallery">
      {L.thumbs.map((t, i) => {
        const ts = Math.min(t.w / ART.w, t.h / ART.h) * 0.8;
        return (
          <>
            <Box x={t.x} y={t.y} w={t.w} h={t.h} r={10} fill={C.soft} stroke={i === 0 ? C.ink : null} sw={2} />
            <g transform={`translate(${num(t.x + (t.w - ART.w * ts) / 2)} ${num(t.y + (t.h - ART.h * ts) / 2)}) scale(${+ts.toFixed(5)})`}>{backpack(SWATCHES[i][1])}</g>
          </>
        );
      })}
      <Box x={im.x} y={im.y} w={im.w} h={im.h} r={16} fill={C.soft} />
      <g id="Product_photo" transform={`translate(${num(ox)} ${num(oy)}) scale(${+s.toFixed(5)})`}>{backpack(SWATCHES[0][1])}</g>
      <Box x={im.x + 20} y={im.y + 20} w={Math.round(tw('−20%', 12.5, 600)) + 24} h={28} r={14} fill={C.sale} />
      <Text x={im.x + 20} y={im.y + 24} width={Math.round(tw('−20%', 12.5, 600)) + 24} align="center" size={12.5} lh={20} weight={600} color="#FFFFFF">−20%</Text>
      <circle cx={im.x + im.w - 40} cy={im.y + 40} r="20" fill="#FFFFFF" />
      <Icon name="heart" x={im.x + im.w - 50} y={im.y + 30} size={20} color={C.ink} />
    </Group>
  );
}

function Info({ L, D }) {
  const f = L.info, x = f.x, w = INFO_W;
  const out = [];
  out.push(<Text x={x} y={f.kicker} size={12} lh={16} weight={600} color={C.muted} ls={1.4}>{PRODUCT.kicker}</Text>);
  out.push(<Text x={x} y={f.title} size={32} lh={40} weight={600} color={C.ink} ls={-0.6}>{PRODUCT.title}</Text>);
  out.push(<g transform={`translate(${num(x)} ${num(f.rating + 2)})`}>{starsMarkup(PRODUCT.rating, 'paint_star_' + D.node)}</g>);
  const rx = x + 88 + 8;
  out.push(<Text x={rx} y={f.rating} size={13.5} lh={20} weight={600} color={C.ink}>{String(PRODUCT.rating)}</Text>);
  const r2 = rx + tw(String(PRODUCT.rating), 13.5, 600) + 6;
  out.push(<Text x={r2} y={f.rating} size={13.5} lh={20} weight={400} color={C.muted}>·</Text>);
  const r3 = r2 + tw('·', 13.5) + 6, rw = tw(PRODUCT.reviews, 13.5);
  out.push(<Text x={r3} y={f.rating} size={13.5} lh={20} weight={400} color={C.ink2}>{PRODUCT.reviews}</Text>, <rect x={num(r3)} y={f.rating + 17} width={num(rw)} height="1" fill={C.ink2} />);
  const pw = tw(PRODUCT.price, 28, 600), ww = tw(PRODUCT.was, 18, 400);
  out.push(<Text x={x} y={f.price} size={28} lh={36} weight={600} color={C.ink}>{PRODUCT.price}</Text>);
  out.push(<Text x={x + pw + 12} y={f.price} size={18} lh={36} weight={400} color={C.muted}>{PRODUCT.was}</Text>, <rect x={num(x + pw + 12)} y={f.price + 18} width={num(ww)} height="1.5" fill={C.muted} />);
  const sw = Math.round(tw(PRODUCT.save, 12.5, 600)) + 20;
  out.push(<Box x={x + pw + 12 + ww + 12} y={f.price + 5} w={sw} h={26} r={13} fill={C.greenSoft} />, <Text x={x + pw + 12 + ww + 12} y={f.price + 8} width={sw} align="center" size={12.5} lh={20} weight={600} color={C.green}>{PRODUCT.save}</Text>);
  out.push(<rect x={num(x)} y={f.rule} width={w} height="1" fill={C.line} />);
  out.push(<Text x={x} y={f.colorLabel} size={13.5} lh={20} weight={600} color={C.ink}>Color</Text>);
  out.push(<Text x={x + tw('Color', 13.5, 600) + 6} y={f.colorLabel} size={13.5} lh={20} weight={400} color={C.ink2}>{`— ${PRODUCT.color}`}</Text>);
  SWATCHES.forEach(([, col], i) => {
    const cx = x + 18 + i * 48, cy = f.swatches + 18;
    if (i === 0) out.push(<circle cx={cx} cy={cy} r="21" stroke={C.ink} strokeWidth="2" />);
    out.push(<circle cx={cx} cy={cy} r="18" fill={col} />);
  });
  out.push(<Text x={x} y={f.sizeLabel} size={13.5} lh={20} weight={600} color={C.ink}>Size</Text>);
  const gw = tw('Size guide', 13, 400);
  out.push(<Text x={x + w} y={f.sizeLabel} align="right" size={13} lh={20} weight={400} color={C.ink2}>Size guide</Text>, <rect x={num(x + w - gw)} y={f.sizeLabel + 17} width={num(gw)} height="1" fill={C.ink2} />);
  SIZES.forEach(([t, sub, off], i) => {
    const b = f.sizeCells[i], on = i === 1;
    out.push(<Box x={b.x} y={f.sizes} w={b.w} h={52} r={10} fill={off ? C.soft : '#FFFFFF'} stroke={on ? C.ink : C.line} sw={on ? 2 : 1} />);
    out.push(<Text x={b.x} y={f.sizes + 8} width={b.w} align="center" size={14} lh={20} weight={600} color={off ? C.muted : C.ink}>{t}</Text>);
    out.push(<Text x={b.x} y={f.sizes + 28} width={b.w} align="center" size={11.5} lh={16} weight={400} color={C.muted}>{sub}</Text>);
  });
  const cy = f.cart;
  out.push(<Box x={x} y={cy} w={128} h={52} r={10} fill="#FFFFFF" stroke={C.line} />);
  out.push(<Icon name="minus" x={x + 16} y={cy + 17} size={18} color={C.ink2} />, <Text x={x} y={cy + 16} width={128} align="center" size={15} lh={20} weight={600} color={C.ink}>1</Text>, <Icon name="plus" x={x + 128 - 34} y={cy + 17} size={18} color={C.ink2} />);
  const bx = x + 128 + 12, bw = w - 128 - 12 - 12 - 52;
  out.push(<Box x={bx} y={cy} w={bw} h={52} r={10} fill={C.accent} />, <Text x={bx} y={cy + 16} width={bw} align="center" size={15} lh={20} weight={600} color="#FFFFFF">{`Add to cart · ${PRODUCT.price}`}</Text>);
  out.push(<Box x={x + w - 52} y={cy} w={52} h={52} r={10} fill="#FFFFFF" stroke={C.line} />, <Icon name="heart" x={x + w - 37} y={cy + 15} size={22} color={C.ink} />);
  const py = f.perks;
  out.push(<Box x={x} y={py} w={w} h={142} r={12} fill="#FFFFFF" stroke={C.line} />);
  PERKS.forEach(([icon, t], i) => {
    const ry = py + 1 + i * 47;
    if (i) out.push(<rect x={num(x + 16)} y={ry - 1} width={w - 32} height="1" fill={C.line} />);
    out.push(<Icon name={icon} x={x + 16} y={ry + 13} size={20} color={C.ink2} />, <Text x={x + 48} y={ry + 13} size={13.5} lh={20} weight={500} color={C.ink}>{t}</Text>);
  });
  FOLDS.forEach((t, i) => {
    const ry = f.folds + i * 52;
    out.push(<Text x={x} y={ry + 15} size={15} lh={22} weight={600} color={C.ink}>{t}</Text>, <Icon name="chevronDown" x={x + w - 20} y={ry + 16} size={20} color={C.ink2} />);
    out.push(<rect x={num(x)} y={ry + 51} width={w} height="1" fill={C.line} />);
  });
  return <Group id="Buy box">{out}</Group>;
}

export default function productDesign({ W = 1440, H = PAGE_H } = {}) {
  const L = layout(W, H);
  const D = doc('Ridgeline 28L product page', W, H);
  return D.svg(<><Top L={L} /><Crumbs L={L} /><Gallery L={L} D={D} /><Info L={L} D={D} /></>, C.page);
}
export { layout, PAGE_H };
