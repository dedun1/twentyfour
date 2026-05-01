/** Client-only persistence so anonymous users can find their last consultation session again. */

export const CONSULTATION_SESSION_STORAGE_KEY = 'twentyfour_consultation_session_v1';

export function readStoredConsultationSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSULTATION_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { sessionId?: string };
    return typeof data.sessionId === 'string' && data.sessionId.trim().length > 0 ? data.sessionId.trim() : null;
  } catch {
    return null;
  }
}

export function writeStoredConsultationSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      CONSULTATION_SESSION_STORAGE_KEY,
      JSON.stringify({ sessionId: sessionId.trim(), savedAt: Date.now() }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearStoredConsultationSessionId(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONSULTATION_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
