const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

function withBase(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!BASE_PATH) return cleanPath;
  return cleanPath === '/' ? `${BASE_PATH}/` : `${BASE_PATH}${cleanPath}`;
}

function restoreNotFoundRoute() {
  const params = new URLSearchParams(window.location.search);
  const requestedRoute = params.get('__route');
  if (!requestedRoute) return;
  const route = requestedRoute.startsWith('/') ? requestedRoute : `/${requestedRoute}`;
  history.replaceState({}, '', withBase(route));
}

restoreNotFoundRoute();

export function navigate(path) {
  history.pushState({}, '', withBase(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function currentRoute() {
  let pathname = window.location.pathname;
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) pathname = pathname.slice(BASE_PATH.length) || '/';
  return pathname.replace(/\/$/, '') || '/';
}
