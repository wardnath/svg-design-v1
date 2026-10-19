/** @jsx hh */
/** @jsxFrag Frag */
/* The product page as built: a max-width container with gutters, a CSS grid of a fluid
   gallery and a fixed 480px buy box, a square main image (aspect-ratio), flex rows for
   price, swatches and the cart controls. Options plant bugs or fix the image height. */
import { hh, Frag, raw, page } from '../../design-kit/html.js';
import { iconHtml } from '../../design-kit/index.js';
import { backpack, starsMarkup } from './art.js';
import { BRAND, PROMO, NAV, CRUMBS, PRODUCT, SWATCHES, SIZES, PERKS, FOLDS, C } from './data.js';

const UI = `'Avenir Next', Poppins, 'Century Gothic', sans-serif`;
const I = (name, size, color, sw) => raw(iconHtml(name, size, color, sw));
const art = (color, cls) => raw(`<svg class="${cls}" viewBox="0 0 400 500">${backpack(color)}</svg>`);

const css = o => `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FFFFFF;color:${C.ink};font-family:${UI};overflow:hidden}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0}
.promo{height:36px;background:${C.promo};color:#FAFAF9;text-align:center;font-size:12.5px;line-height:36px;font-weight:500}
.wrap{max-width:1440px;margin:0 auto;padding:0 48px}
header{height:72px;box-shadow:inset 0 -1px 0 ${C.line}}
header .wrap{height:100%;display:flex;align-items:center}
.logo{font-size:18px;line-height:28px;font-weight:700;letter-spacing:2.5px;white-space:nowrap}
.nav{margin-left:56px;display:flex;gap:28px;font-size:14.5px;line-height:20px;font-weight:500;white-space:nowrap}
.nav .sale{color:${C.sale}}
.search{margin-left:auto;width:260px;height:40px;border-radius:10px;background:${C.soft};display:flex;align-items:center;gap:10px;padding-left:14px;font-size:14px;line-height:20px;color:${C.muted};white-space:nowrap}
.icons{margin-left:24px;display:flex;gap:20px}
.cart{position:relative;display:flex}
.cart b{position:absolute;left:13px;top:-7px;width:16px;height:16px;border-radius:50%;background:${C.sale};color:#FFFFFF;font-size:10px;line-height:16px;font-weight:700;text-align:center}
.crumbs{padding-top:24px;height:44px;display:flex;font-size:13px;line-height:20px;color:${C.ink2};white-space:nowrap}
.crumbs i{font-style:normal;color:${C.muted};margin:0 8px}
.crumbs span:last-child{color:${C.ink};font-weight:500}
.main{margin-top:24px;display:grid;grid-template-columns:minmax(0,1fr) 480px;column-gap:64px;align-items:start}
.gallery{display:flex;gap:16px;align-items:flex-start}
.thumbs{display:flex;flex-direction:column;gap:12px;flex:none}
.thumb{width:72px;height:88px;border-radius:10px;background:${C.soft};display:flex;align-items:center;justify-content:center}
.thumb.on{box-shadow:inset 0 0 0 2px ${C.ink}}
.thumb svg{width:57.6px;height:70.4px}
.photo{position:relative;flex:1;min-width:0;${o.fixedImage ? 'height:712px' : 'aspect-ratio:1/1'};border-radius:16px;background:${C.soft};display:flex;align-items:center;justify-content:center}
.photo svg{width:78%;height:78%}
.disc{position:absolute;left:20px;top:20px;height:28px;padding:0 12px;border-radius:14px;background:${C.sale};color:#FFFFFF;font-size:12.5px;line-height:28px;font-weight:600}
.fav{position:absolute;right:20px;top:20px;width:40px;height:40px;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center}
.kicker{font-size:12px;line-height:16px;font-weight:600;letter-spacing:1.4px;color:${C.muted}}
h1{margin-top:8px;font-size:32px;line-height:40px;font-weight:600;letter-spacing:-.6px;white-space:nowrap}
.rating{margin-top:12px;height:20px;display:flex;align-items:center;font-size:13.5px;line-height:20px;white-space:nowrap}
.rating svg{margin:2px 8px 0 0}
.rating b{font-weight:600}
.rating i{font-style:normal;color:${C.muted};margin:0 6px}
.rating u{color:${C.ink2};text-underline-offset:3px}
.price{margin-top:20px;height:36px;display:flex;align-items:center;gap:12px;white-space:nowrap}
.price b{font-size:28px;line-height:36px;font-weight:600}
.price s{font-size:18px;line-height:36px;color:${C.muted}}
.save{height:26px;padding:0 10px;border-radius:13px;background:${C.greenSoft};color:${C.green};font-size:12.5px;line-height:26px;font-weight:600}
hr{margin-top:24px;border:0;height:1px;background:${C.line}}
.label{margin-top:24px;display:flex;font-size:13.5px;line-height:20px;white-space:nowrap}
.label b{font-weight:600;margin-right:6px}
.label span{color:${C.ink2}}
.label u{margin-left:auto;font-size:13px;color:${C.ink2};text-underline-offset:3px}
.swatches{margin-top:12px;display:flex;gap:12px}
.sw{width:36px;height:36px;border-radius:${o.swatchSquare ? '8px' : '50%'};flex:none}
.sw.on{box-shadow:0 0 0 2px #FFFFFF,0 0 0 4px ${C.ink}}
.stock{margin-top:12px;display:flex;align-items:center;gap:6px;font-size:13px;line-height:18px;font-weight:600;color:#B45309}
.stock i{width:7px;height:7px;border-radius:50%;background:#F59E0B}
.sizes{margin-top:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${o.sizeGap ? 4 : o.sizeGapWide ? 22 : 10}px}
.size{height:52px;border-radius:10px;border:1px solid ${C.line};padding-top:7px;text-align:center}
.size.on{border:2px solid ${C.ink};padding-top:6px}
.size.off{background:${C.soft};color:${C.muted}}
.size b{display:block;font-size:14px;line-height:20px;font-weight:600}
.size span{display:block;font-size:11.5px;line-height:16px;color:${C.muted}}
.buy{margin-top:24px;display:flex;gap:12px}
.qty{width:128px;height:52px;border:1px solid ${C.line};border-radius:10px;display:flex;align-items:center;justify-content:space-between;padding:0 15px;font-size:15px;line-height:20px;font-weight:600}
.add{flex:1;height:52px;border-radius:10px;background:${o.cartBlue ? '#2563EB' : C.accent};color:#FFFFFF;font-size:15px;line-height:20px;font-weight:600}
.wish{width:52px;height:52px;border:1px solid ${C.line};border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none}
.perks{margin-top:24px;border:1px solid ${C.line};border-radius:12px;padding:0 16px}
.perk{height:46px;display:flex;align-items:center;gap:12px;font-size:13.5px;line-height:20px;font-weight:500;white-space:nowrap}
.perk+.perk{height:47px;border-top:1px solid ${C.line}}
.folds{margin-top:18px}
.fold{height:52px;border-bottom:1px solid ${C.line};padding-top:15px;display:flex;font-size:15px;line-height:22px;font-weight:600}
.fold svg{margin:1px 0 0 auto}
`;

export default function productBuild(o = {}) {
  const priceRow = [<b>{PRODUCT.price}</b>, <s>{PRODUCT.was}</s>];
  const body = (
    <body>
      <div className="promo">{PROMO}</div>
      <header>
        <div className="wrap">
          <a className="logo">{BRAND}</a>
          <nav className="nav">{NAV.map(([t, sale]) => <a className={sale ? 'sale' : null}>{t}</a>)}</nav>
          <label className="search">{I('search', 18, C.ink2)}Search gear</label>
          <div className="icons">{I('user', 22, C.ink)}{I('heart', 22, C.ink)}<span className="cart">{I('cart', 22, C.ink)}<b>2</b></span></div>
        </div>
      </header>
      <div className="wrap">
        <nav className="crumbs">{CRUMBS.map((t, i) => <>{i ? <i>/</i> : null}<span>{t}</span></>)}</nav>
        <div className="main">
          <div className="gallery">
            <div className="thumbs">{SWATCHES.slice(0, 4).map(([, col], i) => <span className={'thumb' + (i === 0 ? ' on' : '')}>{art(col, '')}</span>)}</div>
            <div className="photo">{art(SWATCHES[0][1], '')}<span className="disc">−20%</span><span className="fav">{I('heart', 20, C.ink)}</span></div>
          </div>
          <div className="info">
            <div className="kicker">{PRODUCT.kicker}</div>
            <h1>{PRODUCT.title}</h1>
            <div className="rating">{raw(`<svg width="88" height="16" viewBox="0 0 88 16">${starsMarkup(PRODUCT.rating, 'starfill')}</svg>`)}<b>{String(PRODUCT.rating)}</b><i>·</i><u>{PRODUCT.reviews}</u></div>
            <div className="price" data-bug={o.priceOrder ? 'Old price shown before the current price' : null}>{o.priceOrder ? priceRow.slice().reverse() : priceRow}<span className="save">{PRODUCT.save}</span></div>
            <hr />
            <div className="label"><b>Color</b><span>{`— ${PRODUCT.color}`}</span></div>
            <div className="swatches" data-bug={o.swatchSquare ? 'Swatches drawn as rounded squares, spec is circles' : null}>{SWATCHES.map(([n, col], i) => <span className={'sw' + (i === 0 ? ' on' : '')} style={{ background: col }} title={n} />)}</div>
            {o.stockNote ? <div className="stock" data-bug="Low-stock note that is not in the design"><i />Only 3 left in Glacier</div> : null}
            <div className="label" style={{ marginTop: '28px' }}><b>Size</b><u>Size guide</u></div>
            <div className="sizes" data-bug={o.sizeGap ? 'Size buttons 4px apart, spec is 10px' : o.sizeGapWide ? 'Size buttons 22px apart, spec is 10px' : null}>{SIZES.map(([t, sub, off], i) => <button className={'size' + (i === 1 ? ' on' : '') + (off ? ' off' : '')}><b>{t}</b><span>{sub}</span></button>)}</div>
            <div className="buy">
              <div className="qty">{I('minus', 18, C.ink2)}1{I('plus', 18, C.ink2)}</div>
              <button className="add" data-bug={o.cartBlue ? 'Add to cart button blue, spec is near-black' : null}>{`Add to cart · ${PRODUCT.price}`}</button>
              <button className="wish">{I('heart', 22, C.ink)}</button>
            </div>
            <div className="perks">{PERKS.filter((p, i) => !(o.noWarranty && i === 2)).map(([icon, t]) => <div className="perk">{I(icon, 20, C.ink2)}{t}</div>)}</div>
            <div className="folds">{FOLDS.map(t => <div className="fold">{t}{I('chevronDown', 20, C.ink2)}</div>)}</div>
          </div>
        </div>
      </div>
    </body>
  );
  return page(`<title>${PRODUCT.title} — ${BRAND}</title>\n<style>${css(o)}</style>`, String(body));
}
