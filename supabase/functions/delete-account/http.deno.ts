import { corsHeaders, isAllowedOrigin, jsonResponse } from './http.ts';

Deno.test('origin allowlist requires an exact configured origin', () => {
  if (!isAllowedOrigin('https://app.example', 'https://app.example')) {
    throw new Error('The configured application origin should be allowed.');
  }
  if (isAllowedOrigin('https://attacker.example', 'https://app.example')) {
    throw new Error('An unapproved origin must be rejected.');
  }
  if (isAllowedOrigin('https://app.example', '')) {
    throw new Error('A missing allowlist must fail closed.');
  }
  if (isAllowedOrigin('', 'https://app.example')) {
    throw new Error('A missing request origin must be rejected.');
  }
});

Deno.test('CORS headers never introduce a wildcard origin', () => {
  const headers = corsHeaders('https://app.example');
  if (headers['Access-Control-Allow-Origin'] !== 'https://app.example') {
    throw new Error('CORS must return only the configured application origin.');
  }
});

Deno.test('JSON responses preserve explicit HTTP status codes', async () => {
  const response = jsonResponse(
    { error: 'Session could not be verified.' },
    'https://app.example',
    401
  );
  if (response.status !== 401) {
    throw new Error('Expected the authentication error to return HTTP 401.');
  }
  if (response.headers.get('Access-Control-Allow-Origin') !== 'https://app.example') {
    throw new Error('Expected the configured origin on JSON responses.');
  }
  const body = await response.json();
  if (body.error !== 'Session could not be verified.') {
    throw new Error('Expected the JSON error message to be preserved.');
  }
});
