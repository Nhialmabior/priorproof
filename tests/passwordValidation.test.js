import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_PASSWORD_LENGTH, validateStrongPassword } from '../src/utils/passwordValidation.js';

test('requires at least 12 characters', () => {
  assert.equal(MIN_PASSWORD_LENGTH, 12);
  assert.match(validateStrongPassword('Aa1!short'), /12 characters/);
});

test('requires lowercase, uppercase, number and symbol', () => {
  assert.match(validateStrongPassword('ABCDEFGHIJK1!'), /lowercase/);
  assert.match(validateStrongPassword('abcdefghijk1!'), /uppercase/);
  assert.match(validateStrongPassword('Abcdefghijkl!'), /number/);
  assert.match(validateStrongPassword('Abcdefghijkl1'), /symbol/);
  assert.match(validateStrongPassword('Abcdefghijk 1'), /symbol/);
});

test('accepts a password meeting all requirements', () => {
  assert.equal(validateStrongPassword('PriorProofSecure2026!'), null);
});

test('rejects null and empty values', () => {
  assert.match(validateStrongPassword(''), /12 characters/);
  assert.match(validateStrongPassword(null), /12 characters/);
});
