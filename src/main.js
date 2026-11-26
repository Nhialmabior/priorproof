import './styles/variables.css';
import './styles/global.css';
import './styles/public.css';
import './styles/dashboard.css';
import './styles/responsive.css';
import './styles/dark-mode.css';
import { currentRoute, navigate } from './utils/router.js';
import { bindLayout, escapeHtml } from './components/layout.js';
import { homePage, aboutPage, howPage, privacyPage, termsPage } from './pages/public.js';
import { dashboardPage, profilePage, experiencePage, evidencePage, competenciesPage, gapPage, portfolioPage, assessmentsPage, settingsPage, helpPage, authPage, passwordResetPage, bindAppActions } from './pages/app.js';
import { getData, loadUserWorkspace, clearActiveWorkspace, flushWorkspaceSave } from './services/storage.js';
import { getSupabase, getCurrentSession, signInWithGoogle, signInWithPassword, signUpWithPassword, resendSignupConfirmation, sendPasswordReset, updateAccountPassword, signOut, onAuthStateChange } from './services/supabase.js';
import { validateProfileName } from './utils/profileValidation.js';
import { validateStrongPassword, validatePasswordReset } from './utils/passwordValidation.js';
import { isEmailConfirmationCallback, getEmailConfirmationError } from './utils/authCallback.js';

let currentSession = null;
let authListenerReady = false;

const setFeedback = (message, type = '') => {
  const feedback = document.getElementById('authFeedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = 'auth-feedback' + (type ? ' ' + type : '');
};

function showResendConfirmation(email) {
  const feedback = document.getElementById('authFeedback');
  if (!feedback || !email) return;
  document.getElementById('resendConfirmation')?.remove();
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'resendConfirmation';
  button.className = 'text-link';
  button.textContent = 'Resend confirmation email';
  feedback.insertAdjacentElement('afterend', button);
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const { error } = await resendSignupConfirmation(email);
      if (error) throw error;
      setFeedback('If this address has a pending account, a fresh confirmation email has been sent.');
      button.textContent = 'Send another confirmation email';
    } catch (error) {
      setFeedback(error.message || 'Could not resend the confirmation email. Please try again.', 'error');
      button.textContent = 'Retry confirmation email';
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  });
}

async function render() {
  const route = currentRoute();
  if (route === '/auth/popup-callback') return;
  const protectedRoute = route.startsWith('/app/');
  // Apply the saved colour preference consistently across public and workspace pages.
  document.documentElement.dataset.theme = localStorage.getItem('priorproof-theme') === 'dark' ? 'dark' : 'light';
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
    if (route === '/') {
      const accountUser = getData().user || {};
      const displayName = currentSession?.user?.user_metadata?.full_name
        || currentSession?.user?.user_metadata?.name
        || accountUser.fullName
        || '';
      html = homePage(displayName);
    } else {
      html = (pages[route] || homePage)();
    }
  }

  document.querySelector('#app').innerHTML = html;

  // Move keyboard and screen-reader focus to the new page heading after SPA navigation.
  const pageHeading = document.querySelector('#app h1');
  if (pageHeading) {
    pageHeading.setAttribute('tabindex', '-1');
    pageHeading.focus({ preventScroll: true });
  }

  // Signed-in visitors get one profile icon; account actions live inside its dropdown.
  if (!protectedRoute && currentSession?.user) {
    const publicLinks = document.getElementById('publicLinks');
    const accountUser = getData().user || {};
    const displayName = currentSession.user.user_metadata?.full_name
      || currentSession.user.user_metadata?.name
      || accountUser.fullName
      || 'Your account';
    const email = currentSession.user.email || accountUser.email || '';
    const avatar = accountUser.profilePhoto
      ? `<img src="${escapeHtml(accountUser.profilePhoto)}" alt="Profile photo">`
      : escapeHtml(String(displayName).trim().charAt(0).toUpperCase() || 'U');
    if (publicLinks) {
      publicLinks.innerHTML = `<a class="${route === '/' ? 'active' : ''}" href="/" data-link>Home</a><a class="${route === '/how-it-works' ? 'active' : ''}" href="/how-it-works" data-link>How it works</a><a class="${route === '/about' ? 'active' : ''}" href="/about" data-link>About</a><button class="theme-toggle public-theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">◐ <span>Dark mode</span></button><div class="account-menu-wrap public-account-wrap"><button class="avatar account-trigger public-profile-trigger" id="accountMenuToggle" type="button" aria-label="Open profile menu" aria-expanded="false">${avatar}</button><div class="account-menu public-account-menu" id="accountMenu" hidden><div class="account-menu-profile"><div class="avatar account-menu-avatar">${avatar}</div><div><strong>${escapeHtml(displayName)}</strong><small>${escapeHtml(email)}</small></div></div><a href="/app/profile" data-link>My Account <span>→</span></a><a href="/app/dashboard" data-link>My Workspace <span>→</span></a><button type="button" class="account-menu-signout" id="signOutButton">Sign out</button></div></div>`;
    }
    // Authentication actions are kept in the profile menu, not duplicated in the footer.
    document.querySelectorAll('.footer-links a[href="/login"], .footer-links a[href="/register"]').forEach(link => link.remove());
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
        const fullName = String(values.get('fullName') || '').trim();
        const nameError = validateProfileName(fullName);
        if (nameError) throw new Error(nameError);
        const passwordError = validateStrongPassword(password);
        if (passwordError) throw new Error(passwordError);
        if (password !== values.get('confirmPassword')) throw new Error('Your passwords do not match.');
        if (!values.get('terms')) throw new Error('Please accept the Terms of Use and Privacy Notice.');
        const { data, error } = await signUpWithPassword({
          email, password, fullName
        });
        if (error) throw error;
        if (data.session) {
          currentSession = data.session;
          await loadUserWorkspace(currentSession.user);
          navigate('/app/dashboard');
        } else {
          setFeedback('Account created. Check your email for the confirmation link before signing in.');
          showResendConfirmation(email);
        }
      } else {
        const { data, error } = await signInWithPassword(email, password);
        if (error) throw error;
        currentSession = data.session;
        await loadUserWorkspace(currentSession.user);
        navigate('/app/dashboard');
      }
    } catch (error) {
      if (route === '/login' && (error.code === 'email_not_confirmed' || String(error.message || '').toLowerCase().includes('email not confirmed'))) {
        setFeedback('Please confirm your email address before signing in. You can request a fresh confirmation email below.');
        showResendConfirmation(email);
      } else {
        setFeedback(error.message || 'Authentication failed. Please try again.', 'error');
      }
    } finally {
      if (submit.isConnected) {
        submit.disabled = false;
        submit.textContent = route === '/login' ? 'Sign in →' : 'Create account →';
      }
    }
  });

  document.getElementById('passwordResetForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const password = document.getElementById('newPassword')?.value || '';
    const confirmation = document.getElementById('confirmNewPassword')?.value || '';
    const feedback = document.getElementById('passwordResetFeedback');
    const submit = form.querySelector('button[type="submit"]');
    const validationError = validatePasswordReset(password, confirmation);
    if (validationError) {
      if (feedback) {
        feedback.textContent = validationError;
        feedback.className = 'auth-feedback error';
      }
      return;
    }
    if (!submit || submit.disabled) return;

    submit.disabled = true;
    submit.textContent = 'Updating password…';
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'auth-feedback';
    }
    try {
      const { error } = await updateAccountPassword(password);
      if (error) throw error;
      form.reset();
      if (feedback) {
        feedback.textContent = 'Password updated successfully. Your new password is ready to use.';
        feedback.className = 'auth-feedback success';
      }
      submit.textContent = 'Password updated';
    } catch (error) {
      if (feedback) {
        feedback.textContent = error.message || 'Could not update your password. Request a fresh reset link and try again.';
        feedback.className = 'auth-feedback error';
      }
      submit.disabled = false;
      submit.textContent = 'Update password';
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
  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const field = document.getElementById(button.dataset.togglePassword);
      if (!field) return;
      const show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';
      button.setAttribute('aria-label', `${show ? 'Hide' : 'Show'} password`);
    });
  });

  document.getElementById('forgotPassword')?.addEventListener('click', async event => {
    const emailField = document.querySelector('#authForm input[name="email"]');
    const email = emailField?.value.trim() || '';
    if (!emailField || !email) {
      setFeedback('Enter your email address first, then select Forgot password.', 'error');
      emailField?.focus();
      return;
    }
    if (!emailField.checkValidity()) {
      emailField.reportValidity();
      setFeedback('Enter a valid email address before requesting a password reset.', 'error');
      return;
    }
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const { error } = await sendPasswordReset(email);
      if (error) throw error;
      setFeedback('If an account exists for that email, a password reset link has been sent.');
    } catch (error) {
      setFeedback(error.message || 'Could not send the password reset email.', 'error');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = 'Forgot password?';
      }
    }
  });
  document.getElementById('googleSignIn')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    const originalButtonMarkup = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Preparing Google sign-in…';
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
      button.disabled = false;
      button.innerHTML = originalButtonMarkup;
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
      if (button.isConnected) {
        button.disabled = false;
        button.innerHTML = originalButtonMarkup;
      }
    }
  });
  document.getElementById('signOutButton')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Signing out…';
    try {
      // Do not end the authenticated session while a recent workspace edit is unsynchronised.
      await flushWorkspaceSave();
      const { error } = await signOut();
      if (error) throw error;
      currentSession = null;
      clearActiveWorkspace();
      navigate('/login');
    } catch (error) {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = 'Sign out';
      }
      alert(error.message || 'Could not sign out. Your session is still active.');
    }
  });
}

async function start() {
  const emailConfirmationReturn = isEmailConfirmationCallback({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });
  let confirmationWorkspaceLoaded = false;
  try {
    currentSession = await getCurrentSession();

    // Give expired or rejected password-reset links a useful recovery path instead of
    // silently redirecting the visitor to sign-in with no explanation.
    if (currentRoute() === '/reset-password' && !currentSession?.user) {
      const detail = getEmailConfirmationError(window.location.search, window.location.hash);
      const root = document.querySelector('#app');
      root.innerHTML = `<main style="max-width:680px;margin:10vh auto;padding:28px;font-family:system-ui"><h1>Password reset link unavailable</h1><p>${escapeHtml(detail || 'This password reset link may have expired, already been used, or could not be verified.')}</p><p>Return to sign in and request a fresh password reset link.</p><p><a href="/login">Go to sign in</a> · <a href="/">Return to homepage</a></p></main>`;
      return;
    }

    // Email confirmation returns to the existing protected dashboard URL.
    // Supabase's URL detection exchanges the confirmation code before getSession resolves.
    if (emailConfirmationReturn) {
      if (!currentSession?.user) {
        const detail = getEmailConfirmationError(window.location.search, window.location.hash);
        const root = document.querySelector('#app');
        root.innerHTML = `<main style="max-width:680px;margin:10vh auto;padding:28px;font-family:system-ui"><h1>Email confirmation could not be completed</h1><p>${escapeHtml(detail || 'The confirmation link may have expired, already been used, or the redirect address may not be allowed in Supabase.')}</p><p>Return to PriorProof and sign in if your email has already been confirmed. Otherwise, request a fresh confirmation email.</p><p><a href="/login">Go to sign in</a> · <a href="/">Return to homepage</a></p></main>`;
        return;
      }
      await loadUserWorkspace(currentSession.user);
      history.replaceState({}, '', '/app/dashboard');
      confirmationWorkspaceLoaded = true;
    }

    // Supabase completes the OAuth code exchange on this same-origin popup page.
    // Close the popup when possible; if the browser has isolated the opener,
    // continue in this tab rather than leaving a blank callback page.
    if (currentRoute() === '/auth/popup-callback') {
      if (window.opener) {
        window.close();
        return;
      }
      if (currentSession?.user) {
        await loadUserWorkspace(currentSession.user);
        navigate('/app/dashboard');
      } else {
        navigate('/login');
      }
      return;
    }

    if (currentSession?.user && !confirmationWorkspaceLoaded) {
      await loadUserWorkspace(currentSession.user);
    } else if (!currentSession?.user) {
      clearActiveWorkspace();
    }

    if (!authListenerReady) {
      onAuthStateChange((event, session) => {
        currentSession = session;
        // Session refreshes and the initial session notification do not change
        // the workspace view. Avoid reloading data or replacing an active form.
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
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
          if (['SIGNED_IN', 'SIGNED_OUT', 'PASSWORD_RECOVERY'].includes(event)) render();
        }, 0);
      });
      authListenerReady = true;
    }
  } catch (error) {
    console.error('Supabase setup:', error);
    const root = document.querySelector('#app');
    if (emailConfirmationReturn) {
      root.innerHTML = `<main style="max-width:680px;margin:10vh auto;padding:28px;font-family:system-ui"><h1>Email confirmation could not be completed</h1><p>${escapeHtml(error.message || 'The confirmation link could not be verified. It may have expired or already been used.')}</p><p>Request a fresh confirmation email or return to sign in if your account is already confirmed.</p><p><a href="/login">Go to sign in</a> · <a href="/">Return to homepage</a></p></main>`;
      return;
    }
    if (currentRoute() === '/reset-password') {
      const detail = getEmailConfirmationError(window.location.search, window.location.hash);
      root.innerHTML = `<main style="max-width:680px;margin:10vh auto;padding:28px;font-family:system-ui"><h1>Password reset link could not be verified</h1><p>${escapeHtml(detail || error.message || 'The password reset link may have expired or could not be verified.')}</p><p>Return to sign in and request a fresh password reset link.</p><p><a href="/login">Go to sign in</a> · <a href="/">Return to homepage</a></p></main>`;
      return;
    }
    root.innerHTML = '<main style="max-width:720px;margin:10vh auto;padding:24px;font-family:system-ui"><h1>PriorProof could not start</h1><p>Check your internet connection and refresh the page. If the problem continues, verify that your local Supabase settings are configured correctly.</p><a href="/">Return to PriorProof</a></main>';
    return;
  }
  await render();
}

window.addEventListener('popstate', render);
window.addEventListener('priorproof:data-updated', () => {
  if (currentRoute().startsWith('/app/')) render();
});
start();
