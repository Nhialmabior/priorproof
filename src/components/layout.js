import { navigate } from '../utils/router.js';
export function publicNav(active = '') {
  return `<header class="public-nav"><a class="brand" href="/" data-link><img src="/logo.svg" alt="PriorProof"></a>
  <div class="nav-tools"><button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">◐ <span>Theme</span></button><button class="mobile-menu" aria-label="Toggle navigation" id="mobileMenu">☰</button></div>
  <nav id="publicLinks"><a class="${active==='home'?'active':''}" href="/" data-link>Home</a><a class="${active==='how'?'active':''}" href="/how-it-works" data-link>How it works</a><a class="${active==='about'?'active':''}" href="/about" data-link>About</a><a class="nav-login" href="/login" data-link>Sign in</a><a class="btn btn-primary btn-small" href="/register" data-link>Get started</a></nav></header>`;
}
const menu = [
  ['Overview','/app/dashboard','▦'],['My Profile','/app/profile','◉'],['My Experience','/app/experience','▤'],['My Evidence','/app/evidence','▧'],['Competencies','/app/competencies','◇'],['Gap Analysis','/app/gap-analysis','⌁'],['My Portfolio','/app/portfolio','▣'],['Assessments','/app/assessments','✓']
];
export function appShell(content, active = '/app/dashboard', user = {}) {
  return `<div class="app-layout"><aside class="sidebar" id="sidebar"><a href="/app/dashboard" data-link class="side-brand"><img src="/logo.svg" alt="PriorProof"></a><div class="side-label">WORKSPACE</div>
  ${menu.map(([label,path,icon])=>`<a class="side-link ${active===path?'selected':''}" href="${path}" data-link><span class="side-icon">${icon}</span>${label}</a>`).join('')}
  <div class="side-bottom"><div class="side-label">PREFERENCES</div><a class="side-link ${active==='/app/settings'?'selected':''}" href="/app/settings" data-link><span class="side-icon">⚙</span>Settings</a><a class="side-link" href="/app/help" data-link><span class="side-icon">?</span>Help & support</a><div class="side-user"><div class="avatar">${(user.fullName||'A').slice(0,1).toUpperCase()}</div><div><strong>${escapeHtml(user.fullName||'Demo user')}</strong><small>Personal workspace</small></div></div></div></aside>
  <main class="app-main"><header class="app-topbar"><button class="icon-btn" id="sidebarToggle" aria-label="Open menu">☰</button><div class="crumb">Workspace <span>/</span> ${active.split('/').pop().replaceAll('-',' ')}</div><div class="top-actions"><button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">◐ <span>Theme</span></button><span class="demo-tag">DEMO WORKSPACE</span><div class="avatar small">${(user.fullName||'A').slice(0,1).toUpperCase()}</div></div></header><section class="app-content">${content}</section></main></div>`;
}
export function bindLayout() {
  document.querySelectorAll('[data-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.getAttribute('href'));}));
  const applyTheme=theme=>{document.documentElement.dataset.theme=theme;document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.innerHTML=theme==='dark'?'☀ <span>Light mode</span>':'◐ <span>Dark mode</span>';button.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');});};
  applyTheme(localStorage.getItem('priorproof-theme')==='dark'?'dark':'light');
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('priorproof-theme',next);applyTheme(next);}));
  document.getElementById('mobileMenu')?.addEventListener('click',()=>document.getElementById('publicLinks')?.classList.toggle('open'));
  document.getElementById('sidebarToggle')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
}
export function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
