/* =====================================================================
   Presets: Figma-style SVG designs + hand-built HTML implementations.
   Bugs are planted in the HTML and tagged with data-bug="…" — the tag is
   read only by the benchmark's ground-truth pass, never by an algorithm.
   ===================================================================== */
const Presets = (() => {
  'use strict';
  const DF = `Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  const SYS = `Verdana, 'DejaVu Sans', 'Bitstream Vera Sans', Geneva, sans-serif`;
  const T = (x, y, size, weight, fill, text, extra = '') =>
    `<text x="${x}" y="${y}" font-family="${DF}" font-size="${size}" font-weight="${weight}" fill="${fill}"${extra}>${text}</text>`;
  const MID = ' text-anchor="middle"';
  const END = ' text-anchor="end"';

  /* ------------------------------------------------------------------
     1. Pricing page — 1200 × 880
     ------------------------------------------------------------------ */
  const PLANS = [
    { name: 'Starter', desc: 'For individuals trying things out', price: '$0', pw: 52,
      feats: ['1 workspace', 'Up to 3 members', '2 GB file storage', 'Community support'], cta: 'Get started' },
    { name: 'Team', desc: 'For teams shipping every week', price: '$24', pw: 78, badge: 'Most popular', primary: true,
      feats: ['Unlimited workspaces', 'Up to 50 members', '200 GB file storage', 'Single sign-on (SSO)', 'Priority email support'], cta: 'Start 14-day trial' },
    { name: 'Enterprise', desc: 'For organizations with compliance needs', price: '$79', pw: 78,
      feats: ['Everything in Team', 'Unlimited members', 'Audit log &amp; retention', 'SCIM provisioning', 'Dedicated success manager'], cta: 'Talk to sales' },
  ];

  function pricingSVG() {
    const o = [];
    o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="880" viewBox="0 0 1200 880" fill="none">`);
    o.push(`<rect width="1200" height="880" fill="#EEF1F5"/>`);
    o.push(`<g id="Nav"><rect width="1200" height="72" fill="#FFFFFF"/><rect y="72" width="1200" height="1" fill="#D8DEE6"/>`);
    o.push(`<rect x="40" y="22" width="28" height="28" rx="7" fill="#1E293B"/><path d="M48 42L54 30L60 42Z" fill="#FFFFFF"/>`);
    o.push(T(80, 42, 18, 700, '#0F172A', 'Northwind'));
    [['Product', 470], ['Pricing', 552, 1], ['Docs', 630], ['Changelog', 694]].forEach(([s, x, on]) =>
      o.push(T(x, 41, 15, on ? 600 : 400, on ? '#0F172A' : '#5B6577', s)));
    o.push(T(958, 41, 15, 600, '#0F172A', 'Sign in'));
    o.push(`<rect x="1036" y="16" width="124" height="40" rx="8" fill="#0F172A"/>`);
    o.push(T(1098, 41, 15, 600, '#FFFFFF', 'Start free', MID), `</g>`);
    o.push(`<g id="Hero">`);
    o.push(T(600, 150, 40, 700, '#0F172A', 'Pricing that grows with your team', MID + ' letter-spacing="-0.4"'));
    o.push(T(600, 186, 18, 400, '#5B6577', 'Start free. Upgrade when you need more seats, storage and control.', MID));
    o.push(`<rect x="490" y="218" width="220" height="40" rx="20" fill="#DCE1E8"/>`);
    o.push(`<rect x="494.5" y="222.5" width="105" height="31" rx="15.5" fill="#FFFFFF" stroke="#C9D0DA"/>`);
    o.push(T(547, 243, 14, 600, '#0F172A', 'Monthly', MID), T(653, 243, 14, 400, '#5B6577', 'Yearly −20%', MID), `</g>`);
    PLANS.forEach((p, k) => {
      const x = 60 + k * 368;
      o.push(`<g id="Card/${p.name}">`);
      o.push(p.primary
        ? `<rect x="${x + 1}" y="291" width="342" height="458" rx="15" fill="#FFFFFF" stroke="#4338CA" stroke-width="2"/>`
        : `<rect x="${x + 0.5}" y="290.5" width="343" height="459" rx="15.5" fill="#FFFFFF" stroke="#D8DEE6"/>`);
      o.push(T(x + 32, 342, 20, 700, '#0F172A', p.name));
      if (p.badge) {
        o.push(`<rect x="${x + 208}" y="322" width="104" height="24" rx="12" fill="#EEF0FF"/>`);
        o.push(T(x + 260, 338, 12, 600, '#4338CA', p.badge, MID));
      }
      o.push(T(x + 32, 368, 14, 400, '#5B6577', p.desc));
      o.push(T(x + 32, 428, 44, 700, '#0F172A', p.price, ' letter-spacing="-1"'));
      o.push(T(x + 32 + p.pw + 8, 428, 15, 400, '#5B6577', '/ month'));
      o.push(`<rect x="${x + 32}" y="452" width="280" height="1" fill="#E2E7EE"/>`);
      p.feats.forEach((f, i) => {
        const yb = 494 + i * 36;
        o.push(`<circle cx="${x + 41}" cy="${yb - 5}" r="9" fill="#DCF5E4"/>`);
        o.push(`<path d="M${x + 37} ${yb - 5}l3 3l5 -6" stroke="#15803D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
        o.push(T(x + 60, yb, 15, 400, '#334155', f));
      });
      o.push(p.primary
        ? `<rect x="${x + 32}" y="676" width="280" height="44" rx="10" fill="#4338CA"/>`
        : `<rect x="${x + 32.5}" y="676.5" width="279" height="43" rx="9.5" fill="#FFFFFF" stroke="#C5CDD8"/>`);
      o.push(T(x + 172, 703, 15, 600, p.primary ? '#FFFFFF' : '#0F172A', p.cta, MID), `</g>`);
    });
    o.push(`<g id="Footer"><rect x="60" y="800" width="1080" height="1" fill="#D8DEE6"/>`);
    o.push(T(60, 840, 14, 400, '#7A8496', '© 2026 Northwind Labs, Inc.'));
    o.push(T(968, 840, 14, 400, '#7A8496', 'Privacy'), T(1039, 840, 14, 400, '#7A8496', 'Terms'), T(1140, 840, 14, 400, '#7A8496', 'Status', END), `</g>`);
    o.push(`</svg>`);
    return o.join('\n');
  }

  function pricingHTML(v = {}) {
    const navH = v.navH || 73;
    const cards = PLANS.map((p, k) => {
      const feats = p.feats.filter(f => !(v.dropScim && f === 'SCIM provisioning'));
      const ctaBug = v.teamCtaGray && p.primary;
      const cardBug = v.teamDrop && p.primary;
      return `
    <section class="card${p.primary ? ' primary' : ''}"${cardBug ? ' data-bug="Team card dropped 18px"' : ''}>
      <div class="head"><h3 class="name">${p.name}</h3>${p.badge ? `<span class="badge">${p.badge}</span>` : ''}</div>
      <p class="desc">${p.desc}</p>
      <div class="price"><b>${p.price}</b><span>/ month</span></div>
      <hr>
      <ul>${feats.map(f => `
        <li><span class="ck"><i></i></span>${f}</li>`).join('')}
      </ul>
      <a class="btn${p.primary ? ' primary' : ''}"${ctaBug ? ' data-bug="CTA uses neutral gray instead of brand indigo" style="background:#64748B;border-color:#64748B"' : ''}>${p.cta}</a>
    </section>`;
    }).join('');
    const toggle = v.toggleYearly
      ? `<div class="toggle" data-bug="Billing toggle shows Yearly selected"><span>Monthly</span><span class="knob">Yearly −20%</span></div>`
      : `<div class="toggle"><span class="knob">Monthly</span><span>Yearly −20%</span></div>`;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Pricing — Northwind</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #EEF1F5; }
  body { width: 1200px; height: 880px; position: relative; overflow: hidden;
         font-family: ${SYS}; color: #0F172A; }
  a { color: inherit; text-decoration: none; }
  .nav { height: ${navH}px; background: #fff; border-bottom: 1px solid #D8DEE6;
         display: flex; align-items: center; padding: 0 40px; }
  .brand { width: 430px; display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 700; }
  .mark { width: 28px; height: 28px; border-radius: 7px; background: #1E293B;
          display: flex; align-items: center; justify-content: center; }
  .mark b { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
            border-bottom: 12px solid #fff; }
  .links { display: flex; gap: 28px; font-size: 15px; color: #5B6577; }
  .links .on { color: #0F172A; font-weight: 600; }
  .right { margin-left: auto; display: flex; align-items: center; gap: 28px; font-size: 15px; font-weight: 600; }
  .cta { width: 124px; height: 40px; border-radius: 8px; background: #0F172A; color: #fff;
         display: flex; align-items: center; justify-content: center; }
  .hero { text-align: center; padding-top: 40px; }
  h1 { font-size: 40px; line-height: 48px; font-weight: 700; letter-spacing: -0.01em; }
  .sub { margin-top: 6px; font-size: 18px; line-height: 26px; color: #5B6577; }
  .toggle { margin: 25px auto 0; width: 220px; height: 40px; border-radius: 20px; background: #DCE1E8;
            padding: 4px; display: flex; font-size: 14px; }
  .toggle span { flex: 1; display: flex; align-items: center; justify-content: center; color: #5B6577; }
  .toggle .knob { flex: 0 0 106px; background: #fff; border: 1px solid #C9D0DA; border-radius: 16px;
                  color: #0F172A; font-weight: 600; }
  .cards { display: flex; gap: 24px; padding: 0 60px; margin-top: 32px; align-items: flex-start; }
  .card { width: 344px; height: 460px; background: #fff; border: 1px solid #D8DEE6; border-radius: 16px;
          padding: 31px 31px 29px; display: flex; flex-direction: column; }
  .card.primary { border: 2px solid #4338CA; padding: 30px 30px 28px;${v.teamDrop ? ' margin-top: 18px;' : ''} }
  .head { display: flex; justify-content: space-between; align-items: flex-start; }
  .name { font-size: 20px; line-height: 28px; font-weight: 700; }
  .badge { height: 24px; padding: 0 12px; border-radius: 12px; background: #EEF0FF; color: #4338CA;
           font-size: 12px; font-weight: 600; display: flex; align-items: center; }
  .desc { margin-top: 4px; font-size: 14px; line-height: 20px; color: #5B6577; }
  .price { margin-top: 14px; display: flex; align-items: baseline; gap: 8px; }
  .price b { font-size: 44px; line-height: 52px; font-weight: 700; letter-spacing: -1px; }
  .price span { font-size: 15px; color: #5B6577; }
  hr { margin-top: 12px; border: 0; height: 1px; background: #E2E7EE; }
  ul { list-style: none; margin-top: 25px; display: flex; flex-direction: column; gap: 14px; }
  li { display: flex; align-items: center; gap: 10px; font-size: 15px; line-height: 22px; color: #334155; }
  .ck { width: 18px; height: 18px; border-radius: 50%; background: #DCF5E4; flex: none;
        display: flex; align-items: center; justify-content: center; }
  .ck i { width: 9px; height: 5px; border-left: 2px solid #15803D; border-bottom: 2px solid #15803D;
          transform: translateY(-1px) rotate(-45deg); }
  .btn { margin-top: auto; height: 44px; border-radius: 10px; border: 1px solid #C5CDD8; background: #fff;
         font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
  .btn.primary { background: #4338CA; border-color: #4338CA; color: #fff; }
  .foot { position: absolute; left: 60px; right: 60px; top: 800px; border-top: 1px solid #D8DEE6;
          padding-top: 25px; display: flex; font-size: 14px; line-height: 20px; color: #7A8496; }
  .foot nav { margin-left: auto; display: flex; gap: 24px; }
</style>
</head>
<body>
  <header class="nav"${v.navH ? ' data-bug="Nav bar 24px taller than spec"' : ''}>
    <div class="brand"><span class="mark"><b></b></span>Northwind</div>
    <nav class="links">
      <a>Product</a><a class="on">Pricing</a><a${v.docsShift ? ` data-bug="Docs link pushed ${v.docsShift}px right" style="margin-left:${v.docsShift}px"` : ''}>Docs</a><a>Changelog</a>
    </nav>
    <div class="right"><a>Sign in</a><a class="cta">Start free</a></div>
  </header>
  <main>
    <div class="hero">
      <h1>Pricing that grows with your team</h1>
      <p class="sub">Start free. Upgrade when you need more seats, storage and control.</p>
      ${toggle}
    </div>
    <div class="cards">${cards}
    </div>
  </main>
  <footer class="foot">
    <span>© 2026 Northwind Labs, Inc.</span>
    <nav><a>Privacy</a><a>Terms</a><a>Status</a></nav>
  </footer>
</body>
</html>`;
  }

  /* ------------------------------------------------------------------
     2. Account settings — 1100 × 760
     ------------------------------------------------------------------ */
  const MENU = ['Overview', 'Projects', 'Deployments', 'Billing', 'Settings', 'Support'];
  const FIELDS = [['Full name', 'Avery Chen'], ['Email', 'avery@acme.dev'], ['Role', 'Engineering manager', 1], ['Time zone', 'Europe/Lisbon (GMT+1)']];
  const SWITCHES = [['Product updates', 'A monthly summary of new features', 1], ['Two-factor authentication', 'Require a code from your authenticator app', 0]];

  function settingsSVG() {
    const o = [];
    o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="760" viewBox="0 0 1100 760" fill="none">`);
    o.push(`<rect width="1100" height="760" fill="#F3F5F8"/>`);
    o.push(`<g id="Sidebar"><rect width="232" height="760" fill="#111827"/>`);
    o.push(`<rect x="24" y="24" width="24" height="24" rx="6" fill="#6366F1"/>`, T(58, 42, 16, 700, '#F9FAFB', 'Acme Cloud'));
    MENU.forEach((m, i) => {
      const y = 84 + i * 40, on = m === 'Settings';
      if (on) o.push(`<rect x="12" y="${y}" width="208" height="36" rx="8" fill="#1F2937"/>`);
      o.push(`<rect x="28" y="${y + 10}" width="16" height="16" rx="4" fill="${on ? '#A5B4FC' : '#374151'}"/>`);
      o.push(T(56, y + 23, 14, on ? 600 : 400, on ? '#F9FAFB' : '#9CA3AF', m));
    });
    o.push(`<circle cx="36" cy="720" r="14" fill="#F59E0B"/>`, T(58, 724, 14, 400, '#E5E7EB', 'Avery Chen'), `</g>`);
    o.push(`<g id="Header">`, T(272, 70, 26, 700, '#0F172A', 'Account settings'));
    o.push(T(272, 96, 14, 400, '#5E6878', 'Manage your profile, security and notifications.'), `</g>`);
    o.push(`<g id="Panel"><rect x="272.5" y="124.5" width="787" height="535" rx="11.5" fill="#FFFFFF" stroke="#DCE1E7"/>`);
    o.push(T(304, 164, 16, 600, '#0F172A', 'Profile'));
    FIELDS.forEach(([l, val, sel], i) => {
      const y = 184 + i * 56;
      o.push(T(304, y + 25, 14, 500, '#334155', l));
      o.push(`<rect x="520.5" y="${y + 0.5}" width="507" height="39" rx="7.5" fill="#FFFFFF" stroke="#CBD3DD"/>`);
      o.push(T(536, y + 25, 14, 400, '#0F172A', val));
      if (sel) o.push(`<path d="M1002 ${y + 17}l5 5l5 -5" stroke="#64748B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
    });
    o.push(`<rect x="304" y="416" width="724" height="1" fill="#E5E8EC"/>`);
    o.push(T(304, 452, 16, 600, '#0F172A', 'Notifications'));
    SWITCHES.forEach(([l, d, on], i) => {
      const y = 472 + i * 56;
      o.push(T(304, y + 14, 14, 500, '#0F172A', l), T(304, y + 34, 13, 400, '#6B7486', d));
      o.push(`<rect x="984" y="${y + 2}" width="44" height="24" rx="12" fill="${on ? '#2563EB' : '#CBD3DD'}"/>`);
      o.push(`<circle cx="${on ? 1016 : 996}" cy="${y + 14}" r="9" fill="#FFFFFF"/>`);
    });
    o.push(`<rect x="812.5" y="588.5" width="91" height="39" rx="7.5" fill="#FFFFFF" stroke="#CBD3DD"/>`, T(858, 613, 14, 600, '#0F172A', 'Cancel', MID));
    o.push(`<rect x="916" y="588" width="112" height="40" rx="8" fill="#2563EB"/>`, T(972, 613, 14, 600, '#FFFFFF', 'Save changes', MID), `</g>`);
    o.push(T(272, 690, 13, 400, '#7A8496', 'Last saved 2 minutes ago'));
    o.push(`</svg>`);
    return o.join('\n');
  }

  function settingsHTML(v = {}) {
    const rows = FIELDS.map(([l, val, sel], i) => `
        <div class="row"><label>${l}</label><div class="fieldcol">
          <div class="input${sel ? ' select' : ''}"${i === 1 && v.emailNarrow ? ' data-bug="Email field 120px too narrow" style="width:388px"' : ''}>${val}${sel ? '<i class="chev"></i>' : ''}</div>${i === 0 && v.extraHelper ? `
          <p class="help" data-bug="Helper text not in the design">Shown on your profile and in emails.</p>` : ''}
        </div></div>`).join('');
    const sw = SWITCHES.map(([l, d, on], i) => `
        <div class="srow"><div><b>${l}</b><span>${d}</span></div>${i === 1 && v.dropSwitch ? '' : `<i class="switch${on ? ' on' : ''}"></i>`}</div>`).join('');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Account settings — Acme Cloud</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #F3F5F8; }
  body { width: 1100px; height: 760px; position: relative; overflow: hidden; display: flex;
         font-family: ${SYS}; color: #0F172A; }
  .side { width: 232px; height: 760px; background: #111827; padding: 24px 12px; position: relative; flex: none; }
  .brand { height: 24px; padding-left: 12px; display: flex; align-items: center; gap: 10px;
           color: #F9FAFB; font-size: 16px; font-weight: 700; }
  .brand i { width: 24px; height: 24px; border-radius: 6px; background: #6366F1; }
  .menu { margin-top: 36px; display: flex; flex-direction: column; gap: 4px; }
  .item { height: 36px; border-radius: 8px; padding-left: 16px; display: flex; align-items: center; gap: 12px;
          font-size: 14px; color: #9CA3AF; }
  .item i { width: 16px; height: 16px; border-radius: 4px; background: #374151; }
  .item.on { background: #1F2937; color: #F9FAFB; font-weight: 600; }
  .item.on i { background: #A5B4FC; }
  .me { position: absolute; left: 22px; top: 706px; display: flex; align-items: center; gap: 8px;
        color: #E5E7EB; font-size: 14px; }
  .me i { width: 28px; height: 28px; border-radius: 50%; background: #F59E0B; }
  .main { padding: 45px 40px 0; width: 868px; }
  h1 { font-size: 26px; line-height: 34px; font-weight: 700; }
  .sub { margin-top: 3px; font-size: 14px; line-height: 20px; color: #5E6878; }
  .panel { margin-top: 22px; width: 788px; background: #fff; border: 1px solid #DCE1E7; border-radius: 12px;
           padding: 22px 31px 31px; }
  h2 { font-size: 16px; line-height: 24px; font-weight: 600; }
  .form { margin-top: 13px; display: flex; flex-direction: column; gap: 16px; }
  .row { display: flex; align-items: flex-start; }
  .row label { width: 216px; height: 40px; display: flex; align-items: center; font-size: 14px; font-weight: 500; color: #334155; }
  .input { width: 508px; height: 40px; border: 1px solid #CBD3DD; border-radius: 8px; padding: 0 15px;
           display: flex; align-items: center; font-size: 14px; position: relative; }
  .chev { position: absolute; right: 16px; top: 14px; width: 8px; height: 8px; border-right: 1.6px solid #64748B;
          border-bottom: 1.6px solid #64748B; transform: rotate(45deg); }
  .help { margin-top: 6px; font-size: 12px; line-height: 16px; color: #6B7486; }
  hr { margin-top: 24px; border: 0; height: 1px; background: #E5E8EC; }
  h2.n { margin-top: 18px; }
  .switches { margin-top: 13px; display: flex; flex-direction: column; gap: 16px; }
  .srow { display: flex; justify-content: space-between; align-items: flex-start; }
  .srow b { display: block; font-size: 14px; line-height: 20px; font-weight: 500; }
  .srow span { display: block; font-size: 13px; line-height: 20px; color: #6B7486; }
  .switch { margin-top: 2px; width: 44px; height: 24px; border-radius: 12px; background: #CBD3DD; position: relative; flex: none; }
  .switch:after { content: ""; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; }
  .switch.on { background: #2563EB; }
  .switch.on:after { left: 23px; }
  .actions { margin-top: 20px; display: flex; justify-content: ${v.buttonsLeft ? 'flex-start' : 'flex-end'}; gap: 12px; }
  .btn { height: 40px; border-radius: 8px; padding: 0 17px; font-size: 14px; font-weight: 600; white-space: nowrap;
         display: flex; align-items: center; justify-content: center; }
  .btn.ghost { padding: 0 20px; border: 1px solid #CBD3DD; background: #fff; }
  .btn.solid { padding: 0 10px; background: #2563EB; color: #fff; }
  .saved { margin-top: 17px; font-size: 13px; line-height: 18px; color: #7A8496; }
</style>
</head>
<body>
  <aside class="side">
    <div class="brand"><i></i>Acme Cloud</div>
    <nav class="menu">${MENU.map(m => `
      <a class="item${m === 'Settings' ? ' on' : ''}"><i></i>${m}</a>`).join('')}
    </nav>
    <div class="me"><i></i>Avery Chen</div>
  </aside>
  <main class="main">
    <h1>Account settings</h1>
    <p class="sub">Manage your profile, security and notifications.</p>
    <section class="panel">
      <h2>Profile</h2>
      <div class="form">${rows}
      </div>
      <hr>
      <h2 class="n">Notifications</h2>
      <div class="switches">${sw}
      </div>
      <div class="actions"${v.buttonsLeft ? ' data-bug="Actions left-aligned instead of right"' : ''}><a class="btn ghost">Cancel</a><a class="btn solid">Save changes</a></div>
    </section>
    <p class="saved">Last saved 2 minutes ago</p>
  </main>
</body>
</html>`;
  }

  /* ------------------------------------------------------------------
     3. Mobile reading app — 390 × 844
     ------------------------------------------------------------------ */
  const ITEMS = [
    ['Tide tables, decoded', '4 min · Data', '#FDE68A'],
    ["A lighthouse keeper's log", '9 min · History', '#BFDBFE'],
    ['Night ferry to Cacilhas', '3 min · Travel', '#FBCFE8'],
  ];
  const TABS = ['Home', 'Search', 'Saved', 'Profile'];
  const EXCERPT = ['We spent a week walking the docks at dawn,', 'sketching cranes, cats and the fishermen', 'who still mend their nets by hand.'];

  function mobileSVG() {
    const o = [];
    o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844" fill="none">`);
    o.push(`<defs><linearGradient id="hero" x1="32" y1="130" x2="358" y2="298" gradientUnits="userSpaceOnUse"><stop stop-color="#A5C8FF"/><stop offset="1" stop-color="#D2C2FF"/></linearGradient></defs>`);
    o.push(`<rect width="390" height="844" fill="#FFFFFF"/>`);
    o.push(`<g id="AppBar">`, T(20, 40, 22, 700, '#111827', 'Field notes'));
    o.push(`<circle cx="350" cy="32" r="18" fill="#FDE68A"/>`, T(350, 37, 13, 700, '#92400E', 'MK', MID), `</g>`);
    o.push(`<g id="Tabs"><rect x="20" y="64" width="350" height="38" rx="10" fill="#F1F3F6"/>`);
    o.push(`<rect x="24.5" y="68.5" width="113" height="29" rx="7.5" fill="#FFFFFF" stroke="#E2E5EA"/>`);
    o.push(T(81, 88, 14, 600, '#111827', 'Latest', MID), T(195, 88, 14, 400, '#6B7280', 'Following', MID), T(309, 88, 14, 400, '#6B7280', 'Saved', MID), `</g>`);
    o.push(`<g id="Story"><rect x="20.5" y="118.5" width="349" height="371" rx="15.5" fill="#FFFFFF" stroke="#E5E7EB"/>`);
    o.push(`<rect x="32" y="130" width="326" height="168" rx="12" fill="url(#hero)"/>`);
    o.push(T(32, 326, 19, 700, '#111827', 'Mapping the quiet corners'), T(32, 350, 19, 700, '#111827', 'of the old harbour'));
    o.push(`<circle cx="42" cy="375" r="10" fill="#A7F3D0"/>`, T(60, 380, 13, 400, '#6B7280', 'Lina Ortiz · 6 min read'));
    EXCERPT.forEach((l, i) => o.push(T(32, 414 + i * 22, 15, 400, '#374151', l)));
    o.push(`</g>`);
    o.push(T(20, 530, 15, 700, '#111827', 'More this week'));
    ITEMS.forEach(([t, m, c], i) => {
      const y = 548 + i * 72;
      o.push(`<rect x="20" y="${y}" width="56" height="56" rx="12" fill="${c}"/>`);
      o.push(T(88, y + 22, 15, 600, '#111827', t.replace("'", '&#8217;')), T(88, y + 42, 13, 400, '#6B7280', m));
    });
    o.push(`<g id="TabBar"><rect y="776" width="390" height="1" fill="#E5E7EB"/>`);
    TABS.forEach((t, i) => {
      const cx = 48.75 + i * 97.5, on = i === 0;
      o.push(`<rect x="${cx - 11}" y="788" width="22" height="22" rx="6" fill="${on ? '#111827' : '#D1D5DB'}"/>`);
      o.push(T(cx, 826, 11, on ? 600 : 400, on ? '#111827' : '#9CA3AF', t, MID));
    });
    o.push(`</g></svg>`);
    return o.join('\n');
  }

  function mobileHTML(v = {}) {
    const order = v.swapRows ? [0, 2, 1] : [0, 1, 2];
    const items = order.map((k, pos) => {
      const [t, m, c] = ITEMS[k];
      const bug = v.swapRows && pos > 0 ? ` data-bug="Row ${pos + 1} shows item ${k + 1} (order swapped)"` : '';
      return `
      <li${bug}><i style="background:${c}"></i><div><b>${t.replace("'", '&#8217;')}</b><span>${m}</span></div></li>`;
    }).join('');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Field notes</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body { width: 390px; height: 844px; position: relative; overflow: hidden; font-family: ${SYS}; color: #111827; }
  .bar { height: 64px; padding: 0 22px 0 20px; display: flex; align-items: center; justify-content: space-between; }
  .bar h1 { font-size: 22px; line-height: 28px; font-weight: 700; }
  .avatar { width: 36px; height: 36px; border-radius: ${v.squareAvatar ? '6px' : '50%'}; background: #FDE68A; color: #92400E;
            font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .seg { margin: 0 20px; height: 38px; border-radius: 10px; background: #F1F3F6; padding: 4px; display: flex; }
  .seg a { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #6B7280; }
  .seg a.on { background: #fff; border: 1px solid #E2E5EA; border-radius: 8px; color: #111827; font-weight: 600; }
  .story { margin: 16px 20px 0; border: 1px solid #E5E7EB; border-radius: 16px; padding: 11px 11px 25px; }
  .img { height: ${v.imgH || 168}px; border-radius: 12px; background: linear-gradient(135deg, #A5C8FF, #D2C2FF); }
  .story h2 { margin-top: 10px; font-size: 19px; line-height: 24px; font-weight: 700; }
  .meta { margin-top: 9px; height: 20px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6B7280; }
  .meta i { width: 20px; height: 20px; border-radius: 50%; background: #A7F3D0; }
  .story p { margin-top: 13px; font-size: 15px; line-height: 22px; color: #374151;${v.narrowExcerpt ? ' max-width: 250px;' : ''} }
  h3 { margin: 25px 20px 0; font-size: 15px; line-height: 20px; font-weight: 700; }
  ul { list-style: none; margin: 13px 20px 0; display: flex; flex-direction: column; gap: 16px; }
  li { height: 56px; display: flex; gap: 12px; }
  li i { width: 56px; height: 56px; border-radius: 12px; flex: none; }
  li div { padding-top: 7px; }
  li b { display: block; font-size: 15px; line-height: 20px; font-weight: 600; }
  li span { display: block; margin-top: 2px; font-size: 13px; line-height: 18px; color: #6B7280; }
  .tabs { position: absolute; left: 0; right: 0; top: 776px; border-top: 1px solid #E5E7EB; padding-top: 11px; display: flex; }
  .tabs a { flex: 1; display: flex; flex-direction: column; align-items: center; font-size: 11px; line-height: 14px; color: #9CA3AF; }
  .tabs a i { width: 22px; height: 22px; border-radius: 6px; background: #D1D5DB; margin-bottom: 6px; }
  .tabs a.on { color: #111827; font-weight: 600; }
  .tabs a.on i { background: #111827; }
</style>
</head>
<body>
  <header class="bar"><h1>Field notes</h1><span class="avatar"${v.squareAvatar ? ' data-bug="Avatar is square, spec is a circle"' : ''}>MK</span></header>
  <nav class="seg"><a class="on">Latest</a><a>Following</a><a>Saved</a></nav>
  <article class="story">
    <div class="img"${v.imgH ? ` data-bug="Cover image ${v.imgH}px tall, spec is 168px"` : ''}></div>
    <h2>Mapping the quiet corners<br>of the old harbour</h2>
    <div class="meta"><i></i>Lina Ortiz · 6 min read</div>
    <p>${EXCERPT.join(' ')}</p>
  </article>
  <h3>More this week</h3>
  <ul>${items}
  </ul>
  <nav class="tabs">${TABS.map((t, i) => `
    <a class="${i === 0 ? 'on' : ''}"><i${i === 1 && v.shiftSearch ? ` data-bug="Search icon ${v.shiftSearch}px off-center" style="transform:translateX(${v.shiftSearch}px)"` : ''}></i>${t}</a>`).join('')}
  </nav>
</body>
</html>`;
  }

  /* ------------------------------------------------------------------ */
  const designs = [
    { id: 'pricing', name: 'Pricing page', w: 1200, h: 880, kind: 'svg', src: pricingSVG() },
    { id: 'settings', name: 'Account settings', w: 1100, h: 760, kind: 'svg', src: settingsSVG() },
    { id: 'mobile', name: 'Mobile reading app', w: 390, h: 844, kind: 'svg', src: mobileSVG() },
  ];
  const impls = [
    { id: 'pricing-a', design: 'pricing', name: 'Pricing · faithful, fallback font', kind: 'html', src: pricingHTML(),
      note: 'Built from the spec with flexbox. The web font failed, so text renders in Verdana: wider glyphs, one description wraps. No layout bugs.' },
    { id: 'pricing-b', design: 'pricing', name: 'Pricing · taller nav', kind: 'html', src: pricingHTML({ navH: 97 }),
      note: 'One bug: the nav bar is 24px taller, which pushes the whole page down.' },
    { id: 'pricing-c', design: 'pricing', name: 'Pricing · three bugs', kind: 'html', src: pricingHTML({ teamCtaGray: true, dropScim: true, docsShift: 30 }),
      note: 'Team CTA is gray, Enterprise lost a feature row, Docs link sits 30px right.',
      missing: [{ label: 'Enterprise card lost “SCIM provisioning”', box: { x0: 826, y0: 584, x1: 1000, y1: 608 } }] },
    { id: 'pricing-d', design: 'pricing', name: 'Pricing · card drop + toggle', kind: 'html', src: pricingHTML({ teamDrop: true, toggleYearly: true }),
      note: 'Team card renders 18px low; billing toggle shows the wrong selection.' },
    { id: 'settings-a', design: 'settings', name: 'Settings · faithful, fallback font', kind: 'html', src: settingsHTML(),
      note: 'Built from the spec in the fallback font. Buttons hug their labels, so their widths differ. No layout bugs.' },
    { id: 'settings-b', design: 'settings', name: 'Settings · four bugs', kind: 'html', src: settingsHTML({ emailNarrow: true, extraHelper: true, dropSwitch: true, buttonsLeft: true }),
      note: 'Narrow email field, an extra helper line that pushes rows down, a missing switch, left-aligned actions.',
      missing: [{ label: 'Two-factor switch missing', box: { x0: 984, y0: 530, x1: 1028, y1: 554 } }] },
    { id: 'mobile-a', design: 'mobile', name: 'Mobile · paragraph reflow', kind: 'html', src: mobileHTML({ narrowExcerpt: true }),
      note: 'No bugs, but the excerpt wraps to four lines, so everything below the card shifts 22px.' },
    { id: 'mobile-b', design: 'mobile', name: 'Mobile · four bugs', kind: 'html', src: mobileHTML({ imgH: 140, swapRows: true, squareAvatar: true, shiftSearch: 16 }),
      note: 'Short cover image, two list rows swapped, square avatar, Search icon 16px off-center.' },
  ];
  const gallery = [
    { id: 'clean', title: 'Fonts differ, nothing broken', design: 'pricing', impl: 'pricing-a', algo: 'viterbi-flow', tag: 'clean' },
    { id: 'clean-pixel', title: 'Same pair through a pixel diff', design: 'pricing', impl: 'pricing-a', algo: 'pixel', tag: 'baseline' },
    { id: 'cascade-flat', title: 'Taller nav, flat boxes', design: 'pricing', impl: 'pricing-b', algo: 'flat', tag: 'cascade' },
    { id: 'cascade-tree', title: 'Taller nav, parent-relative tree', design: 'pricing', impl: 'pricing-b', algo: 'tree', tag: 'cascade' },
    { id: 'cascade-flow', title: 'Taller nav, flow attribution', design: 'pricing', impl: 'pricing-b', algo: 'viterbi-flow', tag: 'cascade' },
    { id: 'pricing-bugs', title: 'Three planted bugs', design: 'pricing', impl: 'pricing-c', algo: 'viterbi-flow', tag: 'bugs' },
    { id: 'pricing-drop', title: 'Card drops, toggle flips', design: 'pricing', impl: 'pricing-d', algo: 'viterbi-flow', tag: 'bugs' },
    { id: 'settings-clean', title: 'Settings, faithful', design: 'settings', impl: 'settings-a', algo: 'viterbi-flow', tag: 'clean' },
    { id: 'settings-bugs', title: 'Settings, four bugs', design: 'settings', impl: 'settings-b', algo: 'viterbi-flow', tag: 'bugs' },
    { id: 'reflow-tree', title: 'Paragraph reflow, tree', design: 'mobile', impl: 'mobile-a', algo: 'tree', tag: 'cascade' },
    { id: 'reflow-flow', title: 'Paragraph reflow, flow', design: 'mobile', impl: 'mobile-a', algo: 'viterbi-flow', tag: 'cascade' },
    { id: 'mobile-bugs', title: 'Mobile, four bugs', design: 'mobile', impl: 'mobile-b', algo: 'viterbi-flow', tag: 'bugs' },
    { id: 'mismatch', title: 'Wrong pairing', design: 'pricing', impl: 'settings-a', algo: 'viterbi-flow', tag: 'mix' },
  ];
  return { designs, impls, gallery };
})();
if (typeof window !== 'undefined') window.Presets = Presets;
