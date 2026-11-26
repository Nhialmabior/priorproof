export const MIN_PASSWORD_LENGTH = 12;

export function validateStrongPassword(value) {
  const password = String(value ?? '');
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  if (!/[^A-Za-z0-9\s]/.test(password)) return 'Add at least one symbol, such as !, @, # or $.';
  return null;
}

export function validatePasswordReset(password, confirmation) {
  const passwordError = validateStrongPassword(password);
  if (passwordError) return passwordError;
  if (String(password ?? '') !== String(confirmation ?? '')) {
    return 'Your passwords do not match.';
  }
  return null;
}
