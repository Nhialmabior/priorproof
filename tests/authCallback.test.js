import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailConfirmationCallback, getEmailConfirmationError } from '../src/utils/authCallback.js';

test('recognises a Supabase PKCE email confirmation return', () => {
  assert.equal(isEmailConfirmationCallback({ pathname: '/app/dashboard', search: '?code=abc' }), true);
});

test('recognises an email confirmation error return', () => {
  assert.equal(isEmailConfirmationCallback({ pathname: '/app/dashboard', search: '?error=access_denied' }), true);
  assert.equal(getEmailConfirmationError('?error=access_denied&error_description=Link+expired'), 'Link expired');
});

test('recognises an implicit token confirmation return', () => {
  assert.equal(isEmailConfirmationCallback({ pathname: '/app/dashboard', hash: '#access_token=abc&type=signup' }), true);
});

test('does not classify ordinary routes or dashboard visits as confirmation callbacks', () => {
  assert.equal(isEmailConfirmationCallback({ pathname: '/login', search: '?code=abc' }), false);
  assert.equal(isEmailConfirmationCallback({ pathname: '/app/dashboard' }), false);
});
