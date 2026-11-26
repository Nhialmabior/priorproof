export const MAX_BACKUP_FILE_SIZE = 10 * 1024 * 1024;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertUniqueRecordIds(name, records) {
  const ids = new Set();
  for (const item of records) {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id.trim()) {
      throw new Error('A ' + name + ' record is missing a valid ID.');
    }
    const id = item.id.trim();
    if (ids.has(id)) throw new Error('The backup contains duplicate ' + name + ' IDs.');
    ids.add(id);
  }
}

export function parsePriorProofBackup(input) {
  let parsed;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error('The selected file is not valid JSON.');
    }
  } else {
    parsed = input;
  }

  if (!isRecord(parsed)) throw new Error('The file structure is not a valid PriorProof backup.');
  if (parsed.app && parsed.app !== 'PriorProof') throw new Error('This file is not a PriorProof backup.');
  if (parsed.app === 'PriorProof' && parsed.schemaVersion !== 1) {
    throw new Error('This backup version is not supported. Please export a fresh backup from the current version of PriorProof.');
  }

  const candidate = parsed.app === 'PriorProof' ? parsed.data : parsed;
  if (!isRecord(candidate) || !isRecord(candidate.user)
    || !Array.isArray(candidate.experiences)
    || !Array.isArray(candidate.evidence)
    || !Array.isArray(candidate.competencies)
    || (candidate.assessments !== undefined && !Array.isArray(candidate.assessments))) {
    throw new Error('The file structure is not a valid PriorProof backup.');
  }

  const assessments = Array.isArray(candidate.assessments) ? candidate.assessments : [];
  for (const [name, records] of [
    ['experience', candidate.experiences],
    ['evidence', candidate.evidence],
    ['competency', candidate.competencies],
    ['review pack', assessments]
  ]) assertUniqueRecordIds(name, records);

  return { candidate, assessments };
}

export function prepareRestoredWorkspace(input, currentUser) {
  const { candidate, assessments } = parsePriorProofBackup(input);
  const experienceIds = new Set(candidate.experiences.map(item => item.id));
  const evidenceIds = new Set(candidate.evidence.map(item => item.id));
  const competencyIds = new Set(candidate.competencies.map(item => item.id));

  const workspace = {
    ...candidate,
    user: {
      ...candidate.user,
      id: currentUser?.id,
      email: currentUser?.email || ''
    },
    experiences: candidate.experiences.map(item => ({
      ...item,
      skills: Array.isArray(item.skills) ? item.skills.filter(skill => typeof skill === 'string') : []
    })),
    evidence: candidate.evidence.map(item => ({
      ...item,
      experienceId: experienceIds.has(item.experienceId) ? item.experienceId : null,
      fileId: null,
      filePath: null,
      fileName: '',
      fileSize: 0,
      fileType: ''
    })),
    competencies: candidate.competencies.map(item => ({
      ...item,
      experienceIds: Array.isArray(item.experienceIds) ? item.experienceIds.filter(id => experienceIds.has(id)) : [],
      evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds.filter(id => evidenceIds.has(id)) : []
    })),
    assessments: assessments.map(item => ({
      ...item,
      competencyId: competencyIds.has(item.competencyId) ? item.competencyId : null,
      evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds.filter(id => evidenceIds.has(id)) : []
    }))
  };

  return {
    workspace,
    counts: {
      experiences: workspace.experiences.length,
      evidence: workspace.evidence.length,
      competencies: workspace.competencies.length,
      assessments: workspace.assessments.length
    }
  };
}
