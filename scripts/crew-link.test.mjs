import test from 'node:test';
import assert from 'node:assert/strict';

const { crewLink, parseCrewLink } = await import('../lib/crewLink.ts');

test('a Crew QR encodes only the Crew ID in a CrewUp link', () => {
  assert.equal(crewLink('CREW-8F2K-9M4X'), 'https://crewup.app/c/CREW8F2K9M4X');
});

test('CrewUp links scan to the Crew ID', () => {
  assert.equal(parseCrewLink('https://crewup.app/c/CREW8F2K9M4X'), 'CREW8F2K9M4X');
  assert.equal(parseCrewLink('https://crewup.app/c/crew-8f2k-9m4x/'), 'CREW8F2K9M4X');
  assert.equal(parseCrewLink('crewup://c/CREW8F2K9M4X'), 'CREW8F2K9M4X');
});

test('anything else is not a CrewUp code', () => {
  for (const raw of [
    'CREW8F2K9M4X',
    'https://evil.example/c/CREW8F2K9M4X',
    'https://crewup.app.evil.example/c/CREW8F2K9M4X',
    'http://crewup.app/c/CREW8F2K9M4X',
    'https://crewup.app/c/NOTACODE',
    'https://crewup.app/delete-account',
    '',
    null,
  ]) {
    assert.equal(parseCrewLink(raw), null, String(raw));
  }
});
