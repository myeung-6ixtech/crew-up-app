#!/usr/bin/env node
/**
 * Writes constants/licenses.json from the app's runtime dependencies (name, version, license, repository).
 * Run `npm run licenses` after adding or upgrading a dependency.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function repoUrl(repository) {
  const raw = typeof repository === 'string' ? repository : repository?.url;
  if (!raw) return null;
  return raw
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^github:/, 'https://github.com/')
    .replace(/\.git$/, '');
}

const entries = Object.keys(pkg.dependencies ?? {})
  .filter((name) => !name.startsWith('@crewup/'))
  .sort()
  .map((name) => {
    const file = join(root, 'node_modules', name, 'package.json');
    if (!existsSync(file)) return { name, version: pkg.dependencies[name], license: 'Unknown', url: null };
    const dep = JSON.parse(readFileSync(file, 'utf8'));
    const license = typeof dep.license === 'string' ? dep.license : dep.license?.type ?? (dep.licenses?.[0]?.type ?? 'Unknown');
    return { name, version: dep.version, license, url: repoUrl(dep.repository) ?? dep.homepage ?? null };
  });

writeFileSync(join(root, 'constants', 'licenses.json'), `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} licenses to constants/licenses.json`);
