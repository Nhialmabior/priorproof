import { appShell, escapeHtml } from '../components/layout.js';
import { getData, saveData, saveDataAndWait, resetData } from '../services/storage.js';
import { updateAccountPassword } from '../services/supabase.js';
import { navigate } from '../utils/router.js';
import { saveEvidenceFile, getEvidenceFile, deleteEvidenceFile, clearEvidenceFiles } from '../services/evidenceFiles.js';
import { updateAccountProfile } from '../services/supabase.js';

const stat=(label,value,sub,icon)=>`<article class="stat-card"><div class="stat-top"><span>${label}</span><i>${icon}</i></div><strong>${value}</strong><small>${sub}</small></article>`;
const heading=(eyebrow,title,desc,action='')=>`<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;
const btn=(label,id)=>`<button class="btn btn-primary" id="${id}">${label} <span>+</span></button>`;
const evidenceStatusLabel = () => 'Not independently verified';
const skillCatalog={
 // Interpersonal and communication
 communication:{name:'Communication',category:'Interpersonal'},
 'verbal communication':{name:'Communication',category:'Interpersonal'},
 'written communication':{name:'Communication',category:'Interpersonal'},
 'active listening':{name:'Active listening',category:'Interpersonal'},
 listening:{name:'Active listening',category:'Interpersonal'},
 teamwork:{name:'Teamwork',category:'Interpersonal'},
 collaboration:{name:'Teamwork',category:'Interpersonal'},
 'working with others':{name:'Teamwork',category:'Interpersonal'},
 'conflict resolution':{name:'Conflict resolution',category:'Interpersonal'},
 negotiation:{name:'Negotiation',category:'Interpersonal'},
 networking:{name:'Networking',category:'Interpersonal'},
 empathy:{name:'Empathy',category:'Interpersonal'},
 'cross cultural communication':{name:'Cross-cultural communication',category:'Interpersonal'},
 // Leadership and community engagement
 leadership:{name:'Leadership',category:'Leadership'},
 'team leadership':{name:'Team leadership',category:'Leadership'},
 mentoring:{name:'Mentoring',category:'Leadership'},
 coaching:{name:'Coaching',category:'Leadership'},
 advocacy:{name:'Advocacy',category:'Community engagement'},
 'community engagement':{name:'Community engagement',category:'Community engagement'},
 'community mobilisation':{name:'Community mobilisation',category:'Community engagement'},
 'community mobilization':{name:'Community mobilisation',category:'Community engagement'},
 'stakeholder engagement':{name:'Stakeholder engagement',category:'Community engagement'},
 'stakeholder coordination':{name:'Stakeholder engagement',category:'Community engagement'},
 // Planning and project delivery
 coordination:{name:'Activity coordination',category:'Organisational'},
 'activity coordination':{name:'Activity coordination',category:'Organisational'},
 'project coordination':{name:'Project coordination',category:'Organisational'},
 planning:{name:'Planning',category:'Organisational'},
 'work planning':{name:'Planning',category:'Organisational'},
 'strategic planning':{name:'Strategic planning',category:'Organisational'},
 organisation:{name:'Organisation',category:'Organisational'},
 organization:{name:'Organisation',category:'Organisational'},
 'time management':{name:'Time management',category:'Organisational'},
 'project management':{name:'Project management',category:'Organisational'},
 'event management':{name:'Event coordination',category:'Organisational'},
 'event coordination':{name:'Event coordination',category:'Organisational'},
 logistics:{name:'Logistics',category:'Organisational'},
 'problem solving':{name:'Problem solving',category:'Analytical'},
 'decision making':{name:'Decision-making',category:'Analytical'},
 adaptability:{name:'Adaptability',category:'Personal effectiveness'},
 'critical thinking':{name:'Critical thinking',category:'Analytical'},
 // Administration, finance and reporting
 'record keeping':{name:'Records management',category:'Administrative'},
 'records management':{name:'Records management',category:'Administrative'},
 documentation:{name:'Documentation',category:'Administrative'},
 administration:{name:'Administration',category:'Administrative'},
 'data entry':{name:'Data entry',category:'Digital and analytical'},
 filing:{name:'Records management',category:'Administrative'},
 budgeting:{name:'Budgeting',category:'Financial'},
 'financial management':{name:'Financial management',category:'Financial'},
 procurement:{name:'Procurement',category:'Administrative'},
 reporting:{name:'Reporting',category:'Communication'},
 'report writing':{name:'Report writing',category:'Communication'},
 'proposal writing':{name:'Proposal writing',category:'Communication'},
 // Research, monitoring and data
 research:{name:'Research',category:'Analytical'},
 'data collection':{name:'Data collection',category:'Research and data'},
 'field data collection':{name:'Data collection',category:'Research and data'},
 'quantitative research':{name:'Quantitative research',category:'Research and data'},
 'qualitative research':{name:'Qualitative research',category:'Research and data'},
 'data analysis':{name:'Data analysis',category:'Digital and analytical'},
 'data management':{name:'Data management',category:'Research and data'},
 'monitoring and evaluation':{name:'Monitoring and evaluation',category:'Programme support'},
 'monitoring evaluation':{name:'Monitoring and evaluation',category:'Programme support'},
 'needs assessment':{name:'Needs assessment',category:'Programme support'},
 'survey design':{name:'Survey design',category:'Research and data'},
 'questionnaire design':{name:'Survey design',category:'Research and data'},
 // Learning, training and facilitation
 teaching:{name:'Teaching and learning support',category:'Learning and development'},
 'classroom management':{name:'Classroom management',category:'Learning and development'},
 facilitation:{name:'Facilitation',category:'Learning and development'},
 training:{name:'Training delivery',category:'Learning and development'},
 'training delivery':{name:'Training delivery',category:'Learning and development'},
 'curriculum development':{name:'Curriculum development',category:'Learning and development'},
 'lesson planning':{name:'Lesson planning',category:'Learning and development'},
 'learning support':{name:'Learning support',category:'Learning and development'},
 // Digital skills
 'digital literacy':{name:'Digital literacy',category:'Digital'},
 'computer literacy':{name:'Digital literacy',category:'Digital'},
 'computer skills':{name:'Digital literacy',category:'Digital'},
 'microsoft office':{name:'Productivity software',category:'Digital'},
 'spreadsheet skills':{name:'Spreadsheet skills',category:'Digital'},
 excel:{name:'Spreadsheet skills',category:'Digital'},
 'web development':{name:'Web development',category:'Digital'},
 'graphic design':{name:'Graphic design',category:'Digital'},
 'social media management':{name:'Social media management',category:'Digital'},
 // Programme and humanitarian support
 'case management':{name:'Case management',category:'Programme support'},
 'project implementation':{name:'Project implementation',category:'Programme support'},
 'community outreach':{name:'Community outreach',category:'Community engagement'},
 'psychosocial support':{name:'Psychosocial support',category:'Programme support'},
 'safeguarding awareness':{name:'Safeguarding awareness',category:'Programme support'},
 'referral coordination':{name:'Referral coordination',category:'Programme support'},
 // Agriculture, environment and livelihoods
 agriculture:{name:'Agricultural production',category:'Agriculture and environment'},
 farming:{name:'Agricultural production',category:'Agriculture and environment'},
 'crop production':{name:'Crop production',category:'Agriculture and environment'},
 'crop management':{name:'Crop production',category:'Agriculture and environment'},
 'livestock management':{name:'Livestock management',category:'Agriculture and environment'},
 'animal husbandry':{name:'Livestock management',category:'Agriculture and environment'},
 irrigation:{name:'Irrigation management',category:'Agriculture and environment'},
 'soil conservation':{name:'Soil conservation',category:'Agriculture and environment'},
 'natural resource management':{name:'Natural resource management',category:'Agriculture and environment'},
 'climate adaptation':{name:'Climate adaptation',category:'Agriculture and environment'},
 'environmental awareness':{name:'Environmental awareness',category:'Agriculture and environment'},
 'food security':{name:'Food security',category:'Livelihoods and development'},
 livelihoods:{name:'Livelihoods support',category:'Livelihoods and development'},
 'livelihood support':{name:'Livelihoods support',category:'Livelihoods and development'},
 entrepreneurship:{name:'Entrepreneurship',category:'Business and enterprise'},
 'business development':{name:'Business development',category:'Business and enterprise'},
 'business planning':{name:'Business planning',category:'Business and enterprise'},
 'customer service':{name:'Customer service',category:'Business and enterprise'},
 sales:{name:'Sales',category:'Business and enterprise'},
 marketing:{name:'Marketing',category:'Business and enterprise'},
 // Humanitarian, protection and community services
 'humanitarian response':{name:'Humanitarian response',category:'Programme support'},
 'emergency response':{name:'Emergency response',category:'Programme support'},
 'protection monitoring':{name:'Protection monitoring',category:'Protection and inclusion'},
 'community based protection':{name:'Community-based protection',category:'Protection and inclusion'},
 'child protection':{name:'Child protection awareness',category:'Protection and inclusion'},
 'gender based violence awareness':{name:'Gender-based violence awareness',category:'Protection and inclusion'},
 inclusion:{name:'Inclusive programming',category:'Protection and inclusion'},
 'disability inclusion':{name:'Disability inclusion',category:'Protection and inclusion'},
 'peacebuilding':{name:'Peacebuilding',category:'Peace and social cohesion'},
 mediation:{name:'Mediation',category:'Peace and social cohesion'},
 'conflict sensitivity':{name:'Conflict sensitivity',category:'Peace and social cohesion'},
 'social cohesion':{name:'Social cohesion',category:'Peace and social cohesion'},
 // Programme quality and project cycle
 'project design':{name:'Project design',category:'Programme management'},
 'project planning':{name:'Project planning',category:'Programme management'},
 'project monitoring':{name:'Project monitoring',category:'Programme management'},
 'programme management':{name:'Programme management',category:'Programme management'},
 'program management':{name:'Programme management',category:'Programme management'},
 'results based management':{name:'Results-based management',category:'Programme management'},
 'needs analysis':{name:'Needs assessment',category:'Programme support'},
 'baseline survey':{name:'Baseline data collection',category:'Research and data'},
 'endline survey':{name:'Endline data collection',category:'Research and data'},
 'data quality assurance':{name:'Data quality assurance',category:'Research and data'},
 'data cleaning':{name:'Data cleaning',category:'Research and data'},
 'microsoft excel':{name:'Spreadsheet skills',category:'Digital'},
 'google sheets':{name:'Spreadsheet skills',category:'Digital'},
 'presentation skills':{name:'Presentation',category:'Communication'},
 'public speaking':{name:'Public speaking',category:'Communication'},
 'content creation':{name:'Content creation',category:'Digital'},
 'website development':{name:'Web development',category:'Digital'},
 'database management':{name:'Database management',category:'Digital'},
 'computer programming':{name:'Programming',category:'Digital'},
 programming:{name:'Programming',category:'Digital'},
 'technical support':{name:'Technical support',category:'Digital'},
 // Practical operations and workplace skills
 'occupational health and safety':{name:'Workplace health and safety awareness',category:'Workplace practice'},
 'health and safety':{name:'Workplace health and safety awareness',category:'Workplace practice'},
 'quality assurance':{name:'Quality assurance',category:'Workplace practice'},
 'inventory management':{name:'Inventory management',category:'Operations'},
 'stock management':{name:'Inventory management',category:'Operations'},
 'supply chain management':{name:'Supply chain management',category:'Operations'},
 'warehouse management':{name:'Warehouse operations',category:'Operations'},
 'customer relations':{name:'Customer service',category:'Business and enterprise'},
 'first aid awareness':{name:'First aid awareness',category:'Workplace practice'}
};
const normalizeSkill=value=>String(value||'').normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9+#. ]/g,' ').replace(/\s+/g,' ').trim();
const skillDefinition=value=>{
 const key=normalizeSkill(value),definition=skillCatalog[key];
 if(!definition)return {key,name:String(value||'').trim(),category:'General',matchType:'Uncatalogued phrase'};
 return {...definition,key,matchType:key===normalizeSkill(definition.name)?'Direct catalogue match':'Known alias'};
};

export function dashboardPage(){
 const d=getData();
 const content=`${heading('YOUR WORKSPACE',`Welcome back, ${escapeHtml((d.user.fullName||'there').split(' ')[0])}.`,'Here is a snapshot of your recognition journey.',btn('Add experience','addExperience'))}
 <div class="stats-grid">${stat('Experience records',d.experiences.length,'Your learning and work history','▤')}${stat('Evidence items',d.evidence.length,'Supporting materials saved','▧')}${stat('Competency suggestions',d.competencies.length,'Potential skills identified','◇')}</div>
 <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Getting started</h2><p>Complete these steps to document your skills.</p></div><span class="pill">${[d.experiences.length>0,d.evidence.length>0].filter(Boolean).length} of 2 started</span></div><a class="journey-row" href="/app/experience" data-link><span class="journey-number ${d.experiences.length?'done':''}">2</span><div><b>Document experience</b><small>Work, volunteering, learning or community activities</small></div><span class="complete">${d.experiences.length?d.experiences.length+' added':'Add first'}</span></a><a class="journey-row" href="/app/evidence" data-link><span class="journey-number ${d.evidence.length?'done':''}">3</span><div><b>Organise supporting evidence</b><small>Connect documents, work samples or references</small></div><span class="complete">${d.evidence.length?d.evidence.length+' added':'Add first'}</span></a><a class="journey-row" href="/app/portfolio" data-link><span class="journey-number ${d.experiences.length||d.evidence.length?'done':''}">4</span><div><b>Preview your portfolio</b><small>Review and print your current profile</small></div><span class="complete">Preview →</span></a></section>
 <section class="panel"><div class="panel-head"><div><h2>Quick actions</h2><p>Continue building your profile.</p></div></div><button class="quick-action" id="addExperience"><span>＋</span><div><b>Add experience</b><small>Record work, learning or volunteering</small></div><i>→</i></button><button class="quick-action" id="addEvidence"><span>↥</span><div><b>Add evidence record</b><small>Connect a document or work sample</small></div><i>→</i></button><a class="quick-action" href="/app/competencies" data-link><span>◇</span><div><b>Explore competencies</b><small>Review potential skills</small></div><i>→</i></a><a class="quick-action" href="/app/portfolio" data-link><span>▣</span><div><b>View my portfolio</b><small>Preview your information</small></div><i>→</i></a></section></div>
 <section class="panel recent-panel"><div class="panel-head"><div><h2>Recent experience</h2><p>Your latest records.</p></div><a href="/app/experience" data-link>View all →</a></div>${d.experiences.length?d.experiences.slice(0,3).map(e=>`<div class="record-row"><div class="record-icon">▤</div><div><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.organisation||e.category)} · ${escapeHtml(e.startDate||'Date not provided')}</small></div><span class="pill">${escapeHtml(e.category)}</span></div>`).join(''):'<div class="empty-state">No experience records yet. Add your first experience to begin.</div>'}</section>`;
 return appShell(content,'/app/dashboard',d.user);
}
function simplePage(title,desc,body,active,action=''){const d=getData();return appShell(`${heading('YOUR WORKSPACE',title,desc,action)}${body}`,active,d.user);}
export function profilePage(){const d=getData();return simplePage('My profile','Manage the information shown in your account menu and portfolio.',`<section class="panel form-panel"><form id="profileForm" class="form-grid"><div class="form-full profile-photo-field"><div class="profile-photo-preview" id="profilePhotoPreview">${d.user.profilePhoto?`<img src="${escapeHtml(d.user.profilePhoto)}" alt="Current profile photo">`:escapeHtml((d.user.fullName||'A').slice(0,1).toUpperCase())}</div><div><b>Profile picture</b><p class="helper-text">Choose a JPG, PNG or WebP image (maximum 1 MB).</p><input type="file" id="profilePhotoFile" accept="image/jpeg,image/png,image/webp"><input type="hidden" name="profilePhoto" id="profilePhotoValue" value="${escapeHtml(d.user.profilePhoto||'')}"><button type="button" class="btn btn-outline btn-small" id="removeProfilePhoto">Remove photo</button></div></div><label>Full name<input name="fullName" value="${escapeHtml(d.user.fullName||'')}" maxlength="100" required></label><label>Email address<input type="email" name="email" value="${escapeHtml(d.user.email||'')}" maxlength="160" required></label><label>Phone number<input type="tel" name="phoneNumber" value="${escapeHtml(d.user.phoneNumber||'')}" maxlength="30" placeholder="Include country code, e.g. +254..."></label><label>Target occupation or field<input name="targetOccupation" value="${escapeHtml(d.user.targetOccupation||'')}" maxlength="120" placeholder="e.g. Community development"></label><label>Location<input name="location" value="${escapeHtml(d.user.location||'')}" maxlength="120" placeholder="City, country or region"></label><label class="form-full">Professional summary<textarea name="summary" maxlength="700" rows="4" placeholder="Briefly describe your background, strengths and experience.">${escapeHtml(d.user.summary||'')}</textarea></label><label class="form-full">Areas of interest<input name="interests" value="${escapeHtml(d.user.interests||'')}" maxlength="240" placeholder="e.g. Project coordination, data analysis, digital skills"></label><div class="form-full"><p class="helper-text">Your profile is linked to your signed-in account. Avoid adding sensitive personal information that is not needed for your portfolio.</p><button class="btn btn-primary">Save profile</button></div></form></section>`,'/app/profile');}
export function experiencePage(){const d=getData();return simplePage('My experience','Capture the places where you have learned, contributed and developed skills.',`<section class="panel"><div class="panel-head"><div><h2>Experience timeline</h2><p>${d.experiences.length} record(s)</p></div>${btn('Add experience','addExperience')}</div>${d.experiences.length?d.experiences.map(e=>`<article class="experience-item"><div class="timeline-dot"></div><div><div class="row-between"><h3>${escapeHtml(e.title)}</h3><span class="pill">${escapeHtml(e.category)}</span></div><p class="muted">${escapeHtml(e.organisation)} · ${escapeHtml(e.startDate)} – ${escapeHtml(e.endDate||'Present')}</p><p>${escapeHtml(e.description)}</p>${e.contribution?'<p><b>Contribution:</b> '+escapeHtml(e.contribution)+'</p>':''}${e.outcome?'<p><b>Outcome / impact:</b> '+escapeHtml(e.outcome)+'</p>':''}${e.learning?'<p><b>Learning reflection:</b> '+escapeHtml(e.learning)+'</p>':''}<small><b>Skills:</b> ${escapeHtml((e.skills||[]).join(', ')||'Not listed')}</small><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-outline btn-small" data-edit-experience="${escapeHtml(e.id)}">Edit record</button><button class="btn btn-outline btn-small" data-delete-experience="${escapeHtml(e.id)}">Remove record</button></div></div></article>`).join(''):'<div class="empty-state">No experience added yet.</div>'}</section>`,'/app/experience');}
export function evidencePage(){
 const d=getData();
 const types=[...new Set(d.evidence.map(e=>e.type).filter(Boolean))].sort();
 const sizeLabel=n=>{if(!n)return '';return n<1024? n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';};
 const records=d.evidence.map(e=>{
  const exp=d.experiences.find(x=>x.id===e.experienceId);
  const linked=d.competencies.filter(c=>(c.evidenceIds||[]).includes(e.id));
  const status=evidenceStatusLabel(e);
  return `<article class="panel evidence-card" data-evidence-card data-evidence-type="${escapeHtml(String(e.type||'').toLowerCase())}" data-evidence-status="${escapeHtml(String(status).toLowerCase())}">
   <div class="evidence-card-head"><div class="evidence-card-title"><span class="record-icon">▧</span><div><h3>${escapeHtml(e.title)}</h3><small>${escapeHtml(e.type||'Supporting material')}</small></div></div><span class="pill">${escapeHtml(status)}</span></div>
   ${e.description?`<p class="evidence-description">${escapeHtml(e.description)}</p>`:''}
   <dl class="evidence-metadata">
    <div><dt>Related experience</dt><dd>${escapeHtml(exp?.title||'Not linked')}</dd></div>
    <div><dt>Source / issuer</dt><dd>${escapeHtml(e.source||'Not provided')}</dd></div>
    <div><dt>Date recorded</dt><dd>${escapeHtml(e.evidenceDate||'Not provided')}</dd></div>
    <div><dt>Attachment</dt><dd>${e.fileName?escapeHtml(e.fileName)+(e.fileSize?' · '+sizeLabel(e.fileSize):''):'No file attached'}</dd></div>
   </dl>
   <div class="evidence-linked-skills"><b>Linked competencies</b><div>${linked.length?linked.map(c=>`<span>${escapeHtml(c.name)}</span>`).join(''):'<small>No competencies linked yet</small>'}</div></div>
   <div class="evidence-card-actions">${e.fileName?`<button class="btn btn-outline btn-small" data-download-evidence="${escapeHtml(e.id)}">Download attachment</button>`:''}<button class="btn btn-outline btn-small" data-edit-evidence="${escapeHtml(e.id)}">Edit record</button><button class="btn btn-outline btn-small" data-delete-evidence="${escapeHtml(e.id)}">Remove record</button></div>
  </article>`;
 }).join('');
 const content=`<section class="evidence-summary-grid">
  <div><strong>${d.evidence.length}</strong><span>Total evidence records</span></div>
  <div><strong>${d.evidence.filter(e=>e.fileName).length}</strong><span>With file attachments</span></div>
  <div><strong>${d.evidence.length}</strong><span>Not independently verified</span></div>
 </section>
 <section class="panel evidence-repository-panel">
  <div class="panel-head"><div><h2>Evidence repository</h2><p id="evidenceResultCount" aria-live="polite">${d.evidence.length} record(s)</p></div>${btn('Add evidence','addEvidence')}</div>
  ${d.evidence.length?`<div class="evidence-filters">
   <label>Search records<input type="search" id="evidenceSearch" placeholder="Search title, source, description..."></label>
   <label>Evidence type<select id="evidenceTypeFilter"><option value="">All types</option>${types.map(t=>`<option value="${escapeHtml(t.toLowerCase())}">${escapeHtml(t)}</option>`).join('')}</select></label>
   <label>Record status<select id="evidenceStatusFilter"><option value="">All records</option><option value="not independently verified">Not independently verified</option></select></label>
  </div><div class="evidence-card-list">${records}</div><p id="evidenceNoResults" class="empty-state" hidden>No records match these filters. Try changing your search or filters.</p>`:'<div class="empty-state">No evidence records yet. Add your first supporting item to begin.</div>'}
  <p class="helper-text">Attachments are stored in private account storage (up to 5 MB each). They are not independently verified. Keep your original documents in a safe location.</p>
 </section>`;
 return simplePage('My evidence','Organise, search and review the materials that support your experience and competency claims.',content,'/app/evidence');
}
export function competenciesPage(){
 const d=getData();
 const body=`<div class="notice"><b>How suggestions are generated:</b> PriorProof checks the skill phrases you enter against a curated catalogue of skill names and known aliases. Direct matches and recognised aliases are grouped under a consistent label. Phrases not in the catalogue are kept as you entered them in the General category. Matching uses the skill field only; it does not infer skills from descriptions, inspect evidence files or assess proficiency. Each suggestion shows its source experience and original phrase. This is a rule-based documentation aid, not an AI assessment, formal competency standard or verification of competence. Review every suggestion for accuracy.</div>
 <div class="competency-grid">${d.competencies.map(c=>{
  const linked=(c.evidenceIds||[]).map(id=>d.evidence.find(e=>e.id===id)).filter(Boolean);
  const experience=(c.experienceIds||[]).map(id=>d.experiences.find(e=>e.id===id)).filter(Boolean);
  const reasons=experience.flatMap(e=>(e.skills||[]).filter(skill=>skillDefinition(skill).name.toLowerCase()===c.name.toLowerCase()).map(skill=>({skill,experience:e.title,matchType:skillDefinition(skill).matchType})));
  const options=d.evidence.filter(e=>!linked.some(item=>item.id===e.id));
  return `<article class="panel competency-card competency-map-card">
   <span class="eyebrow">${escapeHtml(c.category||'General')}</span><h3>${escapeHtml(c.name)}</h3>
   <p>${experience.length} linked experience(s) · ${linked.length} supporting evidence item(s)</p>
   <span class="pill">${escapeHtml(c.status||'Suggested')}</span>
   <div class="mapping-block"><b>Why this was suggested</b>${reasons.length?reasons.map(reason=>`<small>You listed “${escapeHtml(reason.skill)}” in “${escapeHtml(reason.experience)}” · ${escapeHtml(reason.matchType)}.</small>`).join(''):'<small>This is an existing competency record. Edit a linked experience and include the relevant skill to show its source here.</small>'}</div>
   <div class="mapping-block"><b>Linked experience</b>${experience.length?experience.map(e=>`<small>${escapeHtml(e.title)}${e.contribution?' — '+escapeHtml(e.contribution):''}</small>`).join(''):'<small>No experience linked.</small>'}</div>
   <div class="mapping-block"><b>Supporting evidence</b>${linked.length?linked.map(item=>`<div class="mapping-evidence"><span>${escapeHtml(item.title)} <small>· ${escapeHtml(evidenceStatusLabel(item))}</small></span><button type="button" class="btn btn-outline btn-small" data-unlink-evidence="${escapeHtml(c.id)}" data-evidence-id="${escapeHtml(item.id)}">Unlink</button></div>`).join(''):'<small>No evidence linked yet.</small>'}</div>
   ${options.length?`<form class="mapping-form" data-map-form="${escapeHtml(c.id)}"><label for="map-${escapeHtml(c.id)}">Add supporting evidence</label><select id="map-${escapeHtml(c.id)}" name="evidenceId" required><option value="">Choose an evidence item</option>${options.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('')}</select><button class="btn btn-primary btn-small" type="submit">Link evidence</button></form>`:'<p class="helper-text">No unlinked evidence items available.</p>'}
  </article>`;
 }).join('')||'<div class="empty-state">No competency suggestions yet. Add experience with skills to begin.</div>'}</div>`;
 return simplePage('Competencies','Explore skills suggested from your own experience records, understand their source and manage supporting evidence.',body,'/app/competencies');
}
export function gapPage(){
 const d=getData();
 const rows=d.competencies.map(c=>{
  const items=(c.evidenceIds||[]).map(id=>d.evidence.find(e=>e.id===id)).filter(Boolean);
  const experienceIds=new Set(c.experienceIds||[]);
  const unrelated=items.filter(e=>e.experienceId&&!experienceIds.has(e.experienceId));
  const withFiles=items.filter(e=>Boolean(e.fileName)).length;
  return {competency:c,items,unrelated,withFiles};
 });
 const total=rows.length,withEvidence=rows.filter(r=>r.items.length).length,missing=total-withEvidence;
  const relevanceChecks=rows.filter(r=>r.unrelated.length).length;
  const pct=total?Math.round(withEvidence/total*100):0;
  const cards=rows.map(({competency:c,items,unrelated,withFiles})=>{
   let recommendation='';
   if(!items.length) recommendation='Consider adding a relevant work sample, activity record, training output or reference. This is a documentation prompt, not an indication that you lack the skill.';
   else if(unrelated.length) recommendation='Review whether the linked evidence genuinely relates to this competency. Evidence connected to another experience may still be relevant, but the relationship should be clear.';
   else recommendation='Check that each item is relevant, current and appropriate to support the experience you have recorded. Keep original documents and seek an authorised review where required.';
   return `<article class="panel gap-card">
   <div class="gap-card-head"><div><span class="eyebrow">${escapeHtml(c.category||'General')}</span><h3>${escapeHtml(c.name)}</h3></div><span class="pill ${items.length?'':'pending'}">${items.length?'Evidence linked':'No evidence linked'}</span></div>
   <div class="gap-metrics"><span><b>${items.length}</b> linked item(s)</span><span><b>${withFiles}</b> with file attached</span><span><b>${unrelated.length}</b> relevance check(s)</span></div>
   <div class="gap-evidence-list"><b>Evidence register</b>
    ${items.length?items.map(e=>`<div class="gap-evidence-row"><div><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.type||'Supporting material')}${e.fileName?' · File attached':''}</small></div><span class="pill">${escapeHtml(evidenceStatusLabel(e))}</span></div>`).join(''):'<p class="muted">No evidence is currently linked to this competency.</p>'}
   </div>
   ${unrelated.length?'<p class="gap-caution">Check relevance: '+unrelated.length+' linked item(s) are associated with a different experience record. They may still be relevant, but review the connection.</p>':''}
   <div class="gap-recommendation"><b>Suggested action</b><p>${recommendation}</p></div>
  </article>`;
 }).join('');
 const content=`<section class="panel gap-overview">
  <div class="gap-overview-top"><div><h2>Evidence coverage</h2><p class="muted">Based on evidence links in this workspace, not a formal skills assessment.</p></div><span class="gap-percent">${pct}%</span></div>
  <div class="coverage-number">${withEvidence}<span> / ${total}</span></div><p>Competencies with at least one linked evidence item</p>
  <div class="progress"><i style="width:${pct}%"></i></div>
  <div class="gap-summary-grid">
   <div><strong>${missing}</strong><span>No linked evidence</span></div>
   <div><strong>${withEvidence}</strong><span>With linked evidence</span></div>
   <div><strong>${relevanceChecks}</strong><span>Need a relevance check</span></div>
  </div>
  <p class="gap-disclaimer"><b>How to read this:</b> These figures describe the records and links in your workspace only. They do not measure your ability or indicate that you lack a competency. A file attachment or user-selected link does not establish authenticity, competence or independent verification. Any status label shown on an evidence record is not authenticated by PriorProof.</p>
 </section>
 <div class="gap-section-heading"><div><h2>Competency-by-competency review</h2><p>Use these suggestions to decide what to strengthen next.</p></div><a href="/app/competencies" data-link>Manage evidence links →</a></div>
 <div class="gap-card-list">${cards||'<section class="panel empty-state"><h3>No competency suggestions yet</h3><p>Add experience records and list the skills you developed. PriorProof will create preliminary suggestions for you to review.</p><a class="btn btn-primary" href="/app/experience" data-link>Go to experience</a></section>'}</div>`;
 return simplePage('Gap analysis','Review documentation coverage, check evidence relevance and identify where supporting material may be useful.',content,'/app/gap-analysis');
}
export function portfolioPage(){
 const d=getData();
 const safeDate=value=>value?escapeHtml(value):'Not provided';
 const evidenceFor=experienceId=>d.evidence.filter(e=>e.experienceId===experienceId);
 const reportedSkills=[...new Set(d.experiences.flatMap(e=>e.skills||[]).map(s=>String(s).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const portfolioChecks=[
  {label:'Profile name',detail:d.user.fullName?'Your name is included.':'Add your name to identify the portfolio.',done:Boolean(d.user.fullName),href:'/app/profile',action:'Edit profile'},
  {label:'Target occupation or field',detail:d.user.targetOccupation?'Your intended field is included.':'Add the role or field this portfolio relates to.',done:Boolean(d.user.targetOccupation),href:'/app/profile',action:'Edit profile'},
  {label:'Professional summary',detail:d.user.summary?'A profile summary is included.':'Add a short, factual summary of your background and goals.',done:Boolean(d.user.summary),href:'/app/profile',action:'Edit profile'},
  {label:'Experience records',detail:d.experiences.length?d.experiences.length+' experience record(s) are included.':'Add work, volunteering, learning or community experience.',done:d.experiences.length>0,href:'/app/experience',action:'Add experience'},
  {label:'Experience detail',detail:d.experiences.some(e=>e.contribution||e.outcome||e.learning)?'At least one record explains a contribution, outcome or learning.':'Add your contribution, an outcome or what you learned to strengthen the context.',done:d.experiences.some(e=>e.contribution||e.outcome||e.learning),href:'/app/experience',action:'Review experience'},
  {label:'Skills listed',detail:reportedSkills.length?reportedSkills.length+' skill(s) are listed from your experience records.':'Add relevant skills to your experience records.',done:reportedSkills.length>0,href:'/app/experience',action:'Add skills'},
  {label:'Evidence records',detail:d.evidence.length?d.evidence.length+' evidence record(s) are included.':'Add records describing documents, work samples, references or other supporting material.',done:d.evidence.length>0,href:'/app/evidence',action:'Add evidence'},
  {label:'Evidence linked to experience',detail:d.evidence.some(e=>e.experienceId)?'At least one evidence item is connected to an experience.':'Link relevant evidence to the experience it supports, where appropriate.',done:d.evidence.some(e=>e.experienceId),href:'/app/evidence',action:'Review evidence'}
 ];
 const completedChecks=portfolioChecks.filter(item=>item.done).length;
 const readinessPanel=`<section class="panel portfolio-readiness no-print">
  <div class="portfolio-readiness-head"><div><span class="eyebrow">BEFORE YOU SHARE</span><h2>Portfolio quality review</h2><p>Check that your portfolio gives readers enough context. This is a completeness guide, not a score of your ability or a formal assessment.</p></div><span class="portfolio-readiness-count">${completedChecks}/${portfolioChecks.length}</span></div>
  <div class="portfolio-readiness-track" role="progressbar" aria-label="Portfolio completeness checks" aria-valuemin="0" aria-valuemax="${portfolioChecks.length}" aria-valuenow="${completedChecks}"><span style="width:${Math.round(completedChecks/portfolioChecks.length*100)}%"></span></div>
  <ul class="portfolio-check-list">${portfolioChecks.map(item=>`<li class="${item.done?'is-complete':'is-pending'}"><span class="portfolio-check-icon" aria-hidden="true">${item.done?'✓':'○'}</span><div><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.detail)}</small></div><a href="${item.href}" data-link>${item.action}</a></li>`).join('')}</ul>
  <p class="portfolio-readiness-note">You can still print your portfolio at any time. Only include accurate information, and make sure you have permission to share any personal or third-party information in supporting evidence.</p>
 </section>`;
 const content=`<section class="portfolio-sheet">
  <div class="portfolio-top"><img src="/logo.svg" alt="PriorProof"><span class="pill">PERSONAL SKILLS PORTFOLIO</span></div>
  <header class="portfolio-profile">
   <span class="eyebrow">EXPERIENCE & EVIDENCE PROFILE</span>
   <h2>${escapeHtml(d.user.fullName||'Your name')}</h2>
   <p class="portfolio-role">${escapeHtml(d.user.targetOccupation||'Professional profile')}</p>
   ${d.user.summary?`<p class="portfolio-summary">${escapeHtml(d.user.summary)}</p>`:'' }
   ${d.user.interests?`<p class="portfolio-interests"><b>Areas of interest:</b> ${escapeHtml(d.user.interests)}</p>`:'' }
   <div class="portfolio-contact">${d.user.email?`<span>${escapeHtml(d.user.email)}</span>`:''}${d.user.phoneNumber?`<span>${escapeHtml(d.user.phoneNumber)}</span>`:''}${d.user.location?`<span>${escapeHtml(d.user.location)}</span>`:''}</div>
  </header>
  <section class="portfolio-snapshot" aria-label="Portfolio summary">
   <div><strong>${d.experiences.length}</strong><span>Experience records</span></div>
   <div><strong>${d.evidence.length}</strong><span>Evidence items</span></div>
   <div><strong>${reportedSkills.length}</strong><span>Skills reported</span></div>
   <div><strong>${d.competencies.length}</strong><span>Potential competencies</span></div>
  </section>
  <div class="portfolio-disclaimer"><b>About this portfolio</b><p>This document organises information supplied by the individual. It is not an accredited qualification, formal competency assessment or independent verification of claims.</p></div>
  <section class="portfolio-section"><h3>01 · Profile overview</h3><p>This portfolio presents a record of learning, work, volunteering and other experiences, alongside the supporting evidence listed by the individual. It may be used to support conversations with employers, training providers or authorised recognition bodies.</p></section>
  <section class="portfolio-section"><h3>02 · Experience history <span class="section-count">${d.experiences.length} record(s)</span></h3>
   ${d.experiences.length?d.experiences.map((e,i)=>`<article class="portfolio-entry">
    <div class="portfolio-entry-heading"><div><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.organisation||'Independent experience')}</small></div><span class="pill">${escapeHtml(e.category||'Experience')}</span></div>
    <p class="portfolio-dates">${safeDate(e.startDate)} – ${safeDate(e.endDate||'Present')}</p>
    <p>${escapeHtml(e.description||'No description provided.')}</p>
    ${e.contribution?'<p><b>Contribution:</b> '+escapeHtml(e.contribution)+'</p>':''}
    ${e.outcome?'<p><b>Outcome / impact:</b> '+escapeHtml(e.outcome)+'</p>':''}
    ${e.learning?'<p><b>Learning reflection:</b> '+escapeHtml(e.learning)+'</p>':''}
    <div class="portfolio-skills"><b>Skills reported:</b> ${escapeHtml((e.skills||[]).join(', ')||'Not listed')}</div>
    <div class="portfolio-evidence"><b>Linked evidence (${evidenceFor(e.id).length})</b>
    ${evidenceFor(e.id).length?evidenceFor(e.id).map(item=>`<div class="portfolio-evidence-item"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.type)} · ${escapeHtml(evidenceStatusLabel(item))}${item.fileName?' · File attached: '+escapeHtml(item.fileName):' · Description only'}</small></div>`).join(''):'<p>No evidence linked to this experience.</p>'}
    </div>
   </article>`).join(''):'<p>No experience records have been added.</p>'}
  </section>
  <section class="portfolio-section"><h3>03 · Skills reported <span class="section-count">${reportedSkills.length} skill(s)</span></h3>
   <p class="helper-text">These skills were entered by the individual in their experience records. Listing them does not establish proficiency or independent verification.</p>
   ${reportedSkills.length?'<div class="portfolio-skill-list">'+reportedSkills.map(skill=>'<span>'+escapeHtml(skill)+'</span>').join('')+'</div>':'<p>No skills have been listed in experience records.</p>'}
  </section>
  <section class="portfolio-section"><h3>04 · Potential competencies <span class="section-count">${d.competencies.length} suggestion(s)</span></h3>
   <p class="helper-text">Competencies below are suggested from recorded experience. They have not been formally assessed or verified by PriorProof.</p>
   ${d.competencies.length?`<div class="portfolio-competency-list">${d.competencies.map(item=>`<div class="portfolio-competency"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.category||'General')} · ${(item.experienceIds||[]).length} linked experience(s) · ${(item.evidenceIds||[]).length} linked evidence item(s)</small></div>`).join('')}</div>`:'<p>No competency suggestions have been generated yet.</p>'}
  </section>
  <section class="portfolio-section"><h3>05 · Evidence register <span class="section-count">${d.evidence.length} item(s)</span></h3>
   ${d.evidence.length?`<div class="portfolio-evidence-register">${d.evidence.map(item=>`<div class="portfolio-evidence-item"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.type)} · ${escapeHtml(evidenceStatusLabel(item))} · ${escapeHtml(d.experiences.find(e=>e.id===item.experienceId)?.title||'Not linked to an experience')}${item.fileName?' · '+escapeHtml(item.fileName):' · No file attached'}</small>${item.description?`<p>${escapeHtml(item.description)}</p>`:''}</div>`).join('')}</div>`:'<p>No evidence records have been added.</p>'}
  </section>
  <p class="portfolio-attachment-note">Attachment note: this PDF lists attached filenames where available. Original files remain separately stored in private account storage and are not embedded in the exported PDF.</p>
  <footer class="portfolio-footer"><p>Prepared using PriorProof · Your skills deserve recognition.</p><p>Generated on ${new Date().toLocaleDateString()} · Information is user-submitted unless otherwise stated.</p></footer>
  <button class="btn btn-primary no-print portfolio-print" id="printPortfolio">Print / Save as PDF</button>
 </section>`;
 return simplePage('My portfolio','A structured, printable record of your experience, skills and supporting evidence.',readinessPanel+content,'/app/portfolio');
}
export function assessmentsPage(){
 const d=getData(),packs=Array.isArray(d.assessments)?d.assessments:[];
 const options=d.competencies.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
 const evidence=d.evidence.map(e=>`<label class="review-evidence-option"><input type="checkbox" name="evidenceIds" value="${escapeHtml(e.id)}"><span><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.type)} · ${escapeHtml(evidenceStatusLabel(e))}</small></span></label>`).join('');
 const cards=packs.map(p=>{const c=d.competencies.find(x=>x.id===p.competencyId);const items=(p.evidenceIds||[]).map(id=>d.evidence.find(x=>x.id===id)).filter(Boolean);return `<article class="panel review-pack-card"><span class="pill">Prepared · Not submitted</span><h3>${escapeHtml(c?.name||p.competencyName||'Competency unavailable')}</h3><small>Created ${escapeHtml(p.createdAt?new Date(p.createdAt).toLocaleString():'Date not recorded')} · ${items.length} evidence item(s)</small><p>${escapeHtml(p.context||'No reviewer context added.')}</p>${items.length?`<div class="review-pack-evidence"><b>Included evidence</b><ul>${items.map(item=>`<li><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type||'Supporting material')} · ${escapeHtml(evidenceStatusLabel(item))}${item.fileName?' · File attached':''}</small></li>`).join('')}</ul></div>`:'<p class="helper-text">No evidence items selected. Consider adding supporting material before sharing this brief.</p>'}<div class="review-pack-actions"><button class="btn btn-secondary" type="button" data-export-review-pack="${escapeHtml(p.id)}">Download review brief</button><button class="btn btn-danger" type="button" data-delete-review-pack="${escapeHtml(p.id)}">Delete</button></div><p class="helper-text">This pack has not been sent to or reviewed by an external assessor.</p></article>`;}).join('');
 const content=`<section class="panel review-intro"><span class="eyebrow">REVIEW PREPARATION</span><h2>Prepare an evidence review pack</h2><p>Select a suggested competency and relevant evidence for an authorised reviewer to consider. The pack is saved to your account workspace. It is not submitted to an assessor and does not verify claims.</p></section>
 ${d.competencies.length?`<section class="panel"><h2>New review pack</h2><form id="reviewPackForm" class="review-pack-form"><label>Competency<select name="competencyId" required><option value="">Select a competency</option>${options}</select></label><fieldset><legend>Evidence to include</legend><p class="helper-text">Select only evidence that genuinely relates to this competency.</p>${evidence||'<p>No evidence records yet. You may still prepare a pack.</p>'}</fieldset><label>Context for reviewer (optional)<textarea name="context" rows="4" maxlength="1200" placeholder="Explain what you would like the reviewer to consider."></textarea></label><button class="btn btn-primary" type="submit">Save review pack</button></form></section>`:'<section class="panel"><p>Add experience records and review your competency suggestions before preparing a pack.</p><a href="/app/experience" data-link>Go to experience</a></section>'}
 <section class="review-packs-section"><div class="panel-head"><div><h2>Prepared review packs</h2><p>${packs.length} locally saved pack(s)</p></div></div>${cards||'<section class="panel empty-state"><h3>No review packs prepared</h3><p>Your saved preparation packs will appear here.</p></section>'}</section>`;
 return simplePage('Assessments','Prepare evidence for review and track what is ready to share.',content,'/app/assessments');
}
export function settingsPage(){return simplePage('Settings','Manage your PriorProof account workspace.',`<section class="panel"><h2>Account and privacy controls</h2><p class="muted">Your workspace is linked to the account you are signed in with. You can edit your profile, export a backup, clear workspace records while retaining profile details, or sign out. Restoring a backup does not change the email address or identity of your signed-in account.</p><p class="helper-text">Permanent account deletion is not yet available as a self-service feature. Clearing workspace records does not delete your sign-in account. Avoid adding highly sensitive information while PriorProof is under development.</p></section><section class="panel" style="margin-top:18px"><h2>Backup and restore</h2><p class="muted">Create a portable JSON backup of your profile, experience, evidence records and competency links.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" id="exportData">Export backup (JSON)</button><label class="btn btn-outline" for="importDataFile" style="cursor:pointer">Choose backup to restore</label><input id="importDataFile" type="file" accept=".json,application/json" hidden></div><p class="helper-text">Restore replaces the records in your signed-in account workspace. Export your current data first if you may need it. Attachments are stored separately in private cloud storage and are not included in JSON backups; keep original files elsewhere.</p><p class="helper-text">Your profile, experience records, evidence metadata and attached files are linked to your signed-in account. Keep original documents and periodic JSON backups.</p></section><section class="panel" style="margin-top:18px"><h2>Clear workspace records</h2><p class="muted">Remove your experience, evidence, competency and review-preparation records from this account.</p><button class="btn btn-outline" id="resetDemo">Clear workspace records</button><p class="helper-text">This action also removes your private evidence attachments. Your profile details remain. Export a JSON backup first if you want to keep a copy; attachments are not included in backups.</p></section>`,'/app/settings');}
export function helpPage(){return simplePage('Help & support','A few notes to help you use the PriorProof prototype.',`<section class="panel"><h3>What is PriorProof?</h3><p>It helps people document experience, organise supporting evidence and prepare competency portfolios.</p><h3>Does PriorProof certify my skills?</h3><p>No. It helps organise information. Formal recognition depends on relevant standards and authorised assessment processes.</p><h3>Where is my data stored?</h3><p>Your workspace records and evidence attachments are stored in private account storage linked to your sign-in. JSON backups can be exported from Settings.</p></section>`,'/app/help');}
export function passwordResetPage(){return `<div class="auth-layout"><div class="auth-brand"><a href="/" data-link><img src="/logo.svg" alt="PriorProof"></a><div><span class="eyebrow light">ACCOUNT SECURITY</span><h1>Choose a new password.</h1><p>Set a new password for your PriorProof account.</p></div><small>PriorProof · Your skills deserve recognition.</small></div><div class="auth-form-wrap"><div class="auth-top-tools"><a class="back-home" href="/login" data-link>← Back to sign in</a><button class="theme-toggle" type="button" data-theme-toggle>◐ <span>Dark mode</span></button></div><form id="passwordResetForm" class="auth-form" novalidate><span class="eyebrow">PASSWORD RESET</span><h2>Set a new password</h2><p class="muted">Use at least 8 characters. Enter the new password twice to confirm it.</p><label>New password<div class="password-wrap"><input id="newPassword" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Enter a new password"><button type="button" class="password-toggle" data-toggle-password="newPassword">Show</button></div></label><label>Confirm new password<div class="password-wrap"><input id="confirmNewPassword" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="Re-enter your new password"><button type="button" class="password-toggle" data-toggle-password="confirmNewPassword">Show</button></div></label><p class="auth-feedback" id="passwordResetFeedback" role="status" aria-live="polite"></p><button class="btn btn-primary full-btn" type="submit">Update password</button></form></div></div>`;}
export function authPage(mode){return `<div class="auth-layout"><div class="auth-brand"><a href="/" data-link><img src="/logo.svg" alt="PriorProof"></a><div><span class="eyebrow light">YOUR EXPERIENCE MATTERS</span><h1>Make your skills visible.</h1><p>Document your journey. Connect your evidence. Build your portfolio.</p></div><small>PriorProof · Your skills deserve recognition.</small></div><div class="auth-form-wrap"><div class="auth-top-tools"><a class="back-home" href="/" data-link>← Back to homepage</a><button class="theme-toggle" type="button" data-theme-toggle>◐ <span>Dark mode</span></button></div><form id="authForm" class="auth-form" novalidate><span class="eyebrow">${mode==='login'?'WELCOME BACK':'GET STARTED'}</span><h2>${mode==='login'?'Sign in to PriorProof':'Create your account'}</h2><p class="muted">${mode==='login'?'Access your personal workspace.':'Start documenting your experience and skills.'}</p>${mode==='register'?'<label>Full name<input name="fullName" autocomplete="name" required placeholder="Your full name"></label>':''}<label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<div class="password-wrap"><input id="authPassword" name="password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" required minlength="8" placeholder="Enter your password"><button type="button" class="password-toggle" id="togglePassword" aria-label="Show password">Show</button></div></label>${mode==='register'?'<label>Confirm password<div class="password-wrap"><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="Re-enter your password"><button type="button" class="password-toggle" id="toggleConfirmPassword" aria-label="Show confirmation password">Show</button></div></label><label class="auth-check"><input type="checkbox" name="terms" required><span>I agree to the <a href="/terms" data-link>Terms of Use</a> and acknowledge the <a href="/privacy" data-link>Privacy Notice</a>.</span></label>':'<div class="auth-options"><span class="helper-text">Your sign-in session is securely maintained on this device.</span><button type="button" class="text-link" id="forgotPassword">Forgot password?</button></div>'}<p class="auth-feedback" id="authFeedback" role="status" aria-live="polite"></p><button class="btn btn-primary full-btn" type="submit">${mode==='login'?'Sign in':'Create account'} →</button><div class="auth-divider"><span>OR CONTINUE WITH</span></div><button type="button" class="google-button" id="googleSignIn"><svg class="google-logo" viewBox="0 0 48 48" role="img" aria-label="Google"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.8 27.7a12 12 0 0 1 0-7.4V15H5.9a20 20 0 0 0 0 18z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.9 15l6.9 5.3c1.6-4.7 6-8.2 11.2-8.2z"/></svg> Continue with Google</button><div class="auth-switch">${mode==='login'? 'New to PriorProof? <a href="/register" data-link>Create an account</a>':'Already registered? <a href="/login" data-link>Sign in</a>'}</div><p class="helper-text">Sign in securely with your email or Google account. Your workspace and evidence attachments are stored in private account storage.</p></form></div></div>`;}
function openEntryDialog(kind,editId=null){
 const isExperience=kind==='experience',data=getData(),editRecord=editId?(isExperience?data.experiences.find(item=>item.id===editId):data.evidence.find(item=>item.id===editId)):null;
 if(editId&&!editRecord)return;
 const dialog=document.createElement('dialog');
 dialog.style.cssText='width:min(600px,calc(100% - 32px));max-height:88vh;overflow:auto;border:0;border-radius:14px;padding:24px;box-shadow:0 20px 70px #142b5040';
 dialog.innerHTML='<form id="entryForm"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><h2 style="margin:0;font-size:22px">'+(editRecord?'Edit '+(isExperience?'experience':'evidence record'):(isExperience?'Add experience':'Add evidence record'))+'</h2><button type="button" id="closeEntry" class="btn btn-outline">✕</button></div><div id="entryFields"></div><p class="helper-text" id="entryNote"></p><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px"><button type="button" id="cancelEntry" class="btn btn-outline">Cancel</button><button class="btn btn-primary" type="submit">'+(editRecord?'Save changes':'Save record')+'</button></div></form>';
 const fields=dialog.querySelector('#entryFields');
 const label=(text,html,wide=false)=>'<label style="display:block;font-size:12px;font-weight:700;margin:0 0 14px;'+(wide?'grid-column:1/-1':'')+'">'+text+html+'</label>';
 const input=(name,placeholder,required=false,type='text')=>'<input style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px" name="'+name+'" type="'+type+'" placeholder="'+placeholder+'" '+(required?'required':'')+'>';
 const select=(name,values)=>'<select name="'+name+'" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px">'+values.map(v=>'<option>'+v+'</option>').join('')+'</select>';
 if(isExperience){
  fields.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 14px">'+label('Experience title *',input('title','e.g. Community project coordination',true),true)+label('Organisation / activity',input('organisation','Organisation or self-directed'))+label('Experience type',select('category',['Employment','Volunteering','Apprenticeship','Self-employment','Community activity','Formal learning','Informal learning','Entrepreneurship']))+label('Start date',input('startDate','','','month'))+label('End date',input('endDate','','','month'))+label('What did you do? *','<textarea name="description" required maxlength="1200" placeholder="Describe your responsibilities and regular activities." style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px;min-height:90px"></textarea>',true)+label('Your contribution (optional)','<textarea name="contribution" maxlength="1000" placeholder="What did you personally contribute? Mention tasks, methods or responsibilities." style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px;min-height:75px"></textarea>',true)+label('Outcome or impact (optional)','<textarea name="outcome" maxlength="1000" placeholder="What changed or was produced? Use specific examples where possible." style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px;min-height:75px"></textarea>',true)+label('What did you learn? (optional)','<textarea name="learning" maxlength="800" placeholder="What knowledge or lessons did you gain?" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px;min-height:70px"></textarea>',true)+label('Skills developed *',input('skills','Communication, teamwork, record keeping',true),true)+'</div>';
  dialog.querySelector('#entryNote').textContent='Describe your actual experience. Skill suggestions are preliminary and are not formal assessment outcomes.';
  if(editRecord){const form=dialog.querySelector('#entryForm');['title','organisation','category','startDate','endDate','description','contribution','outcome','learning'].forEach(name=>{const field=form.elements.namedItem(name);if(field)field.value=editRecord[name]||'';});const skillsField=form.elements.namedItem('skills');if(skillsField)skillsField.value=(editRecord.skills||[]).join(', ');}
 }else{
  const opts='<option value="">Not linked yet</option>'+data.experiences.map(e=>'<option value="'+escapeHtml(e.id)+'">'+escapeHtml(e.title)+'</option>').join('');
  fields.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 14px">'+label('Evidence title *',input('title','e.g. Project report or work sample',true),true)+label('Evidence type',select('type',['Project report','Work sample','Certificate','Reference','Photograph','Training record','Other supporting material']))+label('Related experience','<select name="experienceId" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px">'+opts+'</select>')+label('Source / issuer',input('source','e.g. Training provider, employer or project'))+label('Date created or received',input('evidenceDate','','','date'))+label('Description / context','<textarea name="description" maxlength="800" placeholder="What does this item contain? What does it help demonstrate?" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #d7dee8;border-radius:8px;min-height:90px"></textarea>',true)+label('Attach a file (optional)','<input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" style="display:block;width:100%;margin-top:6px">',true)+'</div>';
  dialog.querySelector('#entryNote').textContent=(editRecord?'Update the record details.':'Optional PDF, image, Word or text files up to 5 MB are uploaded to your private account storage. Files and record details are not independently verified. Evidence records are marked as not independently verified.')+(editRecord&&editRecord.fileName?' Existing attachment: '+editRecord.fileName+'. Choose a new file only if you want to replace it.':'');
  if(editRecord){const form=dialog.querySelector('#entryForm');['title','type','experienceId','source','evidenceDate','description'].forEach(name=>{const field=form.elements.namedItem(name);if(field)field.value=editRecord[name]||'';});}
 }
 document.body.appendChild(dialog);
 const close=()=>{dialog.close();dialog.remove();};
 dialog.querySelector('#closeEntry').addEventListener('click',close);
 dialog.querySelector('#cancelEntry').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 dialog.querySelector('form').addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget),d=getData();
  let uploadedAttachment=null,previousAttachment=null;
  if(isExperience){
   const skills=String(f.get('skills')||'').split(',').map(s=>s.trim()).filter(Boolean);
   const exp={id:editRecord?editRecord.id:crypto.randomUUID(),title:String(f.get('title')).trim(),organisation:String(f.get('organisation')||'').trim()||'Independent experience',category:f.get('category'),description:String(f.get('description')).trim(),contribution:String(f.get('contribution')||'').trim(),outcome:String(f.get('outcome')||'').trim(),learning:String(f.get('learning')||'').trim(),startDate:f.get('startDate')||'',endDate:f.get('endDate')||'',skills};
   if(editRecord){const index=d.experiences.findIndex(item=>item.id===editRecord.id);if(index>=0)d.experiences[index]=exp;}else d.experiences.unshift(exp);
   d.competencies.forEach(c=>{c.experienceIds=(c.experienceIds||[]).filter(id=>id!==exp.id);});
   skills.forEach(skill=>{const definition=skillDefinition(skill);let competency=d.competencies.find(c=>skillDefinition(c.name).name.toLowerCase()===definition.name.toLowerCase());if(!competency){competency={id:crypto.randomUUID(),name:definition.name,category:definition.category,status:'Suggested',experienceIds:[],evidenceIds:[]};d.competencies.push(competency);}competency.category=definition.category==='General'?(competency.category||'General'):definition.category;competency.sourceSkills=[...new Set([...(competency.sourceSkills||[]),skill])];competency.experienceIds=[...new Set([...(competency.experienceIds||[]),exp.id])];});
   // Rebuild skill provenance from current experience records to avoid stale suggestions after edits.
   d.competencies.forEach(c=>{
    c.experienceIds=(c.experienceIds||[]).filter(id=>d.experiences.some(x=>x.id===id));
    c.evidenceIds=(c.evidenceIds||[]).filter(id=>d.evidence.some(x=>x.id===id));
    c.sourceSkills=[...new Set(d.experiences.filter(x=>(c.experienceIds||[]).includes(x.id)).flatMap(x=>x.skills||[]).filter(skill=>skillDefinition(skill).name.toLowerCase()===skillDefinition(c.name).name.toLowerCase()))];
   });
   d.competencies=d.competencies.filter(c=>(c.experienceIds||[]).length||(c.evidenceIds||[]).length);
   d.assessments=(d.assessments||[]).map(p=>({...p,evidenceIds:(p.evidenceIds||[]).filter(id=>d.evidence.some(x=>x.id===id))}));

  }else{
   const file=f.get('file'),evId=editRecord?editRecord.id:crypto.randomUUID();
   const hasNewFile=Boolean(file&&file.size);
   let attachment=null;
   if(hasNewFile){try{attachment=await saveEvidenceFile(evId,file);uploadedAttachment=attachment;previousAttachment=editRecord?.filePath||null;}catch(error){alert(error.message||'The file could not be uploaded.');return;}}
   const ev={id:evId,title:String(f.get('title')).trim(),type:f.get('type'),experienceId:f.get('experienceId')||null,source:String(f.get('source')||'').trim(),evidenceDate:f.get('evidenceDate')||'',description:String(f.get('description')||'').trim(),status:'Not independently verified',fileId:hasNewFile?evId:(editRecord?.fileId||null),filePath:hasNewFile?attachment.path:(editRecord?.filePath||null),fileName:hasNewFile?attachment.name:(editRecord?.fileName||''),fileSize:hasNewFile?attachment.size:(editRecord?.fileSize||0),fileType:hasNewFile?attachment.type:(editRecord?.fileType||'')};
   if(editRecord){const index=d.evidence.findIndex(item=>item.id===editRecord.id);if(index>=0)d.evidence[index]=ev;}else d.evidence.unshift(ev);
   // Preserve manually selected competency links when only evidence details change.
   // Rebuild links only for a new record or when its related experience changes.
   if(!editRecord||editRecord.experienceId!==ev.experienceId){
    d.competencies.forEach(c=>{
     c.evidenceIds=(c.evidenceIds||[]).filter(id=>id!==ev.id);
     if(ev.experienceId&&(c.experienceIds||[]).includes(ev.experienceId))c.evidenceIds=[...new Set([...(c.evidenceIds||[]),ev.id])];
    });
   }
  }
  try{
   // Wait for the new record and attachment reference to be saved before removing an older file.
   await saveDataAndWait(d);
  }catch(error){
   alert(error.message||'Your changes could not be confirmed in the cloud. Keep this dialog open and retry; existing attachments have been preserved.');
   return;
  }
  if(uploadedAttachment&&previousAttachment&&previousAttachment!==uploadedAttachment.path){
   try{await deleteEvidenceFile(editRecord.id,previousAttachment);}
   catch(error){alert('Your updated evidence record and new attachment were saved, but the previous attachment could not be removed. It is no longer linked and may remain in private storage.');}
  }
  close();window.dispatchEvent(new PopStateEvent('popstate'));
 });
 dialog.showModal();
}
export function bindAppActions(){
 document.querySelectorAll('[data-toggle-password]').forEach(button=>button.addEventListener('click',()=>{const field=document.getElementById(button.dataset.togglePassword);if(!field)return;const show=field.type==='password';field.type=show?'text':'password';button.textContent=show?'Hide':'Show';}));
 document.getElementById('passwordResetForm')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const password=form.elements.namedItem('password').value,confirmation=form.elements.namedItem('confirmPassword').value,feedback=document.getElementById('passwordResetFeedback'),submit=form.querySelector('button[type="submit"]');if(password!==confirmation){feedback.textContent='The passwords do not match.';feedback.className='auth-feedback error';return;}if(submit){submit.disabled=true;submit.textContent='Updating…';}try{const {error}=await updateAccountPassword(password);if(error)throw error;feedback.textContent='Your password has been updated. You can now continue to your workspace.';feedback.className='auth-feedback';form.reset();window.setTimeout(()=>navigate('/app/dashboard'),900);}catch(error){feedback.textContent=error.message||'Could not update your password. Please reopen the reset link and try again.';feedback.className='auth-feedback error';}finally{if(submit?.isConnected){submit.disabled=false;submit.textContent='Update password';}}});
 document.getElementById('printPortfolio')?.addEventListener('click',()=>window.print());
 document.getElementById('profilePhotoFile')?.addEventListener('change',event=>{const file=event.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){alert('Choose a JPG, PNG or WebP image.');event.target.value='';return;}if(file.size>1024*1024){alert('Please choose an image smaller than 1 MB.');event.target.value='';return;}const reader=new FileReader();reader.onload=()=>{const value=String(reader.result||'');document.getElementById('profilePhotoValue').value=value;document.getElementById('profilePhotoPreview').innerHTML='<img src="'+value+'" alt="Selected profile photo">';};reader.onerror=()=>alert('Could not read this image. Please try another file.');reader.readAsDataURL(file);});
 document.getElementById('removeProfilePhoto')?.addEventListener('click',()=>{document.getElementById('profilePhotoValue').value='';document.getElementById('profilePhotoFile').value='';const preview=document.getElementById('profilePhotoPreview');preview.textContent=(document.querySelector('#profileForm input[name="fullName"]')?.value||'A').trim().slice(0,1).toUpperCase();});
 document.getElementById('profileForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const d=getData(),f=new FormData(form),fullName=String(f.get('fullName')||'').trim(),email=String(f.get('email')||'').trim(),oldEmail=d.user.email||'';const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Saving…';}try{const {data,error}=await updateAccountProfile({fullName,email:email!==oldEmail?email:undefined});if(error)throw error;d.user={...d.user,fullName,email:email!==oldEmail?(data?.user?.email||oldEmail):oldEmail,phoneNumber:String(f.get('phoneNumber')||'').trim(),profilePhoto:String(f.get('profilePhoto')||''),targetOccupation:String(f.get('targetOccupation')||'').trim(),location:String(f.get('location')||'').trim(),summary:String(f.get('summary')||'').trim(),interests:String(f.get('interests')||'').trim()};saveData(d);if(email!==oldEmail&&!data?.user?.email?.toLowerCase().includes(email.toLowerCase()))alert('Profile details saved. Supabase has sent an email confirmation link to your new email address. Your sign-in email changes after confirmation.');else alert('Your profile has been updated.');navigate('/app/dashboard');}catch(error){alert(error.message||'Could not update your profile.');}finally{if(submit?.isConnected){submit.disabled=false;submit.textContent='Save profile';}}});
 document.getElementById('resetDemo')?.addEventListener('click',async()=>{
  if(!confirm('Clear all experience, evidence, competency and review records from your account? Your profile will remain. Private evidence attachments will also be deleted.'))return;
  const button=document.getElementById('resetDemo');
  if(button){button.disabled=true;button.textContent='Saving changes…';}
  try{
   // Save the empty workspace first. Never delete attachments before the record change is confirmed.
   await resetData();
  }catch(error){
   alert(error.message||'The workspace could not be cleared. Your evidence attachments were kept.');
   if(button){button.disabled=false;button.textContent='Clear workspace records';}
   return;
  }
  try{
   await clearEvidenceFiles();
   alert('Your workspace records were cleared and saved. Evidence attachments were also removed.');
  }catch(error){
   alert('Your workspace records were cleared and saved, but attachment cleanup did not finish. Your records are safe. Select Clear workspace records again to retry attachment cleanup.');
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
 });
 document.getElementById('exportData')?.addEventListener('click',()=>{const backup={app:'PriorProof',schemaVersion:1,exportedAt:new Date().toISOString(),data:getData()};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='priorproof-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);});
 document.getElementById('importDataFile')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  try{
   if(file.size>10*1024*1024)throw new Error('The backup file is larger than 10 MB.');
   const parsed=JSON.parse(await file.text());
   const candidate=parsed?.app==='PriorProof'?parsed.data:parsed;
   if(parsed?.app&&parsed.app!=='PriorProof')throw new Error('This file is not a PriorProof backup.');
   if(parsed?.app==='PriorProof'&&parsed.schemaVersion!==1)throw new Error('This backup version is not supported. Please export a fresh backup from the current version of PriorProof.');
   if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||!candidate.user||typeof candidate.user!=='object'||!Array.isArray(candidate.experiences)||!Array.isArray(candidate.evidence)||!Array.isArray(candidate.competencies)||(candidate.assessments!==undefined&&!Array.isArray(candidate.assessments)))throw new Error('The file structure is not a valid PriorProof backup.');
   const assessmentRecords=Array.isArray(candidate.assessments)?candidate.assessments:[];
   for(const [name,items] of [['experience',candidate.experiences],['evidence',candidate.evidence],['competency',candidate.competencies],['review pack',assessmentRecords]]){
    const ids=new Set();
    for(const item of items){
     if(!item||typeof item!=='object'||Array.isArray(item)||typeof item.id!=='string'||!item.id.trim())throw new Error('A '+name+' record is missing a valid ID.');
     if(ids.has(item.id))throw new Error('The backup contains duplicate '+name+' IDs.');
     ids.add(item.id);
    }
   }
   const counts=candidate.experiences.length+' experience record(s), '+candidate.evidence.length+' evidence record(s) and '+candidate.competencies.length+' competency suggestion(s)';
   if(!confirm('Restore this backup? It contains '+counts+'. The current workspace will be replaced. Attachments are not included in JSON backups. Continue?'))return;
   const currentUser=getData().user||{};
   const experienceIds=new Set(candidate.experiences.map(item=>item.id));
   const evidenceIds=new Set(candidate.evidence.map(item=>item.id));
   const restored={
    ...candidate,
    user:{...candidate.user,id:currentUser.id,email:currentUser.email},
    experiences:candidate.experiences.map(item=>({...item,skills:Array.isArray(item.skills)?item.skills.filter(skill=>typeof skill==='string'):[]})),
    evidence:candidate.evidence.map(item=>({...item,experienceId:experienceIds.has(item.experienceId)?item.experienceId:null,fileId:null,filePath:null,fileName:'',fileSize:0,fileType:''})),
    competencies:candidate.competencies.map(item=>({...item,experienceIds:Array.isArray(item.experienceIds)?item.experienceIds.filter(id=>experienceIds.has(id)):[],evidenceIds:Array.isArray(item.evidenceIds)?item.evidenceIds.filter(id=>evidenceIds.has(id)):[]})),
    assessments:assessmentRecords.map(item=>({...item,competencyId:candidate.competencies.some(c=>c.id===item.competencyId)?item.competencyId:null,evidenceIds:Array.isArray(item.evidenceIds)?item.evidenceIds.filter(id=>evidenceIds.has(id)):[]}))
   };
   // Persist the restored records before removing old attachment files.
   await saveDataAndWait(restored);
   let cleanupMessage='Backup restored and saved. Attachments are not included in JSON backups; add them again from your original files if needed.';
   try{
    await clearEvidenceFiles();
   }catch(cleanupError){
    cleanupMessage+=' Some old attachment files could not be removed. They are no longer linked to the restored records and may remain in private storage until a dedicated cleanup control is available.';
   }
   alert(cleanupMessage);
   window.dispatchEvent(new PopStateEvent('popstate'));
  }catch(error){
   alert(error.message||'Could not restore this backup. Existing evidence attachments were not deliberately removed.');
  }finally{
   event.target.value='';
  }
 });
 document.querySelectorAll('[data-edit-experience]').forEach(button=>button.addEventListener('click',()=>openEntryDialog('experience',button.dataset.editExperience)));
 document.querySelectorAll('[data-delete-experience]').forEach(button=>button.addEventListener('click',async()=>{
  if(!confirm('Remove this experience and its linked evidence records?'))return;
  const d=getData(),id=button.dataset.deleteExperience;
  const removed=d.evidence.filter(e=>e.experienceId===id);
  d.experiences=d.experiences.filter(e=>e.id!==id);
  const removedIds=removed.map(e=>e.id);
  d.evidence=d.evidence.filter(e=>e.experienceId!==id);
  d.competencies.forEach(c=>{c.experienceIds=(c.experienceIds||[]).filter(x=>x!==id);c.evidenceIds=(c.evidenceIds||[]).filter(x=>!removedIds.includes(x));c.sourceSkills=[...new Set(d.experiences.filter(x=>(c.experienceIds||[]).includes(x.id)).flatMap(x=>x.skills||[]).filter(skill=>skillDefinition(skill).name.toLowerCase()===skillDefinition(c.name).name.toLowerCase()))];});
  d.competencies=d.competencies.filter(c=>(c.experienceIds||[]).length||(c.evidenceIds||[]).length);
  d.assessments=(d.assessments||[]).map(p=>({...p,evidenceIds:(p.evidenceIds||[]).filter(x=>!removedIds.includes(x))}));
  try{
   // Commit record removal before deleting files, so a failed save never leaves broken attachment references.
   await saveDataAndWait(d);
  }catch(error){
   alert(error.message||'Could not save the removal. Evidence attachments were kept.');
   return;
  }
  let failed=0;
  for(const item of removed){
   if(!item.fileId&&!item.filePath)continue;
   try{await deleteEvidenceFile(item.fileId,item.filePath);}catch(error){failed++;}
  }
  if(failed)alert('The experience and its evidence records were removed and saved, but '+failed+' attachment file(s) could not be deleted. They are no longer linked to your records and may remain in private storage.');
 }));
 document.querySelectorAll('[data-edit-evidence]').forEach(button=>button.addEventListener('click',()=>openEntryDialog('evidence',button.dataset.editEvidence)));
 document.querySelectorAll('[data-delete-evidence]').forEach(button=>button.addEventListener('click',async()=>{
  if(!confirm('Remove this evidence record?'))return;
  const d=getData(),id=button.dataset.deleteEvidence,item=d.evidence.find(e=>e.id===id);
  d.evidence=d.evidence.filter(e=>e.id!==id);
  d.competencies.forEach(c=>c.evidenceIds=(c.evidenceIds||[]).filter(x=>x!==id));
  d.assessments=(d.assessments||[]).map(p=>({...p,evidenceIds:(p.evidenceIds||[]).filter(x=>x!==id)}));
  d.competencies=d.competencies.filter(c=>(c.experienceIds||[]).length||(c.evidenceIds||[]).length);
  try{
   // Persist the record change before attempting file deletion.
   await saveDataAndWait(d);
  }catch(error){
   alert(error.message||'Could not save the removal. The evidence attachment was kept.');
   return;
  }
  if(item?.fileId||item?.filePath){
   try{await deleteEvidenceFile(item.fileId,item.filePath);}
   catch(error){alert('The evidence record was removed and saved, but its attachment could not be deleted. The file is no longer linked to your records and may remain in private storage.');}
  }
 }));
 document.querySelectorAll('[data-map-form]').forEach(form=>form.addEventListener('submit',async e=>{
   e.preventDefault();
   const submit=form.querySelector('button[type="submit"]'),d=getData(),competency=d.competencies.find(c=>c.id===form.dataset.mapForm),evidenceId=String(new FormData(form).get('evidenceId')||'');
   if(!competency||!evidenceId)return;
   const item=d.evidence.find(x=>x.id===evidenceId);
   if(!item)return;
   competency.evidenceIds=[...new Set([...(competency.evidenceIds||[]),evidenceId])];
   if(submit){submit.disabled=true;submit.textContent='Saving…';}
   try{await saveDataAndWait(d);window.dispatchEvent(new PopStateEvent('popstate'));}
   catch(error){alert(error.message||'Could not save this evidence link. Please try again.');if(submit){submit.disabled=false;submit.textContent='Link evidence';}}
  }));
  document.querySelectorAll('[data-unlink-evidence]').forEach(button=>button.addEventListener('click',async()=>{
   const d=getData(),competency=d.competencies.find(c=>c.id===button.dataset.unlinkEvidence);
   if(!competency)return;
   if(!confirm('Remove this evidence link? The evidence record itself will remain in your repository.'))return;
   competency.evidenceIds=(competency.evidenceIds||[]).filter(id=>id!==button.dataset.evidenceId);
   button.disabled=true;
   try{await saveDataAndWait(d);window.dispatchEvent(new PopStateEvent('popstate'));}
   catch(error){alert(error.message||'Could not save this change. Please try again.');button.disabled=false;}
  }));
  const evidenceSearch=document.getElementById('evidenceSearch'),evidenceType=document.getElementById('evidenceTypeFilter'),evidenceStatus=document.getElementById('evidenceStatusFilter');
 if(evidenceSearch&&evidenceType&&evidenceStatus){
  const cards=[...document.querySelectorAll('[data-evidence-card]')],count=document.getElementById('evidenceResultCount'),empty=document.getElementById('evidenceNoResults');
  const applyEvidenceFilters=()=>{const q=evidenceSearch.value.trim().toLowerCase(),type=evidenceType.value,status=evidenceStatus.value;let visible=0;cards.forEach(card=>{const match=card.textContent.toLowerCase().includes(q)&&(!type||card.dataset.evidenceType===type)&&(!status||card.dataset.evidenceStatus===status);card.hidden=!match;if(match)visible++;});if(count)count.textContent=visible+' of '+cards.length+' record(s)';if(empty)empty.hidden=visible!==0;};
  evidenceSearch.addEventListener('input',applyEvidenceFilters);evidenceType.addEventListener('change',applyEvidenceFilters);evidenceStatus.addEventListener('change',applyEvidenceFilters);
 }
 document.querySelectorAll('[data-download-evidence]').forEach(button=>button.addEventListener('click',async()=>{try{const item=getData().evidence.find(e=>e.id===button.dataset.downloadEvidence);const file=item?await getEvidenceFile(item.fileId||item.id,item.filePath):null;if(!file){alert('The file is not available in this account.');return;}const url=URL.createObjectURL(file.blob),a=document.createElement('a');a.href=url;a.download=item?.fileName||file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(error){alert(error.message||'Could not retrieve the file.');}}));

 document.querySelectorAll('#addExperience').forEach(button=>button.addEventListener('click',()=>openEntryDialog('experience')));
 document.querySelectorAll('#addEvidence').forEach(button=>button.addEventListener('click',()=>openEntryDialog('evidence')));
 const reviewPackForm=document.getElementById('reviewPackForm');
 reviewPackForm?.addEventListener('submit',event=>{event.preventDefault();const d=getData(),f=new FormData(reviewPackForm),c=d.competencies.find(x=>x.id===f.get('competencyId'));if(!c)return;d.assessments=Array.isArray(d.assessments)?d.assessments:[];d.assessments.unshift({id:crypto.randomUUID(),competencyId:c.id,competencyName:c.name,evidenceIds:f.getAll('evidenceIds').filter(id=>d.evidence.some(x=>x.id===id)),context:String(f.get('context')||'').trim(),status:'Prepared - not submitted',createdAt:new Date().toISOString()});saveData(d);window.dispatchEvent(new PopStateEvent('popstate'));});
 document.querySelectorAll('[data-delete-review-pack]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Delete this review preparation record?'))return;const d=getData();d.assessments=(d.assessments||[]).filter(x=>x.id!==b.dataset.deleteReviewPack);saveData(d);window.dispatchEvent(new PopStateEvent('popstate'));}));
 document.querySelectorAll('[data-export-review-pack]').forEach(b=>b.addEventListener('click',()=>{
  const d=getData(),p=(d.assessments||[]).find(x=>x.id===b.dataset.exportReviewPack);
  if(!p)return;
  const c=d.competencies.find(x=>x.id===p.competencyId);
  const items=(p.evidenceIds||[]).map(id=>d.evidence.find(x=>x.id===id)).filter(Boolean);
  const clean=value=>String(value??'').replace(/\r\n?/g,'\n').trim();
  const lines=[
   'PRIORPROOF — EVIDENCE REVIEW BRIEF',
   'Prepared by: '+(clean(d.user.fullName)||'Not provided'),
   'Target field: '+(clean(d.user.targetOccupation)||'Not provided'),
   'Contact email: '+(clean(d.user.email)||'Not provided'),
   'Competency for consideration: '+(clean(c?.name||p.competencyName)||'Not available'),
   'Competency category: '+(clean(c?.category)||'Not provided'),
   'Created: '+(p.createdAt?new Date(p.createdAt).toLocaleString():'Not recorded'),
   '',
   'SELECTED EVIDENCE',
   ...(items.length?items.flatMap((item,index)=>{
    const experience=d.experiences.find(x=>x.id===item.experienceId);
    return [
     '',
     (index+1)+'. '+clean(item.title),
     'Type: '+(clean(item.type)||'Not provided'),
     'Status: Not independently verified',
     'Evidence date: '+(clean(item.evidenceDate)||'Not provided'),
     'Source: '+(clean(item.source)||'Not provided'),
     'Related experience: '+(clean(experience?.title)||'Not linked'),
     'Description: '+(clean(item.description)||'No description provided.'),
     'Attachment: '+(clean(item.fileName)||'No file attached; check the original record.')
    ];
   }):['No evidence items were selected for this pack.']),
   '',
   'REVIEW CONTEXT',
   clean(p.context)||'No additional context provided.',
   '',
   'IMPORTANT NOTES',
   'This brief is a user-prepared summary of records in PriorProof. It does not include original attachment files.',
   'Evidence descriptions and status labels are user-entered and have not been authenticated by PriorProof.',
   'This brief has not been submitted to, assessed by, or approved by an external reviewer.'
  ];
  const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='priorproof-review-brief-'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }));

}