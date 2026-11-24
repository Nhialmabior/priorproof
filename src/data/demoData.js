export const initialData = {
  user: { id: 'demo-user', fullName: 'Alex Morgan', email: 'demo@priorproof.org', targetOccupation: 'Community Development', location: 'Kakuma, Kenya' },
  experiences: [
    { id: 'exp-1', title: 'Community learning support', organisation: 'Community Learning Centre', category: 'Volunteering', startDate: '2023-02', endDate: '2024-11', description: 'Supported learners, coordinated learning activities and maintained participation records.', skills: ['Communication', 'Coordination', 'Record keeping'] }
  ],
  evidence: [
    { id: 'ev-1', title: 'Learning activities report', type: 'Project report', experienceId: 'exp-1', status: 'Uploaded' },
    { id: 'ev-2', title: 'Volunteer reference', type: 'Reference', experienceId: 'exp-1', status: 'Self-reported' }
  ],
  competencies: [
    { id: 'comp-1', name: 'Communication', category: 'Interpersonal', status: 'Suggested', evidenceIds: ['ev-2'], experienceIds: ['exp-1'] },
    { id: 'comp-2', name: 'Activity coordination', category: 'Organisational', status: 'Suggested', evidenceIds: ['ev-1'], experienceIds: ['exp-1'] }
  ],
  assessments: []
};
