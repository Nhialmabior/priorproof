import './styles/variables.css';
import './styles/global.css';
import './styles/public.css';
import './styles/dashboard.css';
import './styles/responsive.css';
import './styles/dark-mode.css';
import { currentRoute, navigate } from './utils/router.js';
import { bindLayout } from './components/layout.js';
import { homePage, aboutPage, howPage, privacyPage, termsPage } from './pages/public.js';
import { dashboardPage, profilePage, experiencePage, evidencePage, competenciesPage, gapPage, portfolioPage, assessmentsPage, settingsPage, helpPage, authPage, passwordResetPage, bindAppActions } from './pages/app.js';
import { getData, loadUserWorkspace, clearActiveWorkspace, flushWorkspaceSave } from './services/storage.js';
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
  if (route === '/auth/popup-callback') return;
  const protectedRoute = route.startsWith('/app/');
  // Public pages always use the public light theme; the saved preference belongs to the workspace.
  document.documentElement.dataset.theme = protectedRoute
    ? (localStorage.getItem('priorproof-theme') === 'dark' ? 'dark' : 'light')
    : 'light';
  if ((protectedRoute || route === '/reset-password') && !currentSession) {
    navigate('/login');
    return;
  }
  if ((route === '/login' || route === '/register') && currentSession) {
    navigate('/app/dashboard');
    return;
  }

  const pages = {
    '/': homePage, '/about': aboutPage, '/how-it-works': howPage,
    '/privacy': privacyPage, '/terms': termsPage, '/reset-password': passwordResetPage,
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

  // Keep the public homepage public-facing while exposing workspace actions to signed-in users.
  if (!protectedRoute && currentSession?.user) {
    const publicLinks = document.getElementById('publicLinks');
    if (publicLinks) {
      publicLinks.innerHTML = `<a class="${route === '/' ? 'active' : ''}" href="/" data-link>Home</a><a class="${route === '/how-it-works' ? 'active' : ''}" href="/how-it-works" data-link>How it works</a><a class="${route === '/about' ? 'active' : ''}" href="/about" data-link>About</a><a class="nav-workspace" href="/app/dashboard" data-link>My Workspace</a><a class="nav-account" href="/app/profile" data-link>My Account</a><button class="nav-signout" type="button" id="signOutButton">Sign out</button>`;
    }
    document.querySelectorAll('.footer-links a[href="/login"], .footer-links a[href="/register"]').forEach(link => {
      if (link.getAttribute('href') === '/login') {
        link.textContent = 'My Workspace';
        link.setAttribute('href', '/app/dashboard');
      } else {
        link.textContent = 'My Account';
        link.setAttribute('href', '/app/profile');
      }
    });
  }

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
          await loadUserWorkspace(currentSession.user);
          navigate('/app/dashboard');
        } else {
          setFeedback('Account created. Check your email for the confirmation link before signing in.');
        }
      } else {
        const { data, error } = await signInWithPassword(email, password);
        if (error) throw error;
        currentSession = data.session;
        await loadUserWorkspace(currentSession.user);
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
    const width = 520;
    const height = 680;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
      'about:blank',
      'priorproof-google-sign-in',
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      setFeedback('Your browser blocked the sign-in pop-up. Allow pop-ups for this site and try again.', 'error');
      return;
    }

    setFeedback('Opening secure Google sign-in…');
    try {
      const { data, error } = await signInWithGoogle();
      if (error) throw error;
      if (!data?.url) throw new Error('Google did not return a sign-in address. Please try again.');
      popup.location.href = data.url;
      popup.focus();
    } catch (error) {
      popup.close();
      setFeedback(error.message || 'Google sign-in could not be started.', 'error');
    }
  });
  document.getElementById('signOutButton')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      // Do not end the authenticated session while a recent workspace edit is unsynchronised.
      await flushWorkspaceSave();
      const { error } = await signOut();
      if (error) throw error;
      currentSession = null;
      clearActiveWorkspace();
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

    // Supabase completes the OAuth code exchange on this same-origin popup page.
    // The session is persisted in shared browser storage before this window closes.
    if (currentRoute() === '/auth/popup-callback' && window.opener) {
      window.close();
      return;
    }

    if (currentSession?.user) {
      await loadUserWorkspace(currentSession.user);
    } else {
      clearActiveWorkspace();
    }

    if (!authListenerReady) {
      onAuthStateChange((event, session) => {
        currentSession = session;
        // Defer Supabase data queries until the auth callback has returned.
        window.setTimeout(async () => {
          try {
            if (session?.user) await loadUserWorkspace(session.user);
            else clearActiveWorkspace();
          } catch (error) {
            console.error('PriorProof workspace sync:', error);
            const feedback = document.getElementById('authFeedback');
            if (feedback) {
              feedback.textContent = error.message || 'Could not load your workspace.';
              feedback.className = 'auth-feedback error';
            }
            return;
          }
          if (['SIGNED_IN', 'SIGNED_OUT', 'PASSWORD_RECOVERY', 'INITIAL_SESSION', 'TOKEN_REFRESHED'].includes(event)) render();
        }, 0);
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
