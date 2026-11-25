export const MAX_EVIDENCE_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EVIDENCE_EXTENSIONS = new Set([
  'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'txt'
]);

export function getEvidenceFileValidationError(file) {
  if (!file) return null;
  if (!file.size) return 'The selected file is empty. Please choose a different file.';
  if (file.size > MAX_EVIDENCE_FILE_SIZE) return 'Please choose a file that is 5 MB or smaller.';

  const name = String(file.name || '');
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  if (!ALLOWED_EVIDENCE_EXTENSIONS.has(extension)) {
    return 'Unsupported file type. Choose a PDF, PNG, JPG, Word document or TXT file.';
  }

  return null;
}
