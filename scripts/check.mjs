#!/usr/bin/env node
// Validates site content: every site/data/*.json must parse, and local files
// referenced from them (files/..., img/...) should exist. Runs in CI before
// each deploy, and locally via `npm run check`.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const dataDir = join(siteDir, 'data');

let failed = false;
const data = {};
for (const f of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
  try {
    data[f] = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
  } catch (e) {
    console.error(`✖ site/data/${f} is not valid JSON: ${e.message}`);
    failed = true;
  }
}

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

if (failed) process.exit(1);
console.log('✔ Content OK');
