export const MAX_PROFILE_PHOTO_SIZE = 1024 * 1024;
const PROFILE_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateProfileName(value) {
  const name = String(value ?? '').trim();
  if (!name) return 'Enter your full name.';
  if (name.length > 100) return 'Your full name must be 100 characters or fewer.';
  return null;
}

export function validateProfilePhoto(file) {
  if (!file) return null;
  if (!file.size) return 'The selected profile picture is empty. Choose another image.';
  if (!PROFILE_PHOTO_TYPES.has(file.type)) return 'Choose a JPG, PNG or WebP image.';
  if (file.size > MAX_PROFILE_PHOTO_SIZE) return 'Choose an image no larger than 1 MB.';
  return null;
}
