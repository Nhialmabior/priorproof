import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PROFILE_PHOTO_SIZE,
  validateProfileName,
  validateProfilePhoto
} from '../src/utils/profileValidation.js';

test('trims a valid profile name', () => {
  assert.equal(validateProfileName('  Alex Example  '), null);
});

test('rejects empty and whitespace-only profile names', () => {
  assert.equal(validateProfileName(''), 'Enter your full name.');
  assert.equal(validateProfileName('   '), 'Enter your full name.');
});

test('enforces the 100-character profile name limit', () => {
  assert.equal(validateProfileName('A'.repeat(100)), null);
  assert.match(validateProfileName('A'.repeat(101)), /100 characters or fewer/);
});

test('allows supported profile images up to and including 1 MB', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(validateProfilePhoto({ type, size: MAX_PROFILE_PHOTO_SIZE }), null);
  }
});

test('rejects empty, unsupported and oversized profile images', () => {
  assert.match(validateProfilePhoto({ type: 'image/png', size: 0 }), /empty/);
  assert.match(validateProfilePhoto({ type: 'image/gif', size: 100 }), /JPG, PNG or WebP/);
  assert.match(validateProfilePhoto({ type: 'image/png', size: MAX_PROFILE_PHOTO_SIZE + 1 }), /no larger than 1 MB/);
});

test('allows an absent profile image when the user keeps the current picture', () => {
  assert.equal(validateProfilePhoto(null), null);
});
