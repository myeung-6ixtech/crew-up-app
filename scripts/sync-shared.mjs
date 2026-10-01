#!/usr/bin/env node
/**
 * Copies the monorepo packages/shared into this app so EAS uploads it.
 * Source of truth stays at ../../packages/shared. Commit the copy before a cloud build.
 */
import { cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(appRoot, '../packages/shared');
const targetRoot = path.resolve(appRoot, 'packages/shared');

if (!existsSync(sourceRoot)) {
  console.error(`sync-shared: source not found at ${sourceRoot}`);
  process.exit(1);
}

await rm(targetRoot, { recursive: true, force: true });
await cp(sourceRoot, targetRoot, {
  recursive: true,
  filter: (src) => !src.includes(`${path.sep}node_modules${path.sep}`),
});

console.log(`Synced packages/shared into ${path.relative(appRoot, targetRoot)}.`);
