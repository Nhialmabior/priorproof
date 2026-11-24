export function navigate(path) {
  history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
export function currentRoute() {
  return window.location.pathname.replace(/\\/$/, '') || '/';
}
