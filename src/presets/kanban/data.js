/* Remediation sprint board: columns of security tickets with labels, owners and dates. */
export const PROJECT = 'Q4 remediation sprint';
export const TABS = ['Board', 'List', 'Timeline', 'Files'];
export const PEOPLE = { AK: '#F59E0B', MR: '#10B981', JL: '#6366F1', SN: '#EC4899', TP: '#0EA5E9' };
export const FILTERS = ['Assignee', 'Severity', 'Labels'];
const T = (id, title, pri, labels, who, due, extra = {}) => ({ id, title, pri, labels, who, due, ...extra });
export const COLUMNS = [
  { name: 'To do', color: '#94A3B8', cards: [
    T('SEC-148', 'Rotate leaked API token', 'urgent', [['secrets', 'red']], 'MR', 'Oct 14'),
    T('SEC-151', 'Patch OpenSSL on edge', 'high', [['CVE-2026-1102', 'red'], ['infra', 'gray']], 'AK', 'Oct 17'),
    T('SEC-153', 'Close public S3 bucket', 'high', [['cloud', 'amber']], 'JL', 'Oct 18'),
    T('SEC-156', 'Enable MFA for admins', 'medium', [['identity', 'violet']], 'SN', 'Oct 21'),
  ] },
  { name: 'In progress', color: '#3B82F6', cards: [
    T('SEC-139', 'Upgrade Jenkins to LTS', 'high', [['CVE-2026-0988', 'red']], 'TP', 'Oct 15', { progress: 0.6 }),
    T('SEC-142', 'Remove RDP from VPN', 'urgent', [['network', 'gray']], 'AK', 'Oct 16', { progress: 0.3 }),
    T('SEC-144', 'Pin TLS 1.2 minimum', 'medium', [['web', 'blue']], 'MR', 'Oct 19'),
  ] },
  { name: 'In review', color: '#F59E0B', cards: [
    T('SEC-131', 'Fix SSRF in image proxy', 'urgent', [['CVE-2026-0871', 'red'], ['api', 'gray']], 'JL', 'Oct 13', { progress: 0.9 }),
    T('SEC-136', 'Harden CSP headers', 'medium', [['web', 'blue']], 'SN', 'Oct 15'),
  ] },
  { name: 'Done', color: '#10B981', cards: [
    T('SEC-120', 'Revoke stale SSH keys', 'high', [['identity', 'violet']], 'TP', 'Oct 8', { done: true }),
    T('SEC-124', 'Block Telnet at border', 'medium', [['network', 'gray']], 'MR', 'Oct 9', { done: true }),
    T('SEC-127', 'Expire old certificates', 'low', [['web', 'blue']], 'AK', 'Oct 10', { done: true }),
  ] },
];
export const LABEL = { red: ['#FEE2E2', '#B91C1C'], gray: ['#F1F5F9', '#475569'], amber: ['#FEF3C7', '#B45309'], violet: ['#EDE9FE', '#6D28D9'], blue: ['#DBEAFE', '#1D4ED8'] };
export const PRI = { urgent: '#DC2626', high: '#EA580C', medium: '#CA8A04', low: '#64748B' };
export const C = { page: '#FFFFFF', col: '#F4F5F7', ink: '#111827', ink2: '#4B5563', muted: '#9CA3AF', line: '#E5E7EB', accent: '#2563EB' };
