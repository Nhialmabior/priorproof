import { appShell, escapeHtml } from '../components/layout.js';
import { getData, saveData, resetData } from '../services/storage.js';
import { navigate } from '../utils/router.js';
import { saveEvidenceFile, getEvidenceFile, deleteEvidenceFile, clearEvidenceFiles } from '../services/evidenceFiles.js';

const stat=(label,value,sub,icon)=>`<article class="stat-card"><div class="stat-top"><span>${label}</span><i>${icon}</i></div><strong>${value}</strong><small>${sub}</small></article>`;
const heading=(eyebrow,title,desc,action='')=>`<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;
const btn=(label,id)=>`<button class="btn btn-primary" id="${id}">${label} <span>+</span></button>`;
const skillCatalog={
 communication:{name:'Communication',category:'Interpersonal'},
 teamwork:{name:'Teamwork',category:'Interpersonal'},
 collaboration:{name:'Teamwork',category:'Interpersonal'},
 leadership:{name:'Leadership',category:'Leadership'},
 coordination:{name:'Activity coordination',category:'Organisational'},
 'activity coordination':{name:'Activity coordination',category:'Organisational'},
 'project coordination':{name:'Activity coordination',category:'Organisational'},
 'record keeping':{name:'Records management',category:'Administrative'},
 'records management':{name:'Records management',category:'Administrative'},
 planning:{name:'Planning',category:'Organisational'},
 'problem solving':{name:'Problem solving',category:'Analytical'},
 research:{name:'Research',category:'Analytical'},
 'data analysis':{name:'Data analysis',category:'Digital and analytical'},
 'digital literacy':{name:'Digital literacy',category:'Digital'},
 teaching:{name:'Teaching and learning support',category:'Learning and development'},
 facilitation:{name:'Facilitation',category:'Learning and development'},
 'project management':{name:'Project management',category:'Organisational'},
 budgeting:{name:'Budgeting',category:'Financial'},
 reporting:{name:'Reporting',category:'Communication'}
};
const skillDefinition=value=>{const key=String(value||'').trim().toLowerCase().replace(/\\s+/g,' ');return {key,...(skillCatalog[key]||{name:String(value||'').trim(),category:'General'})};};

export function dashboardPage(){
 const d=getData(),profileFields=[d.user.fullName,d.user.email,d.user.targetOccupation,d.user.location,d.user.summary,d.user.interests],profile=Math.round((profileFields.filter(value=>String(value||'').trim()).length/6)*100),profileReady=profileFields.filter(value=>String(value||'').trim()).length===6;
 const content=`${heading('YOUR WORKSPACE',`Welcome back, ${escapeHtml((d.user.fullName||'there').split(' ')[0])}.`,'Here is a snapshot of your recognition journey.',btn('Add experience','addExperience'))}
 <div class="stats-grid">${stat('Experience records',d.experiences.length,'Your learning and work history','▤')}${stat('Evidence items',d.evidence.length,'Supporting materials saved','▧')}${stat('Competency suggestions',d.competencies.length,'Potential skills identified','◇')}${stat('Profile completion',profile+'%','Keep your profile up to date','◉')}</div>
 <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Getting started</h2><p>Complete these steps to build your skills profile.</p></div><span class="pill">${[profileReady,d.experiences.length>0,d.evidence.length>0].filter(Boolean).length} of 3 started</span></div><a class="journey-row" href="/app/profile" data-link><span class="journey-number ${profileReady?'done':''}">1</span><div><b>Complete your profile</b><small>Name, contact, interests and professional summary</small></div><span class="complete">${profileReady?'Complete':profileFields.filter(value=>String(value||'').trim()).length+' / 6'}</span></a><a class="journey-row" href="/app/experience" data-link><span class="journey-number ${d.experiences.length?'done':''}">2</span><div><b>Document experience</b><small>Work, volunteering, learning or community activities</small></div><span class="complete">${d.experiences.length?d.experiences.length+' added':'Add first'}</span></a><a class="journey-row" href="/app/evidence" data-link><span class="journey-number ${d.evidence.length?'done':''}">3</span><div><b>Organise supporting evidence</b><small>Connect documents, work samples or references</small></div><span class="complete">${d.evidence.length?d.evidence.length+' added':'Add first'}</span></a><a class="journey-row" href="/app/portfolio" data-link><span class="journey-number ${d.experiences.length||d.evidence.length?'done':''}">4</span><div><b>Preview your portfolio</b><small>Review and print your current profile</small></div><span class="complete">Preview →</span></a></section>
 <section class="panel"><div class="panel-head"><div><h2>Quick actions</h2><p>Continue building your profile.</p></div></div><button class="quick-action" id="addExperience"><span>＋</span><div><b>Add experience</b><small>Record work, learning or volunteering</small></div><i>→</i></button><button class="quick-action" id="addEvidence"><span>↥</span><div><b>Add evidence record</b><small>Connect a document or work sample</small></div><i>→</i></button><a class="quick-action" href="/app/competencies" data-link><span>◇</span><div><b>Explore competencies</b><small>Review potential skills</small></div><i>→</i></a><a class="quick-action" href="/app/portfolio" data-link><span>▣</span><div><b>View my portfolio</b><small>Preview your information</small></div><i>→</i></a></section></div>
 <section class="panel recent-panel"><div class="panel-head"><div><h2>Recent experience</h2><p>Your latest records.</p></div><a href="/app/experience" data-link>View all →</a></div>${d.experiences.length?d.experiences.slice(0,3).map(e=>`<div class="record-row"><div class="record-icon">▤</div><div><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.organisation||e.category)} · ${escapeHtml(e.startDate||'Date not provided')}</small></div><span class="pill">${escapeHtml(e.category)}</span></div>`).join(''):'<div class="empty-state">No experience records yet. Add your first experience to begin.</div>'}</section>`;
 return appShell(content,'/app/dashboard',d.user);
}
function simplePage(title,desc,body,active,action=''){const d=getData();return appShell(`${heading('YOUR WORKSPACE',title,desc,action)}${body}`,active,d.user);}
export function profilePage(){const d=getData();return simplePage('My profile','Introduce your background, interests and the kind of opportunities you want to pursue.',`<section class="panel form-panel"><form id="profileForm" class="form-grid"><label>Full name<input name="fullName" value="${escapeHtml(d.user.fullName||'')}" maxlength="100" required></label><label>Email address<input type="email" name="email" value="${escapeHtml(d.user.email||'')}" maxlength="160"></label><label>Target occupation or field<input name="targetOccupation" value="${escapeHtml(d.user.targetOccupation||'')}" maxlength="120" placeholder="e.g. Community development"></label><label>Location<input name="location" value="${escapeHtml(d.user.location||'')}" maxlength="120" placeholder="City, country or region"></label><label class="form-full">Professional summary<textarea name="summary" maxlength="700" rows="4" placeholder="Briefly describe your background, strengths and experience.">${escapeHtml(d.user.summary||'')}</textarea></label><label class="form-full">Areas of interest<input name="interests" value="${escapeHtml(d.user.interests||'')}" maxlength="240" placeholder="e.g. Project coordination, data analysis, digital skills"></label><div class="form-full"><p class="helper-text">Your profile is stored in this browser in the current prototype. Avoid adding sensitive personal information.</p><button class="btn btn-primary">Save profile</button></div></form></section>`,'/app/profile');}
export function experiencePage(){const d=getData();return simplePage('My experience','Capture the places where you have learned, contributed and developed skills.',`<section class="panel"><div class="panel-head"><div><h2>Experience timeline</h2><p>${d.experiences.length} record(s)</p></div>${btn('Add experience','addExperience')}</div>${d.experiences.length?d.experiences.map(e=>`<article class="experience-item"><div class="timeline-dot"></div><div><div class="row-between"><h3>${escapeHtml(e.title)}</h3><span class="pill">${escapeHtml(e.category)}</span></div><p class="muted">${escapeHtml(e.organisation)} · ${escapeHtml(e.startDate)} – ${escapeHtml(e.endDate||'Present')}</p><p>${escapeHtml(e.description)}</p>${e.contribution?'<p><b>Contribution:</b> '+escapeHtml(e.contribution)+'</p>':''}${e.outcome?'<p><b>Outcome / impact:</b> '+escapeHtml(e.outcome)+'</p>':''}${e.learning?'<p><b>Learning reflection:</b> '+escapeHtml(e.learning)+'</p>':''}<small><b>Skills:</b> ${escapeHtml((e.skills||[]).join(', ')||'Not listed')}</small><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-outline btn-small" data-edit-experience="${escapeHtml(e.id)}">Edit record</button><button class="btn btn-outline btn-small" data-delete-experience="${escapeHtml(e.id)}">Remove record</button></div></div></article>`).join(''):'<div class="empty-state">No experience added yet.</div>'}</section>`,'/app/experience');}
export function evidencePage(){
 const d=getData();
 const types=[...new Set(d.evidence.map(e=>e.type).filter(Boolean))].sort();
 const sizeLabel=n=>{if(!n)return '';return n<1024? n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';};
 const records=d.evidence.map(e=>{
  const exp=d.experiences.find(x=>x.id===e.experienceId);
  const linked=d.competencies.filter(c=>(c.evidenceIds||[]).includes(e.id));
  const status=e.status||'Self-reported';
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
  <div><strong>${d.evidence.filter(e=>(e.status||'Self-reported').toLowerCase()==='self-reported').length}</strong><span>Self-reported records</span></div>
 </section>
 <section class="panel evidence-repository-panel">
  <div class="panel-head"><div><h2>Evidence repository</h2><p id="evidenceResultCount" aria-live="polite">${d.evidence.length} record(s)</p></div>${btn('Add evidence','addEvidence')}</div>
  ${d.evidence.length?`<div class="evidence-filters">
   <label>Search records<input type="search" id="evidenceSearch" placeholder="Search title, source, description..."></label>
   <label>Evidence type<select id="evidenceTypeFilter"><option value="">All types</option>${types.map(t=>`<option value="${escapeHtml(t.toLowerCase())}">${escapeHtml(t)}</option>`).join('')}</select></label>
   <label>Status<select id="evidenceStatusFilter"><option value="">All statuses</option><option value="self-reported">Self-reported</option><option value="reference-confirmed">Reference-confirmed</option><option value="ai-analysed">AI-analysed</option><option value="assessor-reviewed">Assessor-reviewed</option><option value="independently verified">Independently verified</option></select></label>
  </div><div class="evidence-card-list">${records}</div><p id="evidenceNoResults" class="empty-state" hidden>No records match these filters. Try changing your search or filters.</p>`:'<div class="empty-state">No evidence records yet. Add your first supporting item to begin.</div>'}
  <p class="helper-text">Attachments are stored in this browser on this device (up to 5 MB each). They are not uploaded to a server or independently verified. Keep your original documents in a safe location.</p>
 </section>`;
 return simplePage('My evidence','Organise, search and review the materials that support your experience and competency claims.',content,'/app/evidence');
}
export function competenciesPage(){
 const d=getData();
 const body=`<div class="notice"><b>How suggestions are generated:</b> PriorProof uses the skill names you enter in experience records and a small, transparent set of category/alias rules. It does not use AI to assess you. Review every suggestion and edit your experience if a skill is inaccurate. Evidence links are user-selected and do not verify competence.</div>
 <div class="competency-grid">${d.competencies.map(c=>{
  const linked=(c.evidenceIds||[]).map(id=>d.evidence.find(e=>e.id===id)).filter(Boolean);
  const experience=(c.experienceIds||[]).map(id=>d.experiences.find(e=>e.id===id)).filter(Boolean);
  const reasons=experience.flatMap(e=>(e.skills||[]).filter(skill=>skillDefinition(skill).name.toLowerCase()===c.name.toLowerCase()).map(skill=>({skill,experience:e.title})));
  const options=d.evidence.filter(e=>!linked.some(item=>item.id===e.id));
  return `<article class="panel competency-card competency-map-card">
   <span class="eyebrow">${escapeHtml(c.category||'General')}</span><h3>${escapeHtml(c.name)}</h3>
   <p>${experience.length} linked experience(s) · ${linked.length} supporting evidence item(s)</p>
   <span class="pill">${escapeHtml(c.status||'Suggested')}</span>
   <div class="mapping-block"><b>Why this was suggested</b>${reasons.length?reasons.map(reason=>`<small>You listed “${escapeHtml(reason.skill)}” in “${escapeHtml(reason.experience)}”.</small>`).join(''):'<small>This is an existing competency record. Edit a linked experience and include the relevant skill to show its source here.</small>'}</div>
   <div class="mapping-block"><b>Linked experience</b>${experience.length?experience.map(e=>`<small>${escapeHtml(e.title)}${e.contribution?' — '+escapeHtml(e.contribution):''}</small>`).join(''):'<small>No experience linked.</small>'}</div>
   <div class="mapping-block"><b>Supporting evidence</b>${linked.length?linked.map(item=>`<div class="mapping-evidence"><span>${escapeHtml(item.title)} <small>· ${escapeHtml(item.status||'Self-reported')}</small></span><button type="button" class="btn btn-outline btn-small" data-unlink-evidence="${escapeHtml(c.id)}" data-evidence-id="${escapeHtml(item.id)}">Unlink</button></div>`).join(''):'<small>No evidence linked yet.</small>'}</div>
   ${options.length?`<form class="mapping-form" data-map-form="${escapeHtml(c.id)}"><label for="map-${escapeHtml(c.id)}">Add supporting evidence</label><select id="map-${escapeHtml(c.id)}" name="evidenceId" required><option value="">Choose an evidence item</option>${options.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('')}</select><button class="btn btn-primary btn-small" type="submit">Link evidence</button></form>`:'<p class="helper-text">No unlinked evidence items available.</p>'}
  </article>`;
 }).join('')||'<div class="empty-state">No competency suggestions yet. Add experience with skills to begin.</div>'}</div>`;
 return simplePage('Competencies','Explore skills suggested from your own experience records, understand their source and manage supporting evidence.',body,'/app/competencies');
}
export function gapPage(){
 const d=getData();
 const rows=d.competencies.map(c=>{
  const items=(c.evidenceIds||[]).map(id=>d.evidence.find(e=>e.id===id)).filter(Boolean);
  const reviewed=items.filter(e=>['assessor-reviewed','assessor reviewed'].includes(String(e.status||'').toLowerCase())).length;
  const independentlyVerified=items.filter(e=>['independently verified','independently-verified'].includes(String(e.status||'').toLowerCase())).length;
  const experienceIds=new Set(c.experienceIds||[]);
  const unrelated=items.filter(e=>e.experienceId&&!experienceIds.has(e.experienceId));
  return {competency:c,items,reviewed,independentlyVerified,unrelated};
 });
 const total=rows.length,withEvidence=rows.filter(r=>r.items.length).length,missing=total-withEvidence;
 const selfReported=rows.filter(r=>r.items.length&&!r.reviewed&&!r.independentlyVerified).length;
 const reviewedCount=rows.filter(r=>r.reviewed).length,verifiedCount=rows.filter(r=>r.independentlyVerified).length;
 const pct=total?Math.round(withEvidence/total*100):0;
 const cards=rows.map(({competency:c,items,reviewed,independentlyVerified,unrelated})=>{
  let recommendation='';
  if(!items.length) recommendation='Add a relevant work sample, activity record, training output or reference. You can add evidence from the Evidence page.';
  else if(!reviewed&&!independentlyVerified) recommendation='Your linked items are currently user-submitted. Consider adding a reference or seeking feedback from an authorised reviewer where available.';
  else if(!independentlyVerified) recommendation='Review the feedback available and check whether an appropriate independent recognition or verification route exists.';
  else recommendation='Keep the original supporting records and check that the verification scope matches the skill being claimed.';
  return `<article class="panel gap-card">
   <div class="gap-card-head"><div><span class="eyebrow">${escapeHtml(c.category||'General')}</span><h3>${escapeHtml(c.name)}</h3></div><span class="pill ${items.length?'':'pending'}">${items.length?'Evidence linked':'No evidence linked'}</span></div>
   <div class="gap-metrics"><span><b>${items.length}</b> linked item(s)</span><span><b>${reviewed}</b> assessor-reviewed</span><span><b>${independentlyVerified}</b> independently verified</span></div>
   <div class="gap-evidence-list"><b>Evidence register</b>
    ${items.length?items.map(e=>`<div class="gap-evidence-row"><div><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.type||'Supporting material')}${e.fileName?' · File attached':''}</small></div><span class="pill">${escapeHtml(e.status||'Self-reported')}</span></div>`).join(''):'<p class="muted">No evidence is currently linked to this competency.</p>'}
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
   <div><strong>${selfReported}</strong><span>Only user-submitted evidence</span></div>
   <div><strong>${reviewedCount}</strong><span>Have assessor-reviewed items</span></div>
   <div><strong>${verifiedCount}</strong><span>Have independently verified items</span></div>
  </div>
  <p class="gap-disclaimer"><b>How to read this:</b> An uploaded file or a user-selected evidence link does not establish authenticity or competence. “Assessor-reviewed” and “independently verified” are shown only when the record has that status; PriorProof does not perform those reviews in this prototype.</p>
 </section>
 <div class="gap-section-heading"><div><h2>Competency-by-competency review</h2><p>Use these suggestions to decide what to strengthen next.</p></div><a href="/app/competencies" data-link>Manage evidence links →</a></div>
 <div class="gap-card-list">${cards||'<section class="panel empty-state"><h3>No competency suggestions yet</h3><p>Add experience records and list the skills you developed. PriorProof will create preliminary suggestions for you to review.</p><a class="btn btn-primary" href="/app/experience" data-link>Go to experience</a></section>'}</div>`;
 return simplePage('Gap analysis','See which competency suggestions have supporting material and where more documentation may help.',content,'/app/gap-analysis');
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
   <div class="portfolio-contact">${d.user.email?`<span>${escapeHtml(d.user.email)}</span>`:''}${d.user.location?`<span>${escapeHtml(d.user.location)}</span>`:''}</div>
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
    ${evidenceFor(e.id).length?evidenceFor(e.id).map(item=>`<div class="portfolio-evidence-item"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.type)} · ${escapeHtml(item.status||'Self-reported')}${item.fileName?' · File attached: '+escapeHtml(item.fileName):' · Description only'}</small></div>`).join(''):'<p>No evidence linked to this experience.</p>'}
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
   ${d.evidence.length?`<div class="portfolio-evidence-register">${d.evidence.map(item=>`<div class="portfolio-evidence-item"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.type)} · ${escapeHtml(item.status||'Self-reported')} · ${escapeHtml(d.experiences.find(e=>e.id===item.experienceId)?.title||'Not linked to an experience')}${item.fileName?' · '+escapeHtml(item.fileName):' · No file attached'}</small>${item.description?`<p>${escapeHtml(item.description)}</p>`:''}</div>`).join('')}</div>`:'<p>No evidence records have been added.</p>'}
  </section>
  <p class="portfolio-attachment-note">Attachment note: this PDF lists attached filenames where available. Original files remain separately stored in this browser and are not embedded in the exported PDF.</p>
  <footer class="portfolio-footer"><p>Prepared using PriorProof · Your skills deserve recognition.</p><p>Generated on ${new Date().toLocaleDateString()} · Information is user-submitted unless otherwise stated.</p></footer>
  <button class="btn btn-primary no-print portfolio-print" id="printPortfolio">Print / Save as PDF</button>
 </section>`;
 return simplePage('My portfolio','A structured, printable record of your experience, skills and supporting evidence.',readinessPanel+content,'/app/portfolio');
}
export function assessmentsPage(){
 const d=getData(),packs=Array.isArray(d.assessments)?d.assessments:[];
 const options=d.competencies.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
 const evidence=d.evidence.map(e=>`<label class="review-evidence-option"><input type="checkbox" name="evidenceIds" value="${escapeHtml(e.id)}"><span><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.type)} · ${escapeHtml(e.status||'Self-reported')}</small></span></label>`).join('');
 const cards=packs.map(p=>{const c=d.competencies.find(x=>x.id===p.competencyId);const items=(p.evidenceIds||[]).map(id=>d.evidence.find(x=>x.id===id)).filter(Boolean);return `<article class="panel review-pack-card"><span class="pill">Prepared · Not submitted</span><h3>${escapeHtml(c?.name||p.competencyName||'Competency unavailable')}</h3><small>Created ${escapeHtml(p.createdAt?new Date(p.createdAt).toLocaleString():'Date not recorded')} · ${items.length} evidence item(s)</small><p>${escapeHtml(p.context||'No reviewer context added.')}</p><div class="review-pack-actions"><button class="btn btn-secondary" type="button" data-export-review-pack="${escapeHtml(p.id)}">Download review brief</button><button class="btn btn-danger" type="button" data-delete-review-pack="${escapeHtml(p.id)}">Delete</button></div><p class="helper-text">This pack has not been sent to or reviewed by an external assessor.</p></article>`;}).join('');
 const content=`<section class="panel review-intro"><span class="eyebrow">REVIEW PREPARATION</span><h2>Prepare an evidence review pack</h2><p>Select a suggested competency and relevant evidence for an authorised reviewer to consider. This prototype saves the pack locally; it does not submit it or verify claims.</p></section>
 ${d.competencies.length?`<section class="panel"><h2>New review pack</h2><form id="reviewPackForm" class="review-pack-form"><label>Competency<select name="competencyId" required><option value="">Select a competency</option>${options}</select></label><fieldset><legend>Evidence to include</legend><p class="helper-text">Select only evidence that genuinely relates to this competency.</p>${evidence||'<p>No evidence records yet. You may still prepare a pack.</p>'}</fieldset><label>Context for reviewer (optional)<textarea name="context" rows="4" maxlength="1200" placeholder="Explain what you would like the reviewer to consider."></textarea></label><button class="btn btn-primary" type="submit">Save review pack</button></form></section>`:'<section class="panel"><p>Add experience records and review your competency suggestions before preparing a pack.</p><a href="/app/experience" data-link>Go to experience</a></section>'}
 <section class="review-packs-section"><div class="panel-head"><div><h2>Prepared review packs</h2><p>${packs.length} locally saved pack(s)</p></div></div>${cards||'<section class="panel empty-state"><h3>No review packs prepared</h3><p>Your saved preparation packs will appear here.</p></section>'}</section>`;
 return simplePage('Assessments','Prepare evidence for review and track what is ready to share.',content,'/app/assessments');
}
export function settingsPage(){return simplePage('Settings','Manage your demonstration workspace.',`<section class="panel"><h2>Backup and restore</h2><p class="muted">Create a portable JSON backup of your profile, experience, evidence records and competency links.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" id="exportData">Export backup (JSON)</button><label class="btn btn-outline" for="importDataFile" style="cursor:pointer">Choose backup to restore</label><input id="importDataFile" type="file" accept=".json,application/json" hidden></div><p class="helper-text">Restore replaces the data currently stored in this browser. Export your current data first if you may need it. Attachments are stored separately in this browser and are not included in JSON backups; restoring a backup clears local attachment files, so keep original files elsewhere.</p><p class="helper-text">Your data remains on this device in this prototype. There is no cloud sync or multi-device recovery.</p></section><section class="panel" style="margin-top:18px"><h2>Reset demonstration data</h2><p class="muted">Restore the original example workspace in this browser.</p><button class="btn btn-outline" id="resetDemo">Reset demonstration data</button><p class="helper-text">Resetting removes changes made in this browser and clears locally stored evidence attachments.</p></section>`,'/app/settings');}
export function helpPage(){return simplePage('Help & support','A few notes to help you use the PriorProof prototype.',`<section class="panel"><h3>What is PriorProof?</h3><p>It helps people document experience, organise supporting evidence and prepare competency portfolios.</p><h3>Does PriorProof certify my skills?</h3><p>No. It helps organise information. Formal recognition depends on relevant standards and authorised assessment processes.</p><h3>Where is my data stored?</h3><p>In this starter prototype, data is stored in the browser on this device.</p></section>`,'/app/help');}
export function authPage(mode){return `<div class="auth-layout"><div class="auth-brand"><a href="/" data-link><img src="/logo.svg" alt="PriorProof"></a><div><span class="eyebrow light">YOUR EXPERIENCE MATTERS</span><h1>Make your skills visible.</h1><p>Document your journey. Connect your evidence. Build your portfolio.</p></div><small>PriorProof · Your skills deserve recognition.</small></div><div class="auth-form-wrap"><div class="auth-top-tools"><a class="back-home" href="/" data-link>← Back to homepage</a><button class="theme-toggle" type="button" data-theme-toggle>◐ <span>Dark mode</span></button></div><form id="authForm" class="auth-form" novalidate><span class="eyebrow">${mode==='login'?'WELCOME BACK':'GET STARTED'}</span><h2>${mode==='login'?'Sign in to PriorProof':'Create your account'}</h2><p class="muted">${mode==='login'?'Access your personal workspace.':'Start documenting your experience and skills.'}</p>${mode==='register'?'<label>Full name<input name="fullName" autocomplete="name" required placeholder="Your full name"></label>':''}<label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<div class="password-wrap"><input id="authPassword" name="password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" required minlength="8" placeholder="Enter your password"><button type="button" class="password-toggle" id="togglePassword" aria-label="Show password">Show</button></div></label>${mode==='register'?'<label>Confirm password<div class="password-wrap"><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="Re-enter your password"><button type="button" class="password-toggle" id="toggleConfirmPassword" aria-label="Show confirmation password">Show</button></div></label><label class="auth-check"><input type="checkbox" name="terms" required><span>I agree to the Terms of Use and acknowledge the Privacy Notice.</span></label>':'<div class="auth-options"><label class="auth-check"><input type="checkbox" name="remember"><span>Remember me</span></label><button type="button" class="text-link" id="forgotPassword">Forgot password?</button></div>'}<p class="auth-feedback" id="authFeedback" role="status" aria-live="polite"></p><button class="btn btn-primary full-btn" type="submit">${mode==='login'?'Sign in':'Create account'} →</button><div class="auth-divider"><span>OR CONTINUE WITH</span></div><button type="button" class="google-button" id="googleSignIn"><svg class="google-logo" viewBox="0 0 48 48" role="img" aria-label="Google"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.8 27.7a12 12 0 0 1 0-7.4V15H5.9a20 20 0 0 0 0 18z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.9 15l6.9 5.3c1.6-4.7 6-8.2 11.2-8.2z"/></svg> Continue with Google</button><div class="auth-switch">${mode==='login'? 'New to PriorProof? <a href="/register" data-link>Create an account</a>':'Already registered? <a href="/login" data-link>Sign in</a>'}</div><button type="button" class="demo-button" id="demoLogin">Enter demonstration workspace</button><p class="helper-text">Prototype mode: email and Google authentication are not connected yet. Do not enter a real or reused password. The Terms of Use and Privacy Notice must be published before account registration is enabled.</p></form></div></div>`;}
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
  dialog.querySelector('#entryNote').textContent=(editRecord?'Update the record details.':'Optional PDF, image, Word or text files up to 5 MB are saved locally in this browser. Files are not uploaded to a server or verified. Evidence is initially marked self-reported.')+(editRecord&&editRecord.fileName?' Existing attachment: '+editRecord.fileName+'. Choose a new file only if you want to replace it.':'');
  if(editRecord){const form=dialog.querySelector('#entryForm');['title','type','experienceId','source','evidenceDate','description'].forEach(name=>{const field=form.elements.namedItem(name);if(field)field.value=editRecord[name]||'';});}
 }
 document.body.appendChild(dialog);
 const close=()=>{dialog.close();dialog.remove();};
 dialog.querySelector('#closeEntry').addEventListener('click',close);
 dialog.querySelector('#cancelEntry').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 dialog.querySelector('form').addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget),d=getData();
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
   if(file&&file.size){try{await saveEvidenceFile(evId,file);}catch(error){alert(error.message||'The file could not be saved.');return;}}
   const hasNewFile=Boolean(file&&file.size);
   const ev={id:evId,title:String(f.get('title')).trim(),type:f.get('type'),experienceId:f.get('experienceId')||null,source:String(f.get('source')||'').trim(),evidenceDate:f.get('evidenceDate')||'',description:String(f.get('description')||'').trim(),status:editRecord?.status||'Self-reported',fileId:hasNewFile?evId:(editRecord?.fileId||null),fileName:hasNewFile?file.name:(editRecord?.fileName||''),fileSize:hasNewFile?file.size:(editRecord?.fileSize||0),fileType:hasNewFile?file.type:(editRecord?.fileType||'')};
   if(editRecord){const index=d.evidence.findIndex(item=>item.id===editRecord.id);if(index>=0)d.evidence[index]=ev;}else d.evidence.unshift(ev);
   // Rebuild this evidence item's competency links when its related experience changes.
   d.competencies.forEach(c=>{c.evidenceIds=(c.evidenceIds||[]).filter(id=>id!==ev.id);if(ev.experienceId&&(c.experienceIds||[]).includes(ev.experienceId))c.evidenceIds=[...new Set([...(c.evidenceIds||[]),ev.id])];});
  }
  saveData(d);close();window.dispatchEvent(new PopStateEvent('popstate'));
 });
 dialog.showModal();
}
export function bindAppActions(){
 document.getElementById('printPortfolio')?.addEventListener('click',()=>window.print());
 document.getElementById('profileForm')?.addEventListener('submit',e=>{e.preventDefault();const d=getData(),f=new FormData(e.currentTarget);d.user={...d.user,fullName:String(f.get('fullName')).trim(),email:String(f.get('email')).trim(),targetOccupation:String(f.get('targetOccupation')).trim(),location:String(f.get('location')).trim(),summary:String(f.get('summary')||'').trim(),interests:String(f.get('interests')||'').trim()};saveData(d);});
 document.getElementById('resetDemo')?.addEventListener('click',async()=>{if(confirm('Reset all PriorProof demonstration data in this browser?')){try{await clearEvidenceFiles();resetData();navigate('/app/dashboard');}catch(error){alert(error.message||'Could not reset local files.');}}});
 document.getElementById('exportData')?.addEventListener('click',()=>{const backup={app:'PriorProof',schemaVersion:1,exportedAt:new Date().toISOString(),data:getData()};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='priorproof-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);});
 document.getElementById('importDataFile')?.addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>10*1024*1024)throw new Error('The backup file is larger than 10 MB.');const parsed=JSON.parse(await file.text()),candidate=parsed?.app==='PriorProof'?parsed.data:parsed;if(parsed?.app&&parsed.app!=='PriorProof')throw new Error('This file is not a PriorProof backup.');if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||!candidate.user||typeof candidate.user!=='object'||!Array.isArray(candidate.experiences)||!Array.isArray(candidate.evidence)||!Array.isArray(candidate.competencies))throw new Error('The file structure is not a valid PriorProof backup.');for(const [name,items] of [['experience',candidate.experiences],['evidence',candidate.evidence],['competency',candidate.competencies]]){const ids=new Set();for(const item of items){if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id.trim())throw new Error('A '+name+' record is missing a valid ID.');if(ids.has(item.id))throw new Error('The backup contains duplicate '+name+' IDs.');ids.add(item.id);}}const counts=candidate.experiences.length+' experience record(s), '+candidate.evidence.length+' evidence record(s) and '+candidate.competencies.length+' competency suggestion(s)';if(!confirm('Restore this backup? It contains '+counts+'. This will replace the current workspace data and clear locally stored attachment files. Attachments are not included in JSON backups. Continue?'))return;const restored={...candidate,user:{...candidate.user},experiences:candidate.experiences.map(item=>({...item,skills:Array.isArray(item.skills)?item.skills:[]})),evidence:candidate.evidence.map(item=>({...item,fileId:null,fileName:'',fileSize:0,fileType:''})),competencies:candidate.competencies.map(item=>({...item,experienceIds:Array.isArray(item.experienceIds)?item.experienceIds:[],evidenceIds:Array.isArray(item.evidenceIds)?item.evidenceIds:[]}))};await clearEvidenceFiles();saveData(restored);alert('Backup restored. Your profile and records have been loaded. Evidence attachment files were not included and must be added again from your originals.');navigate('/app/dashboard');}catch(error){alert(error.message||'Could not restore this backup.');}finally{event.target.value='';}});
 document.querySelectorAll('[data-edit-experience]').forEach(button=>button.addEventListener('click',()=>openEntryDialog('experience',button.dataset.editExperience)));
 document.querySelectorAll('[data-delete-experience]').forEach(button=>button.addEventListener('click',async()=>{if(!confirm('Remove this experience and its linked evidence records?'))return;const d=getData(),id=button.dataset.deleteExperience;d.experiences=d.experiences.filter(e=>e.id!==id);const removed=d.evidence.filter(e=>e.experienceId===id);for(const item of removed){if(item.fileId)await deleteEvidenceFile(item.fileId);}const removedIds=removed.map(e=>e.id);d.evidence=d.evidence.filter(e=>e.experienceId!==id);d.competencies.forEach(c=>{c.experienceIds=(c.experienceIds||[]).filter(x=>x!==id);c.evidenceIds=(c.evidenceIds||[]).filter(x=>!removedIds.includes(x));c.sourceSkills=[...new Set(d.experiences.filter(x=>(c.experienceIds||[]).includes(x.id)).flatMap(x=>x.skills||[]).filter(skill=>skillDefinition(skill).name.toLowerCase()===skillDefinition(c.name).name.toLowerCase()))];});d.competencies=d.competencies.filter(c=>(c.experienceIds||[]).length||(c.evidenceIds||[]).length);d.assessments=(d.assessments||[]).map(p=>({...p,evidenceIds:(p.evidenceIds||[]).filter(x=>!removedIds.includes(x))}));saveData(d);}));
 document.querySelectorAll('[data-edit-evidence]').forEach(button=>button.addEventListener('click',()=>openEntryDialog('evidence',button.dataset.editEvidence)));
 document.querySelectorAll('[data-delete-evidence]').forEach(button=>button.addEventListener('click',async()=>{if(!confirm('Remove this evidence record?'))return;const d=getData(),id=button.dataset.deleteEvidence,item=d.evidence.find(e=>e.id===id);if(item?.fileId)await deleteEvidenceFile(item.fileId);d.evidence=d.evidence.filter(e=>e.id!==id);d.competencies.forEach(c=>c.evidenceIds=(c.evidenceIds||[]).filter(x=>x!==id));d.assessments=(d.assessments||[]).map(p=>({...p,evidenceIds:(p.evidenceIds||[]).filter(x=>x!==id)}));d.competencies=d.competencies.filter(c=>(c.experienceIds||[]).length||(c.evidenceIds||[]).length);saveData(d);}));
 document.querySelectorAll('[data-map-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const d=getData(),competency=d.competencies.find(c=>c.id===form.dataset.mapForm),evidenceId=new FormData(form).get('evidenceId');if(!competency||!evidenceId)return;const item=d.evidence.find(x=>x.id===evidenceId);if(!item)return;competency.evidenceIds=[...new Set([...(competency.evidenceIds||[]),evidenceId])];saveData(d);}));
 document.querySelectorAll('[data-unlink-evidence]').forEach(button=>button.addEventListener('click',()=>{const d=getData(),competency=d.competencies.find(c=>c.id===button.dataset.unlinkEvidence);if(!competency)return;competency.evidenceIds=(competency.evidenceIds||[]).filter(id=>id!==button.dataset.evidenceId);saveData(d);}));
 const evidenceSearch=document.getElementById('evidenceSearch'),evidenceType=document.getElementById('evidenceTypeFilter'),evidenceStatus=document.getElementById('evidenceStatusFilter');
 if(evidenceSearch&&evidenceType&&evidenceStatus){
  const cards=[...document.querySelectorAll('[data-evidence-card]')],count=document.getElementById('evidenceResultCount'),empty=document.getElementById('evidenceNoResults');
  const applyEvidenceFilters=()=>{const q=evidenceSearch.value.trim().toLowerCase(),type=evidenceType.value,status=evidenceStatus.value;let visible=0;cards.forEach(card=>{const match=card.textContent.toLowerCase().includes(q)&&(!type||card.dataset.evidenceType===type)&&(!status||card.dataset.evidenceStatus===status);card.hidden=!match;if(match)visible++;});if(count)count.textContent=visible+' of '+cards.length+' record(s)';if(empty)empty.hidden=visible!==0;};
  evidenceSearch.addEventListener('input',applyEvidenceFilters);evidenceType.addEventListener('change',applyEvidenceFilters);evidenceStatus.addEventListener('change',applyEvidenceFilters);
 }
 document.querySelectorAll('[data-download-evidence]').forEach(button=>button.addEventListener('click',async()=>{try{const file=await getEvidenceFile(button.dataset.downloadEvidence);if(!file){alert('The file is not available in this browser.');return;}const url=URL.createObjectURL(file.blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(error){alert(error.message||'Could not retrieve the file.');}}));

 document.querySelectorAll('#addExperience').forEach(button=>button.addEventListener('click',()=>openEntryDialog('experience')));
 document.querySelectorAll('#addEvidence').forEach(button=>button.addEventListener('click',()=>openEntryDialog('evidence')));
 const reviewPackForm=document.getElementById('reviewPackForm');
 reviewPackForm?.addEventListener('submit',event=>{event.preventDefault();const d=getData(),f=new FormData(reviewPackForm),c=d.competencies.find(x=>x.id===f.get('competencyId'));if(!c)return;d.assessments=Array.isArray(d.assessments)?d.assessments:[];d.assessments.unshift({id:crypto.randomUUID(),competencyId:c.id,competencyName:c.name,evidenceIds:f.getAll('evidenceIds').filter(id=>d.evidence.some(x=>x.id===id)),context:String(f.get('context')||'').trim(),status:'Prepared - not submitted',createdAt:new Date().toISOString()});saveData(d);});
 document.querySelectorAll('[data-delete-review-pack]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Delete this review preparation record?'))return;const d=getData();d.assessments=(d.assessments||[]).filter(x=>x.id!==b.dataset.deleteReviewPack);saveData(d);}));
 document.querySelectorAll('[data-export-review-pack]').forEach(b=>b.addEventListener('click',()=>{const d=getData(),p=(d.assessments||[]).find(x=>x.id===b.dataset.exportReviewPack);if(!p)return;const c=d.competencies.find(x=>x.id===p.competencyId),items=(p.evidenceIds||[]).map(id=>d.evidence.find(x=>x.id===id)).filter(Boolean);const lines=['PRIORPROOF — EVIDENCE REVIEW BRIEF','Prepared by: '+(d.user.fullName||'Not provided'),'Competency: '+(c?.name||p.competencyName||'Not available'),'Created: '+p.createdAt,'','SELECTED EVIDENCE',...items.map(x=>'- '+x.title+' | '+x.type+' | '+(x.status||'Self-reported')),'','CONTEXT',p.context||'None provided','','LIMITATIONS','Prepared from user-entered information. Not authenticated, assessed, awarded or submitted by PriorProof.'];const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='priorproof-review-brief.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}));

}