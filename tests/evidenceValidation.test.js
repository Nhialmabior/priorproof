import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_EVIDENCE_FILE_SIZE,
  getEvidenceFileValidationError
} from '../src/utils/evidenceValidation.js';

test('allows each supported evidence extension', () => {
  for (const name of ['report.pdf', 'photo.PNG', 'scan.jpg', 'scan.jpeg', 'letter.doc', 'report.docx', 'notes.txt']) {
    assert.equal(getEvidenceFileValidationError({ name, size: 1 }), null, name);
  }
});

test('rejects a missing file without treating it as an error', () => {
  assert.equal(getEvidenceFileValidationError(null), null);
});

test('rejects empty files', () => {
  assert.match(getEvidenceFileValidationError({ name: 'report.pdf', size: 0 }), /empty/i);
});

test('accepts files at the 5 MB limit', () => {
  assert.equal(getEvidenceFileValidationError({ name: 'report.pdf', size: MAX_EVIDENCE_FILE_SIZE }), null);
});

test('rejects files larger than 5 MB', () => {
  assert.match(getEvidenceFileValidationError({ name: 'report.pdf', size: MAX_EVIDENCE_FILE_SIZE + 1 }), /5 MB/i);
});

test('rejects unsupported or missing extensions', () => {
  for (const name of ['archive.zip', 'script.exe', 'pdf', '.pdf', 'report.']) {
    assert.match(getEvidenceFileValidationError({ name, size: 1 }), /Unsupported file type/i, name);
  }
});
