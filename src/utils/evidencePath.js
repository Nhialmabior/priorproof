export function isEvidencePathOwnedByUser(path, userId) {
  if (typeof path !== 'string' || typeof userId !== 'string' || !userId) return false;
  const segments = path.split('/');
  if (segments.length < 3 || segments[0] !== userId) return false;
  return segments.every(segment => segment && segment !== '.' && segment !== '..');
}
