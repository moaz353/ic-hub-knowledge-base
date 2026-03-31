const TOKEN_KEY = 'ichub_token';
export const ICHUB_AUTH_EVENT = 'ichub-auth-changed';

function notifyAuthChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ICHUB_AUTH_EVENT));
  }
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  notifyAuthChanged();
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  notifyAuthChanged();
}

export function isTokenActive(): boolean {
  return !!getToken();
}
