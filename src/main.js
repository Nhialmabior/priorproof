import './styles/variables.css';
import './styles/global.css';
import './styles/public.css';
import './styles/dashboard.css';
import './styles/responsive.css';
import { currentRoute, navigate } from './utils/router.js';
import { bindLayout } from './components/layout.js';
import { homePage, aboutPage, howPage, privacyPage, termsPage } from './pages/public.js';
import { dashboardPage, profilePage, experiencePage, evidencePage, competenciesPage, gapPage, portfolioPage, assessmentsPage, settingsPage, helpPage, authPage, bindAppActions } from './pages/app.js';
import { getData } from './services/storage.js';
import { getSupabase, getCurrentSession, signInWithGoogle, signInWithPassword, signUpWithPassword, sendPasswordReset, signOut, onAuthStateChange } from './services/supabase.js';

let currentSession = null;
let authListenerReady = false;

const setFeedback = (message, type = '') => {
  const feedback = document.getElementById('authFeedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = 'auth-feedback' + (type ? ' ' + type : '');
};

async function render() {
  const route = currentRoute();
  const protectedRoute = route.startsWith('/app/');
  if (protectedRoute && !currentSession) {
    navigate('/login');
    return;
  }
  if ((route === '/login' || route === '/register') && currentSession) {
    navigate('/app/dashboard');
    return;
  }

  const pages = {
    '/': homePage, '/about': aboutPage, '/how-it-works': howPage,
    '/privacy': privacyPage, '/terms': termsPage,
    '/app/dashboard': dashboardPage, '/app/profile': profilePage,
    '/app/experience': experiencePage, '/app/evidence': evidencePage,
    '/app/competencies': competenciesPage, '/app/gap-analysis': gapPage,
    '/app/portfolio': portfolioPage, '/app/assessments': assessmentsPage,
    '/app/settings': settingsPage, '/app/help': helpPage
  };

  let html;
  if (route === '/login' || route === '/register') {
    html = authPage(route === '/login' ? 'login' : 'register');
  } else if (protectedRoute) {
    const data = getData();
    if (data.user && currentSession?.user) {
      data.user.email = currentSession.user.email || data.user.email;
      data.user.fullName = currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || data.user.fullName;
    }
    html = (pages[route] || dashboardPage)();
  } else {
    html = (pages[route] || homePage)();
  }

  document.querySelector('#app').innerHTML = html;
  bindLayout();
  bindAppActions();

  document.getElementById('authForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (!form.reportValidity()) return;
    const email = String(values.get('email') || '').trim();
    const password = String(values.get('password') || '');
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Please wait…';
    try {
      if (route === '/register') {
        if (password !== values.get('confirmPassword')) throw new Error('Your passwords do not match.');
        if (!values.get('terms')) throw new Error('Please accept the Terms of Use and Privacy Notice.');
        const { data, error } = await signUpWithPassword({
          email, password, fullName: String(values.get('fullName') || '').trim()
        });
        if (error) throw error;
        if (data.session) {
          currentSession = data.session;
          navigate('/app/dashboard');
        } else {
          setFeedback('Account created. Check your email for the confirmation link before signing in.');
        }
      } else {
        const { data, error } = await signInWithPassword(email, password);
        if (error) throw error;
        currentSession = data.session;
        navigate('/app/dashboard');
      }
    } catch (error) {
      setFeedback(error.message || 'Authentication failed. Please try again.', 'error');
    } finally {
      if (submit.isConnected) {
        submit.disabled = false;
        submit.textContent = route === '/login' ? 'Sign in →' : 'Create account →';
      }
    }
  });

  document.getElementById('togglePassword')?.addEventListener('click', event => {
    const field = document.getElementById('authPassword');
    const show = field.type === 'password';
    field.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Hide' : 'Show';
    event.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
  document.getElementById('toggleConfirmPassword')?.addEventListener('click', event => {
    const field = document.getElementById('confirmPassword');
    const show = field.type === 'password';
    field.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Hide' : 'Show';
    event.currentTarget.setAttribute('aria-label', show ? 'Hide confirmation password' : 'Show confirmation password');
  });
  document.getElementById('forgotPassword')?.addEventListener('click', async () => {
    const email = document.querySelector('#authForm input[name="email"]')?.value.trim();
    if (!email) return setFeedback('Enter your email address first, then select Forgot password.', 'error');
    try {
      const { error } = await sendPasswordReset(email);
      if (error) throw error;
      setFeedback('If an account exists for that email, a password reset link has been sent.');
    } catch (error) {
      setFeedback(error.message || 'Could not send the password reset email.', 'error');
    }
  });
  document.getElementById('googleSignIn')?.addEventListener('click', async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setFeedback(error.message || 'Google sign-in could not be started.', 'error');
    }
  });
  document.getElementById('demoLogin')?.addEventListener('click', () => {
    setFeedback('The demonstration workspace is separate from authenticated accounts. It is not available while signed-in authentication is enabled.');
  });
  document.getElementById('signOutButton')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      const { error } = await signOut();
      if (error) throw error;
      currentSession = null;
      navigate('/login');
    } catch (error) {
      event.currentTarget.disabled = false;
      alert(error.message || 'Could not sign out.');
    }
  });
}

async function start() {
  try {
    currentSession = await getCurrentSession();
    if (!authListenerReady) {
      onAuthStateChange((event, session) => {
        currentSession = session;
        if (['SIGNED_IN', 'SIGNED_OUT', 'PASSWORD_RECOVERY'].includes(event)) render();
      });
      authListenerReady = true;
    }
  } catch (error) {
    console.error('Supabase setup:', error);
    const root = document.querySelector('#app');
    root.innerHTML = '<main style="max-width:720px;margin:10vh auto;padding:24px;font-family:system-ui"><h1>PriorProof setup required</h1><p>Supabase credentials are missing or invalid. Create a local .env file using .env.example, then restart the development server.</p></main>';
    return;
  }
  await render();
}

window.addEventListener('popstate', render);
window.addEventListener('priorproof:data-updated', () => {
  if (currentRoute().startsWith('/app/')) render();
});
start();
