function unique(values) {
  return [...new Set(values)];
}

export function syncExperienceCompetencies(workspace, experience, skillDefinition) {
  workspace.competencies.forEach(competency => {
    competency.experienceIds = (competency.experienceIds || []).filter(id => id !== experience.id);
  });

  (experience.skills || []).forEach(skill => {
    const definition = skillDefinition(skill);
    const normalizedName = String(definition.name || '').trim().toLowerCase();
    let competency = workspace.competencies.find(item =>
      String(skillDefinition(item.name).name || '').trim().toLowerCase() === normalizedName
    );

    if (!competency) {
      competency = {
        id: crypto.randomUUID(),
        name: definition.name,
        category: definition.category,
        status: 'Suggested',
        experienceIds: [],
        evidenceIds: []
      };
      workspace.competencies.push(competency);
    }

    competency.category = definition.category === 'General'
      ? (competency.category || 'General')
      : definition.category;
    competency.sourceSkills = unique([...(competency.sourceSkills || []), skill]);
    competency.experienceIds = unique([...(competency.experienceIds || []), experience.id]);
  });

  workspace.competencies.forEach(competency => {
    competency.experienceIds = (competency.experienceIds || [])
      .filter(id => workspace.experiences.some(item => item.id === id));
    competency.evidenceIds = (competency.evidenceIds || [])
      .filter(id => workspace.evidence.some(item => item.id === id));
    competency.sourceSkills = unique(workspace.experiences
      .filter(item => (competency.experienceIds || []).includes(item.id))
      .flatMap(item => item.skills || [])
      .filter(skill => skillDefinition(skill).name.toLowerCase() === skillDefinition(competency.name).name.toLowerCase()));
  });

  workspace.competencies = workspace.competencies
    .filter(item => (item.experienceIds || []).length || (item.evidenceIds || []).length);
  workspace.assessments = (workspace.assessments || []).map(pack => ({
    ...pack,
    evidenceIds: (pack.evidenceIds || []).filter(id => workspace.evidence.some(item => item.id === id))
  }));
  return workspace;
}

export function removeExperienceRelations(workspace, experienceId, skillDefinition) {
  const removedEvidence = workspace.evidence.filter(item => item.experienceId === experienceId);
  const removedEvidenceIds = new Set(removedEvidence.map(item => item.id));

  workspace.experiences = workspace.experiences.filter(item => item.id !== experienceId);
  workspace.evidence = workspace.evidence.filter(item => item.experienceId !== experienceId);

  workspace.competencies.forEach(competency => {
    competency.experienceIds = (competency.experienceIds || []).filter(id => id !== experienceId);
    competency.evidenceIds = (competency.evidenceIds || []).filter(id => !removedEvidenceIds.has(id));
    competency.sourceSkills = unique(workspace.experiences
      .filter(item => (competency.experienceIds || []).includes(item.id))
      .flatMap(item => item.skills || [])
      .filter(skill => skillDefinition(skill).name.toLowerCase() === skillDefinition(competency.name).name.toLowerCase()));
  });

  workspace.competencies = workspace.competencies
    .filter(item => (item.experienceIds || []).length || (item.evidenceIds || []).length);
  workspace.assessments = (workspace.assessments || []).map(pack => ({
    ...pack,
    evidenceIds: (pack.evidenceIds || []).filter(id => !removedEvidenceIds.has(id))
  }));

  return removedEvidence;
}

export function syncEvidenceCompetencyLinks(workspace, evidence, rebuildLinks) {
  if (!rebuildLinks) return workspace;

  workspace.competencies.forEach(competency => {
    competency.evidenceIds = (competency.evidenceIds || []).filter(id => id !== evidence.id);
    if (evidence.experienceId && (competency.experienceIds || []).includes(evidence.experienceId)) {
      competency.evidenceIds = unique([...(competency.evidenceIds || []), evidence.id]);
    }
  });
  return workspace;
}

export function removeEvidenceRelations(workspace, evidenceId) {
  workspace.evidence = workspace.evidence.filter(item => item.id !== evidenceId);
  workspace.competencies.forEach(competency => {
    competency.evidenceIds = (competency.evidenceIds || []).filter(id => id !== evidenceId);
  });
  workspace.competencies = workspace.competencies
    .filter(item => (item.experienceIds || []).length || (item.evidenceIds || []).length);
  workspace.assessments = (workspace.assessments || []).map(pack => ({
    ...pack,
    evidenceIds: (pack.evidenceIds || []).filter(id => id !== evidenceId)
  }));
  return workspace;
}
