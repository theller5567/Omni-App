import apiClient from '../api/apiClient';

let refreshTimer: number | null = null;

function decodeJwt(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split('.') as [string, string, string];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function stopAccessTokenRefreshSchedule(): void {
  if (refreshTimer) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export function startAccessTokenRefreshSchedule(accessToken: string): void {
  stopAccessTokenRefreshSchedule();
  const decoded = decodeJwt(accessToken);
  if (!decoded?.exp) return;

  const expMs = decoded.exp * 1000;
  const now = Date.now();

  // Refresh 2 minutes before expiry, minimum 10 seconds from now
  const leadMs = 2 * 60 * 1000;
  const delay = Math.max(10_000, expMs - now - leadMs);

  refreshTimer = window.setTimeout(async () => {
    try {
      // Trigger cookie-based refresh; no body token required
      const resp = await apiClient.post(`/auth/refresh-token`, {});
      const { accessToken: newAccessToken } = resp.data as { accessToken?: string };
      if (newAccessToken) {
        localStorage.setItem('authToken', newAccessToken);
      }
      // Recurse to schedule the next refresh
      startAccessTokenRefreshSchedule(newAccessToken || accessToken);
    } catch {
      // Allow normal 401 interceptor flow to handle logout/prompt on next request
      stopAccessTokenRefreshSchedule();
    }
  }, delay);
}


