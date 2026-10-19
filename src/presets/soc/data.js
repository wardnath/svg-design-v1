/* Fixture data for the SOC overview. Design and build render the same numbers,
   as a mock and its implementation would against one API response. */
import { rng } from '../../design-kit/charts.js';

export const BRAND = 'Halberd';
export const NAV = [
  { group: 'Monitor', items: [['grid', 'Overview', true], ['alert', 'Alerts', false, '24'], ['flag', 'Incidents'], ['globe', 'Threat map']] },
  { group: 'Investigate', items: [['search', 'Hunting'], ['server', 'Assets'], ['users', 'Identities'], ['bug', 'Vulnerabilities']] },
  { group: 'Respond', items: [['zap', 'Playbooks'], ['file', 'Reports']] },
];
export const USER = { initials: 'RK', name: 'Rina Kato', role: 'Tier 2 analyst' };

const R = rng(7);
const walk = (n, start, vol, drift = 0) => { let v = start; return Array.from({ length: n }, () => (v = Math.max(1, v + (R() - 0.5) * vol + drift))); };

export const KPIS = [
  { label: 'Threats blocked', value: '12,847', delta: '+8.2%', up: true, good: true, icon: 'shieldCheck', tint: '#22D3EE', spark: walk(24, 40, 14, 0.8) },
  { label: 'Active incidents', value: '23', delta: '+3', up: true, good: false, icon: 'flag', tint: '#F87171', spark: walk(24, 18, 6, 0.2) },
  { label: 'Mean time to respond', value: '18m', delta: '−12%', up: false, good: true, icon: 'clock', tint: '#A78BFA', spark: walk(24, 30, 8, -0.5) },
  { label: 'Assets at risk', value: '142', delta: '+5', up: true, good: false, icon: 'server', tint: '#FBBF24', spark: walk(24, 22, 7, 0.3) },
];

export const SEVERITY = [
  { name: 'Critical', n: 18, color: '#F43F5E' },
  { name: 'High', n: 64, color: '#FB923C' },
  { name: 'Medium', n: 211, color: '#FACC15' },
  { name: 'Low', n: 486, color: '#38BDF8' },
];

/* 24 hourly buckets, three stacked series. */
const base = walk(24, 120, 40, 0);
export const EVENTS = {
  hours: Array.from({ length: 24 }, (_, i) => i),
  series: [
    { name: 'Blocked', color: '#22D3EE', v: base.map(v => v * 1.0) },
    { name: 'Detected', color: '#A78BFA', v: base.map((v, i) => v * 0.45 + 20 * Math.sin(i / 3) + 30) },
    { name: 'Escalated', color: '#F43F5E', v: base.map((v, i) => 6 + (i > 13 && i < 18 ? 28 : 4) + (R() * 6)) },
  ],
};

export const VECTORS = [
  ['Phishing', 34], ['Brute force', 22], ['Malware C2', 18], ['SQL injection', 11], ['Lateral movement', 8],
];

/* Attack origin → target pairs on the map (lon, lat). */
export const ATTACKS = [
  { from: [37.6, 55.8], to: [-77.0, 38.9], sev: 'Critical' },
  { from: [116.4, 39.9], to: [-122.4, 37.8], sev: 'High' },
  { from: [126.9, 37.5], to: [8.7, 50.1], sev: 'High' },
  { from: [-46.6, -23.5], to: [-0.1, 51.5], sev: 'Medium' },
  { from: [28.9, 41.0], to: [2.35, 48.86], sev: 'Medium' },
  { from: [77.2, 28.6], to: [139.7, 35.7], sev: 'Medium' },
  { from: [3.4, 6.5], to: [-74.0, 40.7], sev: 'High' },
];
export const ORIGINS = [['Russia', 2841, '#F43F5E'], ['China', 1972, '#FB923C'], ['Brazil', 1205, '#FACC15'], ['Nigeria', 884, '#FB923C'], ['Turkey', 612, '#FACC15']];

export const ALERTS = [
  { sev: 'Critical', title: 'Credential dumping via LSASS access', id: 'ALR-20931', src: '185.220.101.47', asset: 'dc-prod-02', mitre: 'T1003.001', status: 'Investigating', time: '2m ago' },
  { sev: 'High', title: 'Impossible travel sign-in', id: 'ALR-20928', src: '102.89.34.12', asset: 'okta / m.ortiz', mitre: 'T1078', status: 'Open', time: '9m ago' },
  { sev: 'High', title: 'Beaconing to known C2 domain', id: 'ALR-20925', src: '10.4.12.77', asset: 'wks-fin-114', mitre: 'T1071.001', status: 'Contained', time: '14m ago' },
  { sev: 'Medium', title: 'Password spray against VPN', id: 'ALR-20919', src: '45.155.205.233', asset: 'vpn-edge-01', mitre: 'T1110.003', status: 'Open', time: '31m ago' },
  { sev: 'Low', title: 'New admin added to S3 policy', id: 'ALR-20911', src: 'iam.amazonaws.com', asset: 'aws / prod', mitre: 'T1098', status: 'Resolved', time: '1h ago' },
];
export const STATUS_COLOR = { Investigating: '#A78BFA', Open: '#FB923C', Contained: '#22D3EE', Resolved: '#34D399' };
export const SEV_COLOR = Object.fromEntries(SEVERITY.map(s => [s.name, s.color]));

export const C = {
  page: '#090D16', side: '#0E1422', top: '#0E1422', card: '#111A2B', line: '#1E2A3F', line2: '#253248',
  ink: '#E6EDF7', ink2: '#9AA7BD', muted: '#64718A', map: '#2A3953', accent: '#22D3EE',
};
