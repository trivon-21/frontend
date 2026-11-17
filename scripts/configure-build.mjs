import { writeFileSync } from 'node:fs';
const deploy = process.argv.includes('--deploy');
const configured = process.env.AIRLUX_API_URL?.trim();
if (deploy && !configured) throw new Error('Set AIRLUX_API_URL to the HTTPS backend base including /api.');
const apiUrl = configured || '/api';
if (configured) {
  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/api')) {
    throw new Error('AIRLUX_API_URL must be an HTTPS URL ending in /api, without credentials, query, or fragment.');
  }
  if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) throw new Error('Deployments cannot use a localhost API.');
}
writeFileSync(new URL('../src/environments/environment.generated.ts', import.meta.url),
  `// Generated public configuration. Do not add secrets.\nexport const apiUrl = ${JSON.stringify(apiUrl)};\n`);
