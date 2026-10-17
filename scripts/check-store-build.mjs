#!/usr/bin/env node
/**
 * Run before an App Store / Play production build:
 *   npm run check:store            (checks the `production` EAS profile)
 *   npm run check:store -- testflight
 *
 * Fails when the store build could show Alpha/Beta screens or point at a non-production backend:
 * - the profile must target the cloud Nhost project, not `local`;
 * - the profile must not set EXPO_PUBLIC_CREWUP_APP_MODE (dev-only override);
 * - the live GET /v1/public/app-config must answer `launched`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const profileName = process.argv[2] ?? 'production';
const eas = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8'));

function resolveProfile(name, seen = new Set()) {
  const profile = eas.build?.[name];
  if (!profile) throw new Error(`eas.json has no build profile "${name}"`);
  if (!profile.extends || seen.has(name)) return profile;
  seen.add(name);
  const parent = resolveProfile(profile.extends, seen);
  return { ...parent, ...profile, env: { ...parent.env, ...profile.env } };
}

const problems = [];
const profile = resolveProfile(profileName);
const env = profile.env ?? {};
const subdomain = env.EXPO_PUBLIC_NHOST_SUBDOMAIN;
const region = env.EXPO_PUBLIC_NHOST_REGION;

if (!subdomain || subdomain === 'local' || !region || region === 'local') {
  problems.push(`profile "${profileName}" must set the cloud EXPO_PUBLIC_NHOST_SUBDOMAIN and EXPO_PUBLIC_NHOST_REGION`);
}
if (env.EXPO_PUBLIC_CREWUP_APP_MODE) {
  problems.push(`profile "${profileName}" sets EXPO_PUBLIC_CREWUP_APP_MODE; remove it (the mode comes from the server)`);
}
if (profile.developmentClient) {
  problems.push(`profile "${profileName}" is a development client build`);
}

if (subdomain && region && subdomain !== 'local') {
  const url = env.EXPO_PUBLIC_NHOST_FUNCTIONS_URL ?? `https://${subdomain}.functions.${region}.nhost.run/v1`;
  try {
    const response = await fetch(`${url}/public/app-config`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) problems.push(`app-config returned HTTP ${response.status}`);
    else if (body.mode !== 'launched') {
      problems.push(`app-config mode is "${body.mode}"; set CREWUP_APP_MODE=launched before submitting to the stores`);
    }
  } catch (error) {
    problems.push(`could not reach app-config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (problems.length) {
  console.error(`Store build check failed for "${profileName}":`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Store build check passed for "${profileName}".`);
