import test from 'node:test';
import assert from 'node:assert/strict';
import {
  syncExperienceCompetencies,
  removeExperienceRelations,
  syncEvidenceCompetencyLinks,
  removeEvidenceRelations
} from '../src/utils/workspaceRelations.js';

const resolveSkill = value => {
  const key = String(value || '').trim().toLowerCase();
  const aliases = { 'teamwork': 'Teamwork', 'collaboration': 'Teamwork', 'research': 'Research' };
  const name = aliases[key] || String(value || '').trim();
  return { name, category: name === 'Research' ? 'Analytical' : 'Interpersonal' };
};

const workspace = () => ({
  user: { id: 'account-1' },
  experiences: [
    { id: 'exp-1', skills: ['Teamwork'] },
    { id: 'exp-2', skills: ['Research'] }
  ],
  evidence: [
    { id: 'ev-1', experienceId: 'exp-1', filePath: 'account-1/ev-1/report.pdf' },
    { id: 'ev-2', experienceId: 'exp-2', filePath: 'account-1/ev-2/report.pdf' },
    { id: 'ev-3', experienceId: null }
  ],
  competencies: [
    { id: 'comp-1', name: 'Teamwork', experienceIds: ['exp-1'], evidenceIds: ['ev-1'], sourceSkills: ['Teamwork'] },
    { id: 'comp-2', name: 'Research', experienceIds: ['exp-2'], evidenceIds: ['ev-2'], sourceSkills: ['Research'] },
    { id: 'comp-3', name: 'Legacy', experienceIds: [], evidenceIds: ['ev-3'], sourceSkills: [] }
  ],
  assessments: [{ id: 'pack-1', evidenceIds: ['ev-1', 'ev-2', 'ev-3'] }]
});

test('editing experience skills reuses matching competencies and refreshes provenance', () => {
  const data = workspace();
  const exp = { id: 'exp-1', skills: ['Collaboration', 'Research'] };
  data.experiences[0] = exp;
  syncExperienceCompetencies(data, exp, resolveSkill);
  const teamwork = data.competencies.find(item => item.id === 'comp-1');
  const research = data.competencies.find(item => item.id === 'comp-2');
  assert.ok(teamwork, 'A competency with a remaining evidence link should be retained');
  assert.deepEqual(teamwork.experienceIds, []);
  assert.deepEqual(teamwork.sourceSkills, []);
  assert.ok(research.experienceIds.includes('exp-1'));
  assert.deepEqual(research.sourceSkills.sort(), ['Research']);
  assert.equal(data.competencies.some(item => item.name === 'Teamwork'), true);
  assert.equal(data.competencies.find(item => item.name === 'Teamwork').experienceIds.includes('exp-1'), true);
});

test('removing experience removes its evidence and all dependent links', () => {
  const data = workspace();
  const removed = removeExperienceRelations(data, 'exp-1', resolveSkill);
  assert.deepEqual(removed.map(item => item.id), ['ev-1']);
  assert.equal(data.experiences.some(item => item.id === 'exp-1'), false);
  assert.equal(data.evidence.some(item => item.id === 'ev-1'), false);
  assert.equal(data.competencies.some(item => item.id === 'comp-1'), false);
  assert.deepEqual(data.assessments[0].evidenceIds, ['ev-2', 'ev-3']);
});

test('competencies supported by another experience survive experience removal', () => {
  const data = workspace();
  data.competencies.find(item => item.id === 'comp-2').experienceIds.push('exp-1');
  removeExperienceRelations(data, 'exp-1', resolveSkill);
  const research = data.competencies.find(item => item.id === 'comp-2');
  assert.ok(research);
  assert.deepEqual(research.experienceIds, ['exp-2']);
  assert.deepEqual(research.sourceSkills, ['Research']);
});

test('manual evidence links remain unchanged when evidence details are edited', () => {
  const data = workspace();
  const before = data.competencies.map(item => [...item.evidenceIds]);
  syncEvidenceCompetencyLinks(data, { id: 'ev-1', experienceId: 'exp-1' }, false);
  assert.deepEqual(data.competencies.map(item => item.evidenceIds), before);
});

test('changing evidence experience rebuilds only its automatic experience-based links', () => {
  const data = workspace();
  data.competencies.find(item => item.id === 'comp-1').evidenceIds.push('ev-3');
  syncEvidenceCompetencyLinks(data, { id: 'ev-1', experienceId: 'exp-2' }, true);
  assert.deepEqual(data.competencies.find(item => item.id === 'comp-1').evidenceIds, ['ev-3']);
  assert.ok(data.competencies.find(item => item.id === 'comp-2').evidenceIds.includes('ev-1'));
});

test('removing evidence cleans competency and review-pack references', () => {
  const data = workspace();
  removeEvidenceRelations(data, 'ev-1');
  assert.equal(data.evidence.some(item => item.id === 'ev-1'), false);
  assert.ok(data.competencies.find(item => item.id === 'comp-1'), 'The experience link keeps this competency record');
  assert.deepEqual(data.competencies.find(item => item.id === 'comp-1').evidenceIds, []);
  assert.deepEqual(data.assessments[0].evidenceIds, ['ev-2', 'ev-3']);
});

test('evidence-only competency remains until its final evidence link is removed', () => {
  const data = workspace();
  removeEvidenceRelations(data, 'ev-3');
  assert.equal(data.competencies.find(item => item.id === 'comp-3'), undefined, 'An evidence-only competency is removed with its final evidence link');
  removeEvidenceRelations(data, 'ev-1');
  assert.equal(data.competencies.some(item => item.id === 'comp-1'), false);
});
