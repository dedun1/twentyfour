import { cookies } from 'next/headers';

const COOKIE_NAME = 'tf_onboarding_session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_SESSIONS = 20;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: COOKIE_MAX_AGE_SECONDS,
};

/**
 * Parse the cookie value into an array of session IDs.
 * Backward compatible: legacy single-string cookies are wrapped as [id].
 */
function parseSessionIdsFromCookieValue(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  // Try JSON array first.
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => (typeof v === 'string' ? v.trim() : ''))
          .filter((v) => v.length > 0);
      }
    } catch {
      // Fall through and treat as legacy single value.
    }
  }
  // Legacy single-UUID format.
  return [trimmed];
}

export async function getSessionIdsFromCookie(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? null;
  return parseSessionIdsFromCookieValue(raw);
}

export async function cookieHasSessionId(id: string): Promise<boolean> {
  if (!id) return false;
  const ids = await getSessionIdsFromCookie();
  return ids.includes(id);
}

export async function addSessionIdToCookie(id: string): Promise<void> {
  if (!id) return;
  const cookieStore = await cookies();
  const current = parseSessionIdsFromCookieValue(cookieStore.get(COOKIE_NAME)?.value ?? null);
  // New ID goes to the front; dedupe; cap.
  const next = [id, ...current.filter((existing) => existing !== id)].slice(0, MAX_SESSIONS);
  cookieStore.set(COOKIE_NAME, JSON.stringify(next), COOKIE_OPTIONS);
}

export async function removeSessionIdFromCookie(id: string): Promise<void> {
  if (!id) return;
  const cookieStore = await cookies();
  const current = parseSessionIdsFromCookieValue(cookieStore.get(COOKIE_NAME)?.value ?? null);
  const next = current.filter((existing) => existing !== id);
  cookieStore.set(COOKIE_NAME, JSON.stringify(next), COOKIE_OPTIONS);
}

/**
 * Returns the most recent session id from the cookie, creating one if none exists.
 * Backward-compatible drop-in for the old single-ID flow.
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const ids = parseSessionIdsFromCookieValue(cookieStore.get(COOKIE_NAME)?.value ?? null);
  if (ids.length > 0) return ids[0];
  const id = crypto.randomUUID();
  cookieStore.set(COOKIE_NAME, JSON.stringify([id]), COOKIE_OPTIONS);
  return id;
}

/**
 * @deprecated Prefer addSessionIdToCookie + getSessionIdsFromCookie.
 * Kept for legacy callers; returns the most-recent ID.
 */
export async function getSessionIdFromCookie(): Promise<string | null> {
  const ids = await getSessionIdsFromCookie();
  return ids.length > 0 ? ids[0] : null;
}

/**
 * Clears the entire session cookie. Used when fully resetting anon state.
 * Note: this removes ALL session IDs. To remove just one, use removeSessionIdFromCookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    maxAge: 0,
  });
}

export { COOKIE_NAME };
