/* Mobile security app home screen: status card, quick actions, recent alerts, tab bar. */
export const USER = { name: 'Maya', initials: 'MO' };
export const STATUS = { title: 'You are protected', sub: '12 accounts monitored · last scan 2 min ago', score: 92 };
export const ACTIONS = [['radar', 'Scan', '#4F46E5', '#EEF2FF'], ['key', 'Passwords', '#0EA5E9', '#E0F2FE'], ['shield', 'VPN', '#10B981', '#D1FAE5'], ['cpu', 'Devices', '#F59E0B', '#FEF3C7']];
export const ALERTS = [
  { icon: 'alert', tint: '#DC2626', bg: '#FEE2E2', title: 'Password found in a breach', sub: 'maya@fastmail.com · 2 sites', time: '9:41' },
  { icon: 'globe', tint: '#EA580C', bg: '#FFEDD5', title: 'New sign-in from Lisbon', sub: 'Chrome on macOS · approve?', time: '8:02' },
  { icon: 'lock', tint: '#2563EB', bg: '#DBEAFE', title: 'Router firmware updated', sub: 'Home network · 1.4.22', time: 'Yday' },
  { icon: 'check', tint: '#059669', bg: '#D1FAE5', title: 'Weekly scan complete', sub: 'No new exposures found', time: 'Mon' },
];
export const TABS = [['home', 'Home', true], ['shield', 'Protect'], ['bell', 'Alerts'], ['user', 'Account']];
export const C = { page: '#F6F7FB', card: '#FFFFFF', ink: '#0F172A', ink2: '#475569', muted: '#94A3B8', line: '#E8ECF2', accent: '#4F46E5' };
