/* Documentation page content: navigation tree, article copy, code and parameters. */
export const BRAND = 'Corvid';
export const TOPLINKS = ['Guides', 'API', 'Changelog'];
export const SIDEBAR = [
  { group: 'Getting started', items: ['Introduction', 'Installation', ['Quickstart', true]] },
  { group: 'Core concepts', items: ['Assets', 'Scans', 'Findings', 'Policies'] },
  { group: 'Integrations', items: ['Slack', 'Jira', 'Webhooks'] },
  { group: 'Reference', items: ['CLI', 'REST API'] },
];
export const TOC = [['Install the CLI', true], ['Authenticate'], ['Run your first scan'], ['Scan options'], ['Next steps']];
export const CRUMBS = ['Getting started', 'Quickstart'];
export const LEAD = 'Install the Corvid CLI, connect it to your workspace and run a first external scan of a domain you own. The whole walkthrough takes about five minutes.';
export const P1 = 'The CLI is a single static binary for macOS, Linux and Windows. Pick the package manager you already use; every channel ships the same build within an hour of a release.';
export const P2 = 'Point the scanner at a domain you own. It maps subdomains, ports and certificates.';
export const CALLOUT = 'Scans only touch assets you have verified. Add a DNS TXT record before your first scan.';
export const TABS = ['npm', 'brew', 'curl'];
/* code lines as [text, color] tokens */
export const CODE = [
  [['$ ', '#64748B'], ['npm install', '#E2E8F0'], [' -g ', '#7DD3FC'], ['@corvid/cli', '#FBBF24']],
  [['$ ', '#64748B'], ['corvid login', '#E2E8F0'], [' --workspace ', '#7DD3FC'], ['acme-sec', '#FBBF24']],
  [['$ ', '#64748B'], ['corvid scan', '#E2E8F0'], [' example.com', '#FBBF24'], [' --depth ', '#7DD3FC'], ['2', '#C4B5FD']],
];
export const PARAMS = [
  ['--depth', 'How many levels of subdomains to follow', '1'],
  ['--ports', 'Port set to probe: top100, top1000 or a list', 'top100'],
  ['--format', 'Output as table, json or sarif', 'table'],
];
export const C = {
  page: '#FFFFFF', side: '#FAFAFA', ink: '#0F172A', ink2: '#475569', muted: '#94A3B8', line: '#E5E7EB', accent: '#4F46E5', accentSoft: '#EEF2FF',
  code: '#0F172A', codeBar: '#1E293B', info: '#2563EB', infoSoft: '#EFF6FF',
};
