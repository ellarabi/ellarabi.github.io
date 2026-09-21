#!/usr/bin/env node
// Deploys ./site to Cloudflare Pages.
//
//   npm run deploy            -> production (https://<project>.pages.dev)
//   npm run deploy -- preview -> preview URL, production untouched
//
// Auth: either run `npx wrangler login` once, or put CLOUDFLARE_API_TOKEN and
// CLOUDFLARE_ACCOUNT_ID in a local .env file (see .env.example).

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = join(root, 'site');
const preview = process.argv.includes('preview');

const fail = (msg) => { console.error(`\n✖ ${msg}`); process.exit(1); };

// --- Load .env (simple KEY=VALUE lines) without overriding real env vars.
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const project = process.env.CF_PAGES_PROJECT || 'ellarbi';

// --- Validate content before shipping anything.
console.log('Checking site content…');
const dataDir = join(siteDir, 'data');
const data = {};
for (const f of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
  try {
    data[f] = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
  } catch (e) {
    fail(`site/data/${f} is not valid JSON: ${e.message}`);
  }
}

// Every local file referenced from the data files must exist in ./site.
const localRefs = [];
const collect = (v) => {
  if (typeof v === 'string') {
    if (/^(files|img)\//.test(v)) localRefs.push(v);
  } else if (v && typeof v === 'object') {
    Object.values(v).forEach(collect);
  }
};
collect(data);
const missing = [...new Set(localRefs)].filter((p) => !existsSync(join(siteDir, p)));
if (missing.length) {
  console.warn(`⚠ Referenced files missing from site/ (links will 404):\n  ${missing.join('\n  ')}`);
}

// --- Git info, so each deployment is traceable to a commit.
const git = (...args) => {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
};
const commitHash = git('rev-parse', 'HEAD');
const dirty = git('status', '--porcelain', '--', 'site') !== '';
if (dirty) console.warn('⚠ site/ has uncommitted changes — remember to commit and push after deploying.');

// --- Deploy.
const branch = preview ? 'preview' : 'main';
const args = [
  'wrangler', 'pages', 'deploy', siteDir,
  '--project-name', project,
  '--branch', branch,
];
if (commitHash) args.push('--commit-hash', commitHash, '--commit-message', git('log', '-1', '--pretty=%s') || 'deploy');
if (dirty) args.push('--commit-dirty=true');

console.log(`\nDeploying to Cloudflare Pages project "${project}" (${preview ? 'preview' : 'production'})…\n`);
const res = spawnSync('npx', args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (res.status !== 0) {
  fail(`Deployment failed. If the project doesn't exist yet, run:  npm run setup`);
}
console.log('\n✔ Deployed.');
