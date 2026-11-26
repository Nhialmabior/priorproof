import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_BACKUP_FILE_SIZE,
  parsePriorProofBackup,
  prepareRestoredWorkspace
} from '../src/utils/backupValidation.js';

const account = { id: 'signed-in-user', email: 'account@example.com' };
const sample = () => ({
  app: 'PriorProof',
  schemaVersion: 1,
  exportedAt: '2026-11-25T00:00:00.000Z',
  data: {
    user: { id: 'another-user', email: 'other@example.com', fullName: 'Backup Owner' },
    experiences: [{ id: 'exp-1', title: 'Experience', skills: ['Research', 12] }],
    evidence: [{ id: 'ev-1', experienceId: 'exp-1', fileId: 'old-file', filePath: 'old/path', fileName: 'old.pdf', fileSize: 50, fileType: 'application/pdf' }],
    competencies: [{ id: 'comp-1', experienceIds: ['exp-1', 'missing-exp'], evidenceIds: ['ev-1', 'missing-ev'] }],
    assessments: [{ id: 'pack-1', competencyId: 'comp-1', evidenceIds: ['ev-1', 'missing-ev'] }]
  }
});

test('accepts a current PriorProof version 1 backup', () => {
  assert.equal(parsePriorProofBackup(JSON.stringify(sample())).candidate.user.fullName, 'Backup Owner');
});

test('accepts a legacy raw workspace backup', () => {
  const legacy = sample().data;
  assert.equal(parsePriorProofBackup(JSON.stringify(legacy)).candidate.user.email, 'other@example.com');
});

test('rejects malformed JSON and unrelated application backups', () => {
  assert.throws(() => parsePriorProofBackup('{bad json'), /valid JSON/i);
  assert.throws(() => parsePriorProofBackup(JSON.stringify({ app: 'OtherApp', data: {} })), /not a PriorProof backup/i);
});

test('rejects unsupported schema versions and invalid workspace structures', () => {
  const unsupported = sample();
  unsupported.schemaVersion = 2;
  assert.throws(() => parsePriorProofBackup(JSON.stringify(unsupported)), /version is not supported/i);
  assert.throws(() => parsePriorProofBackup(JSON.stringify({ app: 'PriorProof', schemaVersion: 1, data: {} })), /valid PriorProof backup/i);
});

test('rejects missing and duplicate record IDs', () => {
  const missing = sample();
  missing.data.evidence[0].id = '';
  assert.throws(() => parsePriorProofBackup(JSON.stringify(missing)), /missing a valid ID/i);

  const duplicate = sample();
  duplicate.data.experiences.push({ id: 'exp-1' });
  assert.throws(() => parsePriorProofBackup(JSON.stringify(duplicate)), /duplicate experience IDs/i);
});

test('rejects malformed review pack records', () => {
  const malformed = sample();
  malformed.data.assessments = [{ title: 'No ID' }];
  assert.throws(() => parsePriorProofBackup(JSON.stringify(malformed)), /review pack record is missing/i);
});

test('restores records under the signed-in identity, not the backup identity', () => {
  const { workspace, counts } = prepareRestoredWorkspace(sample(), account);
  assert.equal(workspace.user.id, account.id);
  assert.equal(workspace.user.email, account.email);
  assert.equal(workspace.user.fullName, 'Backup Owner');
  assert.deepEqual(counts, { experiences: 1, evidence: 1, competencies: 1, assessments: 1 });
});

test('removes dangling relationships and clears attachment references', () => {
  const { workspace } = prepareRestoredWorkspace(sample(), account);
  assert.deepEqual(workspace.experiences[0].skills, ['Research']);
  assert.deepEqual(workspace.competencies[0].experienceIds, ['exp-1']);
  assert.deepEqual(workspace.competencies[0].evidenceIds, ['ev-1']);
  assert.equal(workspace.evidence[0].experienceId, 'exp-1');
  assert.equal(workspace.evidence[0].fileId, null);
  assert.equal(workspace.evidence[0].filePath, null);
  assert.equal(workspace.evidence[0].fileName, '');
  assert.equal(workspace.evidence[0].fileSize, 0);
  assert.equal(workspace.evidence[0].fileType, '');
  assert.deepEqual(workspace.assessments[0].evidenceIds, ['ev-1']);
  assert.equal(workspace.assessments[0].competencyId, 'comp-1');
});

test('clears relationships that point to records absent from the backup', () => {
  const raw = sample().data;
  raw.evidence[0].experienceId = 'missing-exp';
  raw.assessments[0].competencyId = 'missing-comp';
  const { workspace } = prepareRestoredWorkspace(raw, account);
  assert.equal(workspace.evidence[0].experienceId, null);
  assert.equal(workspace.assessments[0].competencyId, null);
});

test('defines the 10 MB backup file limit', () => {
  assert.equal(MAX_BACKUP_FILE_SIZE, 10 * 1024 * 1024);
});
