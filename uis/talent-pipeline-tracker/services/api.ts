import type {
  Candidate,
  CandidateFilters,
  CandidatePatch,
  CandidatesResponse,
  Note,
  NotesResponse,
  RecordCreate,
  RecordUpdate,
} from "@/types/api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://playground.4geeks.com/tracker/api/v1"
).replace(/\/$/, "");

class CandidateApiError extends Error {}

const INVALID_RESPONSE = "La respuesta no es válida. Inténtalo de nuevo.";

export function candidateErrorMessage(error: unknown, fallback: string): string {
  return error instanceof CandidateApiError ? error.message : fallback;
}

export function isCandidateAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function statusMessage(status: number): string {
  if (status === 400 || status === 422) return "Revisa los datos e inténtalo de nuevo.";
  if (status === 401 || status === 403) return "No tienes permiso para realizar esta solicitud.";
  if (status === 404) return "No se encontró la candidatura o la nota.";
  if (status === 409) return "Los datos han cambiado o ya existen. Revisa e inténtalo de nuevo.";
  if (status === 429) return "Hay demasiadas solicitudes. Espera un momento e inténtalo de nuevo.";
  return "El servicio no está disponible. Inténtalo de nuevo más tarde.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  init?.signal?.throwIfAborted();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (isCandidateAbort(error)) throw error;
    init?.signal?.throwIfAborted();
    throw new CandidateApiError("No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.");
  }
  init?.signal?.throwIfAborted();
  // Upstream error bodies are untrusted and never used as UI copy.
  if (!response.ok) throw new CandidateApiError(statusMessage(response.status));
  if (response.status === 204 && init?.method === "DELETE") return undefined as T;
  let body: T;
  try {
    body = await response.json() as T;
  } catch (error) {
    if (isCandidateAbort(error)) throw error;
    init?.signal?.throwIfAborted();
    throw new CandidateApiError(INVALID_RESPONSE);
  }
  init?.signal?.throwIfAborted();
  return body;
}

function validCandidate(value: unknown): value is Candidate {
  const item = value as Candidate | null;
  return !!item && typeof item.id === "string" &&
    [item.full_name, item.email, item.phone, item.position, item.applied_at, item.updated_at].every(value => typeof value === "string") &&
    [item.linkedin_url, item.cv_url].every(value => value == null || typeof value === "string") &&
    Number.isFinite(item.experience_years) && Number.isInteger(item.notes_count) && item.notes_count >= 0 &&
    ["received", "in_progress", "selected", "discarded"].includes(item.status) &&
    ["pending", "review", "personal_interview", "technical_interview", "offer_presented"].includes(item.stage);
}

function requireCandidate(value: Candidate): Candidate {
  if (!validCandidate(value)) throw new CandidateApiError(INVALID_RESPONSE);
  return value;
}

function validNote(value: unknown): value is Note {
  const note = value as Note | null;
  return !!note && [note.id, note.record_id, note.content, note.created_at].every(value => typeof value === "string");
}

export async function getCandidates(
  filters: CandidateFilters,
  signal?: AbortSignal,
): Promise<CandidatesResponse> {
  const pageSize = 100;
  const candidates: Candidate[] = [];
  let page = 1;
  let total = 0;

  do {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (filters.status) params.set("status", filters.status);
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.search) params.set("search", filters.search);

    const response = await request<CandidatesResponse>(
      `/records?${params.toString()}`,
      { signal },
    );
    if (!response || !Number.isInteger(response.total) || response.total < 0 ||
      !Array.isArray(response.data) || !response.data.every(validCandidate)) {
      throw new CandidateApiError(INVALID_RESPONSE);
    }
    total = response.total;
    candidates.push(...response.data);

    if (response.data.length === 0 && candidates.length < total) {
      throw new CandidateApiError("No se pudieron recuperar todas las candidaturas.");
    }
    page += 1;
  } while (candidates.length < total);

  return { total, page: 1, limit: pageSize, data: candidates };
}

export async function getCandidate(id: string, signal?: AbortSignal): Promise<Candidate> {
  return requireCandidate(await request<Candidate>(`/records/${encodeURIComponent(id)}`, { signal }));
}

export async function createCandidate(data: RecordCreate, signal?: AbortSignal): Promise<Candidate> {
  return requireCandidate(await request<Candidate>("/records", {
    signal,
    method: "POST",
    body: JSON.stringify(data),
  }));
}

export async function updateCandidate(
  id: string,
  data: RecordUpdate,
  signal?: AbortSignal,
): Promise<Candidate> {
  return requireCandidate(await request<Candidate>(`/records/${encodeURIComponent(id)}`, {
    signal,
    method: "PUT",
    body: JSON.stringify(data),
  }));
}

export async function patchCandidate(
  id: string,
  data: CandidatePatch,
  signal?: AbortSignal,
): Promise<Candidate> {
  return requireCandidate(await request<Candidate>(`/records/${encodeURIComponent(id)}`, {
    signal,
    method: "PATCH",
    body: JSON.stringify(data),
  }));
}

export async function getNotes(id: string, signal?: AbortSignal): Promise<NotesResponse> {
  const response = await request<NotesResponse>(`/records/${encodeURIComponent(id)}/notes`, { signal });
  if (!response || !Array.isArray(response.data) || !response.data.every(validNote)) {
    throw new CandidateApiError(INVALID_RESPONSE);
  }
  return response;
}

export async function createNote(id: string, content: string, signal?: AbortSignal): Promise<Note> {
  const note = await request<Note>(`/records/${encodeURIComponent(id)}/notes`, {
    signal,
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!validNote(note)) throw new CandidateApiError(INVALID_RESPONSE);
  return note;
}

export async function deleteNote(candidateId: string, noteId: string, signal?: AbortSignal): Promise<void> {
  await request<void>(
    `/records/${encodeURIComponent(candidateId)}/notes/${encodeURIComponent(String(noteId))}`,
    { method: "DELETE", signal },
  );
}
