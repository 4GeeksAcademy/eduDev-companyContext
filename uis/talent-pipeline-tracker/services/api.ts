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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `La solicitud falló (${response.status}).`;
    try {
      const body = (await response.json()) as { detail?: string; message?: string };
      message = body.detail ?? body.message ?? message;
    } catch {
      // Keep the status-based message when the API does not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
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
    total = response.total;
    candidates.push(...response.data);

    if (response.data.length === 0 && candidates.length < total) {
      throw new Error("No se pudieron recuperar todas las candidaturas.");
    }
    page += 1;
  } while (candidates.length < total);

  return { total, page: 1, limit: pageSize, data: candidates };
}

export async function getCandidate(id: string): Promise<Candidate> {
  return await request<Candidate>(`/records/${encodeURIComponent(id)}`);
}

export async function createCandidate(data: RecordCreate): Promise<Candidate> {
  return await request<Candidate>("/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCandidate(
  id: string,
  data: RecordUpdate,
): Promise<Candidate> {
  return await request<Candidate>(`/records/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchCandidate(
  id: string,
  data: CandidatePatch,
): Promise<Candidate> {
  return await request<Candidate>(`/records/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getNotes(id: string): Promise<NotesResponse> {
  return await request<NotesResponse>(`/records/${encodeURIComponent(id)}/notes`);
}

export async function createNote(id: string, content: string): Promise<Note> {
  return await request<Note>(`/records/${encodeURIComponent(id)}/notes`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteNote(candidateId: string, noteId: string): Promise<void> {
  await request<void>(
    `/records/${encodeURIComponent(candidateId)}/notes/${encodeURIComponent(String(noteId))}`,
    { method: "DELETE" },
  );
}
