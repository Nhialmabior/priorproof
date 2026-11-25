import { navigate } from '../utils/router.js';

let syncStatusListenerBound = false;
let syncStatusHideTimer = null;
const avatarMarkup = user => user.profilePhoto ? `<img src="${escapeHtml(user.profilePhoto)}" alt="Profile photo">` : escapeHtml((user.fullName||'A').slice(0,1).toUpperCase());
export function publicNav(active = '') {
  return `<header class="public-nav"><a class="brand" href="/" data-link><img src="/logo.svg" alt="PriorProof"></a>
  <div class="nav-tools"><button class="theme-toggle public-theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">◐ <span>Dark mode</span></button><button class="mobile-menu" type="button" aria-label="Open navigation" aria-controls="publicLinks" aria-expanded="false" id="mobileMenu">☰</button></div>
  <nav id="publicLinks" aria-label="Main navigation"><a class="${active==='home'?'active':''}" href="/" data-link>Home</a><a class="${active==='how'?'active':''}" href="/how-it-works" data-link>How it works</a><a class="${active==='about'?'active':''}" href="/about" data-link>About</a><a class="nav-login" href="/login" data-link>Sign in</a><a class="btn btn-primary btn-small" href="/register" data-link>Get started</a></nav></header>`;
}
const menu = [
  ['Overview','/app/dashboard','▦'],['Experience','/app/experience','▤'],['Evidence','/app/evidence','▧'],
  ['Skills','/app/competencies','◇'],['Skills review','/app/gap-analysis','⌁'],['Portfolio','/app/portfolio','▣'],
  ['Review packs','/app/assessments','✓']
];
const routeLabels={'/app/dashboard':'Overview','/app/profile':'Profile','/app/experience':'Experience','/app/evidence':'Evidence','/app/competencies':'Skills','/app/gap-analysis':'Skills review','/app/portfolio':'Portfolio','/app/assessments':'Review packs','/app/settings':'Settings','/app/help':'Help & support'};
export function appShell(content, active = '/app/dashboard', user = {}) {
  return `<div class="app-layout"><aside class="sidebar" id="sidebar"><a href="/" data-link class="side-brand" aria-label="PriorProof home"><img src="/logo.svg" alt="PriorProof"></a><nav class="side-navigation" aria-label="Workspace navigation">
  <div class="side-label">WORKSPACE</div>
  ${menu.slice(0,3).map(item=>'<a class="side-link '+(active===item[1]?'selected':'')+'" href="'+item[1]+'" data-link aria-current="'+(active===item[1]?'page':'false')+'"><span class="side-icon" aria-hidden="true">'+item[2]+'</span><span>'+item[0]+'</span></a>').join('')}
  <div class="side-label">SKILLS &amp; PORTFOLIO</div>
  ${menu.slice(3,6).map(item=>'<a class="side-link '+(active===item[1]?'selected':'')+'" href="'+item[1]+'" data-link aria-current="'+(active===item[1]?'page':'false')+'"><span class="side-icon" aria-hidden="true">'+item[2]+'</span><span>'+item[0]+'</span></a>').join('')}
  <div class="side-label">REVIEW</div>
  ${menu.slice(6).map(item=>'<a class="side-link '+(active===item[1]?'selected':'')+'" href="'+item[1]+'" data-link aria-current="'+(active===item[1]?'page':'false')+'"><span class="side-icon" aria-hidden="true">'+item[2]+'</span><span>'+item[0]+'</span></a>').join('')}
  </nav>
  <div class="side-bottom"><div class="side-label">PREFERENCES</div><a class="side-link ${active==='/app/settings'?'selected':''}" href="/app/settings" data-link><span class="side-icon">⚙</span>Settings</a><a class="side-link" href="/app/help" data-link><span class="side-icon">?</span>Help & support</a></div></aside>
  <main class="app-main"><header class="app-topbar"><button class="icon-btn" id="sidebarToggle" type="button" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">☰</button><div class="crumb">Workspace <span>/</span> ${routeLabels[active]||active.split('/').pop().replaceAll('-',' ')}</div><div class="top-actions"><span class="sync-status" id="workspaceSyncStatus" data-status="saved" role="status" aria-live="polite" title="Workspace changes sync to your account" hidden>✓ <span>Changes saved</span></span><button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">◐ <span>Theme</span></button><button class="btn btn-outline btn-small" type="button" id="signOutButton">Sign out</button><div class="account-menu-wrap"><button class="avatar small account-trigger" id="accountMenuToggle" type="button" aria-label="Open account menu" aria-expanded="false">${avatarMarkup(user)}</button><div class="account-menu" id="accountMenu" hidden><div class="account-menu-profile"><div class="avatar account-menu-avatar">${avatarMarkup(user)}</div><div><strong>${escapeHtml(user.fullName||'Your account')}</strong><small>${escapeHtml(user.email||'')}</small></div></div><div class="account-menu-details"><span>Phone</span><b>${escapeHtml(user.phoneNumber||'Not added')}</b><span>Location</span><b>${escapeHtml(user.location||'Not added')}</b></div><a href="/app/profile" data-link>View and edit profile <span>→</span></a><button type="button" class="account-menu-signout" id="accountMenuSignOut">Sign out</button></div></div></div></header><section class="app-content">${content}</section></main></div>`;
}
export function bindLayout() {
  if (!syncStatusListenerBound) {
    window.addEventListener('priorproof:sync-status', event => {
      const indicator = document.getElementById('workspaceSyncStatus');
      if (!indicator) return;
      const status = event.detail?.status || 'saved';
      const labels = {
        saving: ['◌', 'Saving changes…'],
        saved: ['✓', 'Changes saved'],
        error: ['!', 'Sync issue']
      };
      const [symbol, label] = labels[status] || labels.saved;
      if (syncStatusHideTimer) {
        window.clearTimeout(syncStatusHideTimer);
        syncStatusHideTimer = null;
      }
      indicator.hidden = false;
      indicator.dataset.status = status;
      indicator.textContent = symbol + ' ';
      const text = document.createElement('span');
      text.textContent = label;
      indicator.appendChild(text);
      indicator.title = status === 'error'
        ? (event.detail?.message || 'Your latest changes may not have reached the cloud. Check your connection and try again.')
        : 'Workspace changes sync to your account';
      // A successful save is a brief confirmation, not a permanent dashboard label.
      if (status === 'saved') {
        syncStatusHideTimer = window.setTimeout(() => {
          const current = document.getElementById('workspaceSyncStatus');
          if (current === indicator && current.dataset.status === 'saved') current.hidden = true;
          syncStatusHideTimer = null;
        }, 2200);
      }
    });
    syncStatusListenerBound = true;
  }
  document.querySelectorAll('[data-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.getAttribute('href'));}));
  const applyTheme=theme=>{document.documentElement.dataset.theme=theme;document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.innerHTML=theme==='dark'?'☀ <span>Light mode</span>':'◐ <span>Dark mode</span>';button.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');});};
  applyTheme(localStorage.getItem('priorproof-theme')==='dark'?'dark':'light');
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('priorproof-theme',next);applyTheme(next);}));
  const publicMenuButton=document.getElementById('mobileMenu');
  const publicLinks=document.getElementById('publicLinks');
  publicMenuButton?.addEventListener('click',()=>{const open=publicLinks?.classList.toggle('open')||false;publicMenuButton.setAttribute('aria-expanded',String(open));publicMenuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
  const sidebar=document.getElementById('sidebar');
  const sidebarToggle=document.getElementById('sidebarToggle');
  const appLayout=document.querySelector('.app-layout');
  const closeSidebar=()=>{sidebar?.classList.remove('open');appLayout?.classList.remove('sidebar-open');sidebarToggle?.setAttribute('aria-expanded','false');sidebarToggle?.setAttribute('aria-label','Open menu');};
  sidebarToggle?.addEventListener('click',()=>{const open=sidebar?.classList.toggle('open')||false;appLayout?.classList.toggle('sidebar-open',open);sidebarToggle.setAttribute('aria-expanded',String(open));sidebarToggle.setAttribute('aria-label',open?'Close menu':'Open menu');});
  // Close the drawer after choosing a destination or tapping the dimmed page area.
  document.addEventListener('click',event=>{
    if(!sidebar?.classList.contains('open'))return;
    if(event.target.closest('#sidebarToggle'))return;
    if(event.target.closest('#sidebar [data-link]')){closeSidebar();return;}
    if(event.target===appLayout)closeSidebar();
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSidebar();});
  const accountToggle=document.getElementById('accountMenuToggle'),accountMenu=document.getElementById('accountMenu');
  const closeAccountMenu=()=>{if(accountMenu){accountMenu.hidden=true;accountToggle?.setAttribute('aria-expanded','false');}document.removeEventListener('click',outsideAccountClick);};
  const outsideAccountClick=event=>{if(!accountMenu?.contains(event.target)&&!accountToggle?.contains(event.target))closeAccountMenu();};
  accountToggle?.addEventListener('click',event=>{event.stopPropagation();if(!accountMenu)return;accountMenu.hidden=!accountMenu.hidden;accountToggle.setAttribute('aria-expanded',String(!accountMenu.hidden));if(!accountMenu.hidden)document.addEventListener('click',outsideAccountClick);else document.removeEventListener('click',outsideAccountClick);});
  accountMenu?.addEventListener('click',event=>event.stopPropagation());
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAccountMenu();});
  document.getElementById('accountMenuSignOut')?.addEventListener('click',()=>document.getElementById('signOutButton')?.click());
}
export function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
