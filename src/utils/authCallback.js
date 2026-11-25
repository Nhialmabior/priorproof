export function isEmailConfirmationCallback({ pathname, search = '', hash = '' }) {
  if (pathname !== '/app/dashboard') return false;
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(String(hash).replace(/^#/, ''));
  return query.has('code')
    || query.has('error')
    || query.has('error_code')
    || fragment.has('access_token')
    || fragment.has('error');
}

export function getEmailConfirmationError(search = '', hash = '') {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(String(hash).replace(/^#/, ''));
  return query.get('error_description')
    || query.get('error')
    || fragment.get('error_description')
    || fragment.get('error')
    || '';
}
