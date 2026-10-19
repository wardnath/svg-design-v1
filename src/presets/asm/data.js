/* Fixture data for the attack-surface summary (light theme). Design and build
   render the same numbers, as a mock and its implementation would. */
import { rng } from '../../design-kit/charts.js';

export const BRAND = 'Perimeter';
export const USER = { initials: 'JM' };

export const RAIL = [['home'], ['radar', true], ['shield'], ['bug'], ['file'], ['sliders']];

export const NAV = [
  { group: 'Monitor', items: [['grid', 'Summary', true], ['server', 'Assets', false, '1,284', 'count'], ['globe', 'Domains'], ['lock', 'Certificates'], ['cloud', 'Cloud accounts']] },
  { group: 'Findings', items: [['bug', 'Vulnerabilities', false, '37', 'badge'], ['sliders', 'Misconfigs', false, '12', 'badge'], ['key', 'Leaked credentials']] },
  { group: 'Reports', items: [['calendar', 'Scheduled'], ['file', 'Compliance']] },
];

export const SCORE = { value: 72, label: 'High', delta: '+6 pts', note: 'vs last week' };

export const STATS = [
  { label: 'Internet-facing assets', value: '1,284', sub: '+38 new this week', subColor: '#4F46E5', ring: 0.68, ringColor: '#6366F1' },
  { label: 'Critical CVEs open', value: '37', sub: '9 past SLA', subColor: '#DC2626', ring: 0.24, ringColor: '#F43F5E' },
  { label: 'Certificates expiring', value: '12', sub: 'within 30 days', subColor: '#64748B', ring: 0.41, ringColor: '#F59E0B' },
];

const R = rng(31);
const walk = (n, start, vol, drift = 0) => { let v = start; return Array.from({ length: n }, () => (v = Math.max(1, v + (R() - 0.5) * vol + drift))); };
export const TREND = {
  days: 30,
  max: 600,
  series: [
    { name: 'Exposed services', color: '#6366F1', v: walk(30, 360, 34, 2.4), area: true },
    { name: 'New findings', color: '#F43F5E', v: walk(30, 150, 40, -1.2) },
  ],
  xlabels: ['Sep 10', 'Sep 17', 'Sep 24', 'Oct 1', 'Oct 8'],
  ylabels: ['600', '400', '200', '0'],
};

export const SERVICES = [
  ['443', 'HTTPS', 412, '#6366F1'],
  ['22', 'SSH', 96, '#8B5CF6'],
  ['3389', 'RDP', 41, '#F43F5E'],
  ['445', 'SMB', 18, '#F59E0B'],
  ['23', 'Telnet', 7, '#F43F5E'],
];

export const SEVS = [['Critical', '#E11D48'], ['High', '#F97316'], ['Medium', '#EAB308'], ['Low', '#0EA5E9']];
export const HEAT = {
  groups: ['Web apps', 'APIs', 'Cloud storage', 'VPN & edge', 'Endpoints'],
  counts: [
    [9, 21, 34, 18],
    [6, 14, 22, 30],
    [11, 8, 12, 9],
    [4, 17, 9, 5],
    [7, 25, 41, 52],
  ],
};

export const ASSETS = [
  { host: 'vpn-gw-02', type: 'VPN', findings: 14, risk: 91 },
  { host: 'api.payments', type: 'API', findings: 11, risk: 84 },
  { host: 'crm-legacy-01', type: 'Web app', findings: 19, risk: 79 },
  { host: 's3://exports', type: 'Storage', findings: 6, risk: 66 },
  { host: 'jenkins-ci', type: 'Web app', findings: 8, risk: 58 },
];
export const ASSET_SEEN = ['4m ago', '12m ago', '1h ago', '3h ago', '6h ago'];
export const TYPE_COLOR = { VPN: ['#EEF2FF', '#4338CA'], API: ['#ECFEFF', '#0E7490'], 'Web app': ['#F5F3FF', '#6D28D9'], Storage: ['#FFF7ED', '#C2410C'] };
export const riskColor = r => (r >= 80 ? '#E11D48' : r >= 65 ? '#F97316' : '#EAB308');

export const C = {
  page: '#F3F5F9', rail: '#0B1220', railOn: '#1E293B', panel: '#FFFFFF', card: '#FFFFFF', line: '#E3E8EF', line2: '#D5DCE6',
  ink: '#0F172A', ink2: '#475569', muted: '#8391A7', accent: '#4F46E5', accentSoft: '#EEF2FF', track: '#EEF1F6',
};
