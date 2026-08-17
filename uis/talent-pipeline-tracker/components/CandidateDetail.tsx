"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Feedback } from "@/components/Feedback";
import { STAGE_LABELS, STAGE_OPTIONS, STATUS_LABELS, STATUS_OPTIONS } from "@/lib/labels";
import { createNote, deleteNote, getCandidate, getNotes, patchCandidate } from "@/services/api";
import type { Candidate, CandidateStage, CandidateStatus, Note } from "@/types/api";

export function CandidateDetail({ id }: { id: string }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updating, setUpdating] = useState<"status" | "stage" | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [noteFeedback, setNoteFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [candidateResponse, notesResponse] = await Promise.all([
          getCandidate(id),
          getNotes(id),
        ]);
        if (!active) return;
        setCandidate(candidateResponse);
        setNotes(notesResponse.data);
      } catch (caughtError) {
        if (active) setLoadError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar la candidatura.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [id]);

  async function changeStatus(status: CandidateStatus) {
    if (!candidate || status === candidate.status) return;
    setUpdating("status");
    setUpdateFeedback(null);
    try {
      const updated = await patchCandidate(id, { status });
      setCandidate(updated);
      setUpdateFeedback({ type: "success", message: "El estado se actualizó correctamente." });
    } catch (caughtError) {
      setUpdateFeedback({ type: "error", message: caughtError instanceof Error ? caughtError.message : "No se pudo actualizar el estado." });
    } finally {
      setUpdating(null);
    }
  }

  async function changeStage(stage: CandidateStage) {
    if (!candidate || stage === candidate.stage) return;
    setUpdating("stage");
    setUpdateFeedback(null);
    try {
      const updated = await patchCandidate(id, { stage });
      setCandidate(updated);
      setUpdateFeedback({ type: "success", message: "La etapa se actualizó correctamente." });
    } catch (caughtError) {
      setUpdateFeedback({ type: "error", message: caughtError instanceof Error ? caughtError.message : "No se pudo actualizar la etapa." });
    } finally {
      setUpdating(null);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = noteContent.trim();
    setNoteFeedback(null);
    if (!content) {
      setNoteFeedback({ type: "error", message: "La nota no puede estar vacía." });
      return;
    }

    setNoteLoading(true);
    try {
      const note = await createNote(id, content);
      setNotes((current) => [...current, note]);
      setCandidate((current) => current ? { ...current, notes_count: current.notes_count + 1 } : current);
      setNoteContent("");
      setNoteFeedback({ type: "success", message: "La nota se añadió correctamente." });
    } catch (caughtError) {
      setNoteFeedback({ type: "error", message: caughtError instanceof Error ? caughtError.message : "No se pudo añadir la nota." });
    } finally {
      setNoteLoading(false);
    }
  }

  async function removeNote(noteId: string) {
    setDeletingNoteId(noteId);
    setNoteFeedback(null);
    try {
      await deleteNote(id, noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      setCandidate((current) => current ? { ...current, notes_count: Math.max(0, current.notes_count - 1) } : current);
      setNoteFeedback({ type: "success", message: "La nota se eliminó correctamente." });
    } catch (caughtError) {
      setNoteFeedback({ type: "error", message: caughtError instanceof Error ? caughtError.message : "No se pudo eliminar la nota." });
    } finally {
      setDeletingNoteId(null);
    }
  }

  if (loading) return <Feedback type="loading">Cargando candidatura y notas…</Feedback>;
  if (loadError) return <Feedback type="error">{loadError}</Feedback>;
  if (!candidate) return <Feedback type="error">No se encontró la candidatura.</Feedback>;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">← Volver a candidaturas</Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">{candidate.full_name}</h1>
          <p className="mt-1 text-slate-600">{candidate.position}</p>
        </div>
        <Link href={`/candidates/${candidate.id}/edit`} className="button-primary w-fit">Editar candidatura</Link>
      </div>

      {updating && <Feedback type="loading">Actualizando {updating === "status" ? "estado" : "etapa"}…</Feedback>}
      {updateFeedback && <Feedback type={updateFeedback.type}>{updateFeedback.message}</Feedback>}

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-950">Información de la candidatura</h2>
          <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Detail label="Identificador" value={String(candidate.id)} />
            <Detail label="Nombre completo" value={candidate.full_name} />
            <Detail label="Correo electrónico" value={candidate.email} />
            <Detail label="Teléfono" value={candidate.phone} />
            <Detail label="Puesto" value={candidate.position} />
            <Detail label="Años de experiencia" value={String(candidate.experience_years)} />
            <Detail label="Estado" value={STATUS_LABELS[candidate.status]} />
            <Detail label="Etapa" value={STAGE_LABELS[candidate.stage]} />
            <Detail label="Número de notas" value={String(candidate.notes_count)} />
            <Detail label="Fecha de candidatura" value={formatDate(candidate.applied_at)} />
            <Detail label="Última actualización" value={formatDate(candidate.updated_at)} />
            <Detail label="LinkedIn" value={candidate.linkedin_url ? <ExternalLink href={candidate.linkedin_url}>Abrir perfil</ExternalLink> : "No informado"} />
            <Detail label="Currículum" value={candidate.cv_url ? <ExternalLink href={candidate.cv_url}>Abrir currículum</ExternalLink> : "No informado"} />
          </dl>
        </article>

        <aside className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Actualizar proceso</h2>
          <label className="block text-sm font-medium text-slate-700">
            Estado
            <select className="field mt-1" value={candidate.status} disabled={updating !== null} onChange={(event) => void changeStatus(event.target.value as CandidateStatus)}>
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Etapa
            <select className="field mt-1" value={candidate.stage} disabled={updating !== null} onChange={(event) => void changeStage(event.target.value as CandidateStage)}>
              {STAGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </aside>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-950">Notas internas</h2>
        <p className="mt-1 text-sm text-slate-600">Añade contexto para el equipo de People &amp; Talent.</p>
        <form onSubmit={addNote} className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Nueva nota
            <textarea className="field mt-1 min-h-28 resize-y" value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="Escribe una nota sobre la candidatura" />
          </label>
          <button className="button-primary" type="submit" disabled={noteLoading}>{noteLoading ? "Añadiendo…" : "Añadir nota"}</button>
        </form>
        <div className="mt-4 space-y-3">
          {noteLoading && <Feedback type="loading">Guardando nota…</Feedback>}
          {noteFeedback && <Feedback type={noteFeedback.type}>{noteFeedback.message}</Feedback>}
        </div>
        <div className="mt-6 space-y-3">
          {notes.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Todavía no hay notas.</p>}
          {notes.map((note) => (
            <div key={note.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="whitespace-pre-wrap text-sm text-slate-800">{note.content}</p><p className="mt-2 text-xs text-slate-500">{formatDate(note.created_at)}</p></div>
              <button type="button" className="text-left text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-60" disabled={deletingNoteId !== null} onClick={() => void removeNote(note.id)}>
                {deletingNoteId === note.id ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-900">{value}</dd></div>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="text-blue-700 underline hover:text-blue-900">{children}</a>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No disponible" : new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
