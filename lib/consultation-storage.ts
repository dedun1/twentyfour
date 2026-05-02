/** Client-only persistence so anonymous users can find their past consultation sessions again. */

export const CONSULTATION_SESSION_STORAGE_KEY = 'twentyfour_consultation_session_v1';
const MAX_LOCAL_SESSIONS = 20;

type StorageShape = { sessionIds?: string[]; sessionId?: string; savedAt?: number };

function readRaw(): StorageShape | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSULTATION_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StorageShape;
  } catch {
    return null;
  }
}

function writeRaw(payload: StorageShape): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSULTATION_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function readStoredConsultationSessionIds(): string[] {
  const data = readRaw();
  if (!data) return [];
  if (Array.isArray(data.sessionIds)) {
    return data.sessionIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
  }
  // Backward compat: legacy single-id payload.
  if (typeof data.sessionId === 'string' && data.sessionId.trim().length > 0) {
    return [data.sessionId.trim()];
  }
  return [];
}

export function addStoredConsultationSessionId(sessionId: string): void {
  const id = sessionId.trim();
  if (!id) return;
  const current = readStoredConsultationSessionIds();
  const next = [id, ...current.filter((existing) => existing !== id)].slice(0, MAX_LOCAL_SESSIONS);
  writeRaw({ sessionIds: next, savedAt: Date.now() });
}

export function removeStoredConsultationSessionId(sessionId: string): void {
  const id = sessionId.trim();
  if (!id) return;
  const current = readStoredConsultationSessionIds();
  const next = current.filter((existing) => existing !== id);
  writeRaw({ sessionIds: next, savedAt: Date.now() });
}

/** @deprecated Use readStoredConsultationSessionIds (returns array). Kept for any old callers. */
export function readStoredConsultationSessionId(): string | null {
  const ids = readStoredConsultationSessionIds();
  return ids.length > 0 ? ids[0] : null;
}

/** @deprecated Use addStoredConsultationSessionId. Kept for any old callers. */
export function writeStoredConsultationSessionId(sessionId: string): void {
  addStoredConsultationSessionId(sessionId);
}

export function clearStoredConsultationSessionId(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONSULTATION_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
