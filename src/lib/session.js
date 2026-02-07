export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const SESSION_CONFIRMATION_SECONDS = 10;
export const SESSION_STARTED_AT_KEY = "auth_session_started_at";
export const SESSION_LAST_CONFIRMED_AT_KEY = "auth_session_last_confirmed_at";
export const AUTH_CHANGED_EVENT = "auth-changed";

const parseTimestamp = (value) => {
  const ts = Number(value);
  if (!Number.isFinite(ts) || ts <= 0) return null;
  return ts;
};

export const hasAuthSession = () =>
  Boolean(localStorage.getItem("auth_user") || localStorage.getItem("auth_token"));

export const readSessionStart = () =>
  parseTimestamp(localStorage.getItem(SESSION_STARTED_AT_KEY));

export const startSessionWindow = () => {
  const now = Date.now();
  localStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
  localStorage.setItem(SESSION_LAST_CONFIRMED_AT_KEY, String(now));
  return now;
};

export const ensureSessionWindow = () => readSessionStart() || startSessionWindow();

export const renewSessionWindow = () => startSessionWindow();

export const clearSessionWindow = () => {
  localStorage.removeItem(SESSION_STARTED_AT_KEY);
  localStorage.removeItem(SESSION_LAST_CONFIRMED_AT_KEY);
};

export const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const clearAuthData = () => {
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("last_route");
  clearSessionWindow();
  notifyAuthChanged();
};

