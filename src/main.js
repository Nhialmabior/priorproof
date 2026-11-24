import './styles/variables.css';
import './styles/global.css';
import './styles/public.css';
import './styles/dashboard.css';
import './styles/responsive.css';
import { currentRoute, navigate } from './utils/router.js';
import { bindLayout } from './components/layout.js';
import { homePage, aboutPage, howPage, privacyPage, termsPage } from './pages/public.js';
import { dashboardPage, profilePage, experiencePage, evidencePage, competenciesPage, gapPage, portfolioPage, assessmentsPage, settingsPage, helpPage, authPage, bindAppActions } from './pages/app.js';
import { getData, saveData } from './services/storage.js';

function render(){
 const route=currentRoute();let html;
 const pages={'/':homePage,'/about':aboutPage,'/how-it-works':howPage,'/privacy':privacyPage,'/terms':termsPage,'/app/dashboard':dashboardPage,'/app/profile':profilePage,'/app/experience':experiencePage,'/app/evidence':evidencePage,'/app/competencies':competenciesPage,'/app/gap-analysis':gapPage,'/app/portfolio':portfolioPage,'/app/assessments':assessmentsPage,'/app/settings':settingsPage,'/app/help':helpPage};
 if(route==='/login'||route==='/register')html=authPage(route==='/login'?'login':'register');
 else html=(pages[route]||homePage)();
 document.querySelector('#app').innerHTML=html;
 bindLayout();bindAppActions();
 document.getElementById('authForm')?.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form),feedback=document.getElementById('authFeedback');if(!form.reportValidity())return;if(route==='/register'&&f.get('password')!==f.get('confirmPassword')){feedback.textContent='Your passwords do not match. Please check and try again.';feedback.className='auth-feedback error';return;}if(route==='/register'&&!f.get('terms')){feedback.textContent='Please accept the Terms of Use and Privacy Notice to continue.';feedback.className='auth-feedback error';return;}feedback.textContent='Account authentication is not connected yet. Your details have not been submitted or saved. Use the demonstration workspace to explore the prototype.';feedback.className='auth-feedback';});
 document.getElementById('togglePassword')?.addEventListener('click',e=>{const field=document.getElementById('authPassword'),show=field.type==='password';field.type=show?'text':'password';e.currentTarget.textContent=show?'Hide':'Show';e.currentTarget.setAttribute('aria-label',show?'Hide password':'Show password');});
 document.getElementById('toggleConfirmPassword')?.addEventListener('click',e=>{const field=document.getElementById('confirmPassword'),show=field.type==='password';field.type=show?'text':'password';e.currentTarget.textContent=show?'Hide':'Show';e.currentTarget.setAttribute('aria-label',show?'Hide confirmation password':'Show confirmation password');});
 document.getElementById('forgotPassword')?.addEventListener('click',()=>{const feedback=document.getElementById('authFeedback');feedback.textContent='Password recovery will be available once secure email authentication is connected. No reset email has been sent.';feedback.className='auth-feedback';});
 document.getElementById('googleSignIn')?.addEventListener('click',()=>{const feedback=document.getElementById('authFeedback');feedback.textContent='Google sign-in is not configured yet. Connect an authentication provider before using this option.';feedback.className='auth-feedback';});
 document.getElementById('demoLogin')?.addEventListener('click',()=>navigate('/app/dashboard'));
}
window.addEventListener('popstate',render);
window.addEventListener('priorproof:data-updated',()=>{if(currentRoute().startsWith('/app/'))render();});
render();
