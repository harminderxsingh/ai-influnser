const TOKEN_KEY = () => process.env.REACT_APP_TOKEN + "_user";

export function isUserLoggedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY()));
}

/** Only allow same-origin relative paths (blocks open redirects). */
export function getSafeRedirect(value) {
  if (!value || typeof value !== "string") return null;
  const redirect = value.trim();
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return null;
  if (redirect.startsWith("/user/login") || redirect.startsWith("/user/signup")) {
    return null;
  }
  return redirect;
}

export function getRedirectFromSearch(search = window.location.search) {
  const params = new URLSearchParams(search);
  return getSafeRedirect(params.get("redirect"));
}

export function buildLoginPath(returnTo) {
  const safe = getSafeRedirect(returnTo);
  if (!safe) return "/user/login";
  return `/user/login?redirect=${encodeURIComponent(safe)}`;
}

export function buildSignupPath(returnTo) {
  const safe = getSafeRedirect(returnTo);
  if (!safe) return "/user/signup";
  return `/user/signup?redirect=${encodeURIComponent(safe)}`;
}

export function getPostAuthPath(search = window.location.search) {
  return getRedirectFromSearch(search) || "/user";
}
