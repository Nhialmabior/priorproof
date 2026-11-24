import './styles/variables.css';
import './styles/global.css';
import './styles/public.css';
import './styles/dashboard.css';
import './styles/responsive.css';
import { currentRoute, navigate } from './utils/router.js';
import { bindLayout } from './components/layout.js';
import { homePage, aboutPage, howPage } from './pages/public.js';
import { dashboardPage, profilePage, experiencePage, evidencePage, competenciesPage, gapPage, portfolioPage, assessmentsPage, settingsPage, helpPage, authPage, bindAppActions } from './pages/app.js';
import { getData, saveData } from './services/storage.js';

function render(){
 const route=currentRoute();let html;
 const pages={'/':homePage,'/about':aboutPage,'/how-it-works':howPage,'/app/dashboard':dashboardPage,'/app/profile':profilePage,'/app/experience':experiencePage,'/app/evidence':evidencePage,'/app/competencies':competenciesPage,'/app/gap-analysis':gapPage,'/app/portfolio':portfolioPage,'/app/assessments':assessmentsPage,'/app/settings':settingsPage,'/app/help':helpPage};
 if(route==='/login'||route==='/register')html=authPage(route==='/login'?'login':'register');
 else html=(pages[route]||homePage)();
 document.querySelector('#app').innerHTML=html;
 bindLayout();bindAppActions();
 document.getElementById('authForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),d=getData();if(route==='/register'){d.user.fullName=f.get('fullName');d.user.email=f.get('email');}else if(f.get('email'))d.user.email=f.get('email');saveData(d);navigate('/app/dashboard');});
 document.getElementById('demoLogin')?.addEventListener('click',()=>navigate('/app/dashboard'));
}
window.addEventListener('popstate',render);
window.addEventListener('priorproof:data-updated',()=>{if(currentRoute().startsWith('/app/'))render();});
render();
