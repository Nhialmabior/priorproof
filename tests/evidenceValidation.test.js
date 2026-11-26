import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_EVIDENCE_FILE_SIZE,
  getEvidenceFileValidationError
} from '../src/utils/evidenceValidation.js';

const makeFile = (name, size = 1024, type = '') => ({ name, size, type });

test('allows each supported evidence extension', () => {
  for (const name of ['report.pdf', 'photo.PNG', 'scan.jpg', 'scan.jpeg', 'letter.doc', 'report.docx', 'notes.txt']) {
    assert.equal(getEvidenceFileValidationError(makeFile(name, 1)), null, name);
  }
});

test('rejects a missing file without treating it as an error', () => {
  assert.equal(getEvidenceFileValidationError(null), null);
});

test('rejects empty files', () => {
  assert.match(getEvidenceFileValidationError(makeFile('report.pdf', 0)), /empty/i);
});

test('accepts files at the configured 5 MB limit', () => {
  assert.equal(getEvidenceFileValidationError(makeFile('report.pdf', MAX_EVIDENCE_FILE_SIZE)), null);
});

test('rejects files larger than 5 MB', () => {
  assert.match(getEvidenceFileValidationError(makeFile('report.pdf', MAX_EVIDENCE_FILE_SIZE + 1)), /5 MB/i);
});

test('rejects unsupported or misleading extensions even when MIME metadata looks valid', () => {
  for (const name of ['archive.zip', 'script.exe', 'pdf', '.pdf', 'report.', 'photo.jpg.exe']) {
    assert.match(getEvidenceFileValidationError(makeFile(name, 1, 'application/pdf')), /Unsupported file type/i, name);
  }
});

import { isEvidencePathOwnedByUser } from '../src/utils/evidencePath.js';

test('evidence storage paths are confined to the exact signed-in account folder', () => {
  assert.equal(isEvidencePathOwnedByUser('user-1/evidence-1/file.pdf', 'user-1'), true);
  assert.equal(isEvidencePathOwnedByUser('user-10/evidence-1/file.pdf', 'user-1'), false);
  assert.equal(isEvidencePathOwnedByUser('other-user/evidence-1/file.pdf', 'user-1'), false);
  assert.equal(isEvidencePathOwnedByUser('user-1/../other-user/file.pdf', 'user-1'), false);
  assert.equal(isEvidencePathOwnedByUser('user-1/evidence-1/./file.pdf', 'user-1'), false);
  assert.equal(isEvidencePathOwnedByUser('user-1//file.pdf', 'user-1'), false);
  assert.equal(isEvidencePathOwnedByUser('user-1/file.pdf', 'user-1'), false);
  assert.equal(isEvidencePathOwnedByUser(null, 'user-1'), false);
});
