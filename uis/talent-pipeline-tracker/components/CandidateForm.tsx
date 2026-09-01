"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Feedback } from "@/components/Feedback";
import { createCandidate, updateCandidate } from "@/services/api";
import type { Candidate, RecordCreate, RecordUpdate } from "@/types/api";

interface CandidateFormProps {
  candidate?: Candidate;
}

interface FormValues {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  experience_years: string;
  linkedin_url: string;
  cv_url: string;
}

function initialValues(candidate?: Candidate): FormValues {
  return {
    full_name: candidate?.full_name ?? "",
    email: candidate?.email ?? "",
    phone: candidate?.phone ?? "",
    position: candidate?.position ?? "Asistente de Dirección",
    experience_years: candidate ? String(candidate.experience_years) : "",
    linkedin_url: candidate?.linkedin_url ?? "",
    cv_url: candidate?.cv_url ?? "",
  };
}

export function CandidateForm({ candidate }: CandidateFormProps) {
  const editing = candidate !== undefined;
  const [values, setValues] = useState<FormValues>(() => initialValues(candidate));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [requestError, setRequestError] = useState("");
  const [savedCandidate, setSavedCandidate] = useState<Candidate | null>(null);

  function setField(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function validate(): string[] {
    const nextErrors: string[] = [];
    if (!values.full_name.trim()) nextErrors.push("El nombre completo es obligatorio.");
    if (!values.email.trim()) nextErrors.push("El correo electrónico es obligatorio.");
    else if (!isValidEmail(values.email)) nextErrors.push("Introduce un correo electrónico válido.");
    if (!values.phone.trim()) nextErrors.push("El teléfono es obligatorio.");
    if (!values.position.trim()) nextErrors.push("El puesto es obligatorio.");
    const experience = Number(values.experience_years);
    if (!values.experience_years.trim()) {
      nextErrors.push("Los años de experiencia son obligatorios.");
    } else if (!Number.isFinite(experience) || experience < 0) {
      nextErrors.push("Los años de experiencia deben ser un número igual o superior a cero.");
    }
    if (values.linkedin_url.trim() && !isValidHttpUrl(values.linkedin_url)) {
      nextErrors.push("El enlace de LinkedIn debe ser una URL válida con http:// o https://.");
    }
    if (values.cv_url.trim() && !isValidHttpUrl(values.cv_url)) {
      nextErrors.push("El enlace al currículum debe ser una URL válida con http:// o https://.");
    }
    return nextErrors;
  }

  function requiredPayload(): Omit<RecordCreate, "linkedin_url" | "cv_url"> {
    return {
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      position: values.position.trim(),
      experience_years: Number(values.experience_years),
    };
  }

  function toCreatePayload(): RecordCreate {
    const payload: RecordCreate = requiredPayload();
    if (values.linkedin_url.trim()) payload.linkedin_url = values.linkedin_url.trim();
    if (values.cv_url.trim()) payload.cv_url = values.cv_url.trim();
    return payload;
  }

  function toUpdatePayload(): RecordUpdate {
    return {
      ...requiredPayload(),
      linkedin_url: values.linkedin_url.trim() || null,
      cv_url: values.cv_url.trim() || null,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setSuccess("");
    setRequestError("");
    if (validationErrors.length > 0) return;

    setSaving(true);
    try {
      const saved = editing
        ? await updateCandidate(candidate.id, toUpdatePayload())
        : await createCandidate(toCreatePayload());
      setSavedCandidate(saved);
      setSuccess(editing ? "Los datos se actualizaron correctamente." : "La candidatura se creó correctamente.");
      if (!editing) setValues(initialValues());
    } catch (caughtError) {
      setRequestError(caughtError instanceof Error ? caughtError.message : "No se pudieron guardar los datos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={editing ? `/candidates/${candidate.id}` : "/"} className="text-sm font-semibold text-blue-700 hover:text-blue-900">← Volver</Link>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">{editing ? "Editar candidatura" : "Nueva candidatura"}</h1>
        <p className="mt-2 text-slate-600">{editing ? "Actualiza la información registrada." : "Registra una candidatura para la campaña de Zaragoza."}</p>
      </div>

      {errors.length > 0 && <Feedback type="error">{errors.join(" ")}</Feedback>}
      {saving && <Feedback type="loading">Guardando candidatura…</Feedback>}
      {requestError && <Feedback type="error">{requestError}</Feedback>}
      {success && (
        <Feedback type="success">
          {success}{" "}
          {savedCandidate && <Link className="font-semibold underline" href={`/candidates/${savedCandidate.id}`}>Ver detalle</Link>}
        </Feedback>
      )}

      <form noValidate onSubmit={handleSubmit} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <Field label="Nombre completo" required><input className="field" required value={values.full_name} onChange={(event) => setField("full_name", event.target.value)} /></Field>
        <Field label="Correo electrónico" required><input className="field" required type="email" value={values.email} onChange={(event) => setField("email", event.target.value)} /></Field>
        <Field label="Teléfono" required><input className="field" required type="tel" value={values.phone} onChange={(event) => setField("phone", event.target.value)} /></Field>
        <Field label="Puesto" required><input className="field" required value={values.position} onChange={(event) => setField("position", event.target.value)} /></Field>
        <Field label="Años de experiencia" required><input className="field" required type="number" min="0" step="1" value={values.experience_years} onChange={(event) => setField("experience_years", event.target.value)} /></Field>
        <Field label="Perfil de LinkedIn"><input className="field" type="url" value={values.linkedin_url} onChange={(event) => setField("linkedin_url", event.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Enlace al currículum"><input className="field" type="url" value={values.cv_url} onChange={(event) => setField("cv_url", event.target.value)} /></Field></div>
        <div className="flex justify-end gap-3 sm:col-span-2">
          <Link href={editing ? `/candidates/${candidate.id}` : "/"} className="button-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="button-primary disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear candidatura"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{required && <span aria-hidden="true"> *</span>}<span className="mt-1 block">{children}</span></label>;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
